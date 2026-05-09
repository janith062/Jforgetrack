import { supabase } from './supabase';
import { DEFAULT_GEMINI_MODEL, getGeminiModel, hasGeminiApiKey } from './gemini';

const GEMINI_BACKOFF_KEY = 'forgetrack-gemini-backoff-until';

function getGeminiBackoffUntil() {
  if (typeof window === 'undefined') return 0;
  const raw = window.sessionStorage.getItem(GEMINI_BACKOFF_KEY);
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

function setGeminiBackoff(delayMs) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(GEMINI_BACKOFF_KEY, String(Date.now() + delayMs));
}

function getGeminiCooldownMessage() {
  const backoffUntil = getGeminiBackoffUntil();
  if (!backoffUntil || backoffUntil <= Date.now()) return null;
  const seconds = Math.max(1, Math.ceil((backoffUntil - Date.now()) / 1000));
  return `Gemini is temporarily rate-limited, so local analysis was used instead. Try again in about ${seconds}s if you want AI analysis.`;
}

function parseRetryDelayMs(message) {
  const retryInfo = message.match(/retry in\s+([0-9.]+)s/i);
  if (retryInfo) return Math.ceil(Number(retryInfo[1]) * 1000);

  const retryDelay = message.match(/"retryDelay":"(\d+)s"/i);
  if (retryDelay) return Number(retryDelay[1]) * 1000;

  return 30000;
}

// ─── Gemini Helper ────────────────────────────────────────────────────────────
async function askGemini(prompt) {
  const model = getGeminiModel();
  if (!model) {
    throw new Error('Gemini API key is not configured or invalid.');
  }
  
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('Gemini API Error:', err);
    if (err.message?.includes('429')) {
      throw new Error('Gemini API quota exceeded. Please wait a minute or check your plan in Google AI Studio.');
    }
    if (err.message?.includes('404')) {
      throw new Error(`Gemini model not found. Your API key might not have access to the default model. Please contact support.`);
    }
    throw err;
  }
}

async function askGeminiJSON(prompt) {
  const raw = await askGemini(`${prompt}\n\nReturn ONLY valid JSON. No markdown, no code blocks.`);
  const clean = raw.replace(/```json?/g, '').replace(/```/g, '').trim();
  return JSON.parse(clean);
}

export async function analyzeSpreadsheet(headers, sampleRows) {
  const fallbackAnalysis = inferSpreadsheetStructure(headers, sampleRows);
  const cooldownMessage = getGeminiCooldownMessage();
  const headerList = headers.join(' | ');
  const sampleStr = sampleRows
    .slice(0, 3)
    .map((row) => headers.map((header) => row[header] ?? '').join(' | '))
    .join('\n');

  const prompt = `
You are an expert data analyst for a student attendance system.
Database schema:
- students: id (int), name (text), usn (text unique), email (text)
- sessions: id (int), date (DATE), topic (text), month_number (int), session_type (text)
- attendance: student_id, session_id, present (boolean)

The user uploaded a spreadsheet with these headers:
${headerList}

Sample data rows (first 3):
${sampleStr}

Tasks:
1. Determine the FORMAT:
   - "wide": Each row = one student. Columns after student info = attendance for different sessions/dates.
   - "long": Each row = one attendance record (student + date + status).

2. Map each header to one of:
   - "student_name": Student's full name
   - "usn": Student's unique USN/roll number
   - "email": Student's email
   - "topic": Session topic
   - "session_type": online/offline
   - "attendance_status": P/A/1/0/Present/Absent type column (for long format)
   - "date_HEADER": A session date column - use "date_" + the original header value (for wide format)
   - "IGNORE": Column to skip

3. If format is "wide", list which columns are session/date columns.

4. Check if any session date columns are MISSING actual dates in their headers (e.g., headers like "Session 1", "Day 1", "Column A" with no date).

5. Infer the attendance value semantics: what does "present" look like? (e.g., "P", "1", "Present", "Yes")

Return JSON:
{
  "format": "wide" or "long",
  "mapping": { "<header>": "<mapped_field>" },
  "sessionCols": ["<col1>", "<col2>"] (for wide format, the session/attendance columns),
  "dateMissing": true or false,
  "presentValues": ["P", "1", "Present"],
  "absentValues": ["A", "0", "Absent"],
  "reasoning": "<1-2 sentence explanation of what you found>"
}
`;

  if (!hasGeminiApiKey) {
    return {
      ...fallbackAnalysis,
      analysisSource: 'heuristic',
      warning: 'Gemini API key is missing or unreadable, so local analysis was used instead.',
    };
  }

  if (cooldownMessage) {
    return {
      ...fallbackAnalysis,
      analysisSource: 'heuristic',
      warning: cooldownMessage,
    };
  }

  try {
    const aiAnalysis = await askGeminiJSON(prompt);
    return { ...aiAnalysis, analysisSource: 'gemini' };
  } catch (error) {
    const message = String(error?.message || error);
    const invalidKey = /api key|api_key_invalid|permission denied|unauthorized|400/i.test(message);
    const quotaExceeded = /quota|429|rate.?limit|resource exhausted/i.test(message);
    if (quotaExceeded) {
      setGeminiBackoff(parseRetryDelayMs(message));
    }
    return {
      ...fallbackAnalysis,
      analysisSource: 'heuristic',
      warning: invalidKey
        ? 'Gemini rejected the configured API key, so local analysis was used instead.'
        : quotaExceeded
        ? 'Gemini quota is currently exhausted, so local analysis was used instead.'
        : `Gemini analysis failed (${message}), so local analysis was used instead.`,
    };
  }
}

function inferSpreadsheetStructure(headers, sampleRows) {
  const sampleValuesByHeader = Object.fromEntries(
    headers.map((header) => [
      header,
      sampleRows
        .map((row) => row?.[header])
        .filter((value) => value !== null && value !== undefined)
        .map((value) => String(value).trim())
        .filter(Boolean),
    ])
  );

  const statusInfoByHeader = Object.fromEntries(
    headers.map((header) => [header, analyzeStatusValues(sampleValuesByHeader[header] || [])])
  );

  const mapping = {};
  const sessionCols = [];
  const explicitDateCols = [];
  const implicitSessionCols = [];

  headers.forEach((header) => {
    const normalized = normalizeHeader(header);
    const statusInfo = statusInfoByHeader[header];

    if (looksLikeEmailHeader(normalized)) {
      mapping[header] = 'email';
      return;
    }

    if (looksLikeUsnHeader(normalized)) {
      mapping[header] = 'usn';
      return;
    }

    if (looksLikeNameHeader(normalized)) {
      mapping[header] = 'student_name';
      return;
    }

    if (looksLikeTopicHeader(normalized)) {
      mapping[header] = 'topic';
      return;
    }

    if (looksLikeSessionTypeHeader(normalized)) {
      mapping[header] = 'session_type';
      return;
    }

    if (hasExplicitDate(header)) {
      mapping[header] = `date_${header}`;
      explicitDateCols.push(header);
      return;
    }

    if (statusInfo.isAttendanceLike && isImplicitSessionHeader(normalized)) {
      mapping[header] = `date_${header}`;
      implicitSessionCols.push(header);
      return;
    }

    if (looksLikeAttendanceStatusHeader(normalized)) {
      mapping[header] = 'attendance_status';
      return;
    }

    mapping[header] = 'IGNORE';
  });

  const inferredSessionCols = explicitDateCols.length > 0 ? explicitDateCols : implicitSessionCols;
  inferredSessionCols.forEach((header) => {
    if (!mapping[header]?.startsWith('date_')) {
      mapping[header] = `date_${header}`;
    }
    sessionCols.push(header);
  });

  const explicitStatusCol = headers.find((header) => mapping[header] === 'attendance_status');
  const wideScore = sessionCols.length;
  const longScore = explicitStatusCol ? 2 : 0;
  const format = longScore > wideScore ? 'long' : 'wide';

  if (format === 'long') {
    const firstSessionCol = sessionCols[0];
    if (firstSessionCol) {
      mapping[firstSessionCol] = 'topic';
      sessionCols.length = 0;
    }
  }

  const mergedStatusInfo = mergeStatusInfo(Object.values(statusInfoByHeader));

  return {
    format,
    mapping,
    sessionCols: format === 'wide' ? sessionCols : [],
    dateMissing: format === 'wide' ? sessionCols.some((header) => !hasExplicitDate(header)) : false,
    presentValues: mergedStatusInfo.presentValues,
    absentValues: mergedStatusInfo.absentValues,
    reasoning: buildFallbackReasoning(format, sessionCols, explicitStatusCol),
  };
}

function normalizeHeader(header) {
  return String(header || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeEmailHeader(header) {
  return /\b(email|e mail|mail id)\b/.test(header);
}

function looksLikeUsnHeader(header) {
  return /\b(usn|roll|roll no|reg no|register no|student id|student code|id no)\b/.test(header);
}

function looksLikeNameHeader(header) {
  return /\b(student name|full name|name|learner name)\b/.test(header) && !/\bparent|mentor|trainer\b/.test(header);
}

function looksLikeTopicHeader(header) {
  return /\b(topic|subject|module|session topic|class topic)\b/.test(header);
}

function looksLikeSessionTypeHeader(header) {
  return /\b(type|mode|session type|delivery)\b/.test(header);
}

function looksLikeAttendanceStatusHeader(header) {
  return /\b(attendance|status|present|absent)\b/.test(header);
}

function hasExplicitDate(header) {
  const text = String(header || '').trim();
  return /\b\d{4}-\d{2}-\d{2}\b/.test(text)
    || /\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/.test(text)
    || /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b/i.test(text);
}

function isImplicitSessionHeader(header) {
  return /\b(day|session|attendance|class)\b/.test(header);
}

function analyzeStatusValues(values) {
  const knownPresent = new Set(['p', '1', 'present', 'yes', 'y', 'true']);
  const knownAbsent = new Set(['a', '0', 'absent', 'no', 'n', 'false']);
  const normalizedValues = values.map((value) => String(value).trim()).filter(Boolean);
  const uniqueNormalized = [...new Set(normalizedValues.map((value) => value.toLowerCase()))];

  let recognizedCount = 0;
  const presentValues = [];
  const absentValues = [];

  uniqueNormalized.forEach((value) => {
    if (knownPresent.has(value)) {
      recognizedCount += 1;
      presentValues.push(value);
    } else if (knownAbsent.has(value)) {
      recognizedCount += 1;
      absentValues.push(value);
    }
  });

  const ratio = uniqueNormalized.length > 0 ? recognizedCount / uniqueNormalized.length : 0;

  return {
    isAttendanceLike: normalizedValues.length > 0 && (ratio >= 0.5 || recognizedCount >= 2),
    presentValues,
    absentValues,
  };
}

function mergeStatusInfo(statusInfos) {
  const present = new Set();
  const absent = new Set();

  statusInfos.forEach((info) => {
    info.presentValues.forEach((value) => present.add(value));
    info.absentValues.forEach((value) => absent.add(value));
  });

  return {
    presentValues: present.size > 0 ? [...present] : ['P', 'Present', '1', 'Yes'],
    absentValues: absent.size > 0 ? [...absent] : ['A', 'Absent', '0', 'No'],
  };
}

function buildFallbackReasoning(format, sessionCols, explicitStatusCol) {
  if (format === 'long') {
    return explicitStatusCol
      ? `I detected a row-by-row attendance layout with a dedicated "${explicitStatusCol}" status column.`
      : 'I detected a row-by-row attendance layout based on the available status fields.';
  }

  if (sessionCols.length > 0) {
    return `I detected a wide attendance sheet with ${sessionCols.length} session column(s): ${sessionCols.slice(0, 3).join(', ')}${sessionCols.length > 3 ? '...' : ''}.`;
  }

  return 'I used a local fallback analyzer, but the sheet does not clearly resemble an attendance workbook.';
}

export function reconstructDates(sessionCount, weekdays, startDate) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDays = weekdays.map((day) => dayNames.indexOf(day));

  const dates = [];
  const cursor = new Date(startDate);

  while (dates.length < sessionCount) {
    if (targetDays.includes(cursor.getDay())) {
      dates.push(cursor.toISOString().split('T')[0]);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export async function checkConflicts(dates) {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, date, topic')
    .in('date', dates);

  if (error) throw error;
  return data || [];
}

export async function buildImportPlan(rows, analysis, dateMap, conflictResolutions, dbStudents) {
  const { mapping, sessionCols, presentValues, format } = analysis;
  const resolutionMap = {};
  conflictResolutions.forEach((resolution) => {
    resolutionMap[resolution.date] = resolution.action;
  });

  const plan = {
    students: [],
    sessions: [],
    attendance: [],
    warnings: [],
    skipped: [],
  };

  const nameCol = Object.keys(mapping).find((key) => mapping[key] === 'student_name');
  const usnCol = Object.keys(mapping).find((key) => mapping[key] === 'usn');
  const emailCol = Object.keys(mapping).find((key) => mapping[key] === 'email');
  const branchCol = Object.keys(mapping).find((key) => mapping[key] === 'branch_code') || findHeaderMatch(rows, ['branch_code', 'branch code', 'branch']);
  const admissionCol = Object.keys(mapping).find((key) => mapping[key] === 'admission_number') || findHeaderMatch(rows, ['admission_number', 'admission number', 'admission no']);
  const plannedStudentsByUsn = new Map();
  const plannedStudentsByEmail = new Map();

  const datesToProcess = new Set();
  if (format === 'wide') {
    sessionCols.forEach((col) => {
      const date = dateMap[col];
      if (date) datesToProcess.add(date);
    });
  }

  const datesToSkip = new Set(
    conflictResolutions.filter((resolution) => resolution.action === 'skip').map((resolution) => resolution.date)
  );

  for (const date of datesToProcess) {
    if (datesToSkip.has(date)) {
      plan.skipped.push(date);
      continue;
    }
    if (resolutionMap[date] !== 'overwrite') {
      const existing = conflictResolutions.find((resolution) => resolution.date === date && resolution.action !== 'overwrite');
      if (!existing) {
        plan.sessions.push({
          date,
          topic: 'Imported Session',
          month_number: new Date(date).getMonth() + 1,
          session_type: 'offline',
          duration_hours: 2.0,
        });
      }
    }
  }

  for (const row of rows) {
    const rawName = nameCol ? (row[nameCol] || '').trim() : '';
    const rawUsn = usnCol ? (row[usnCol] || '').trim() : '';
    const rawEmail = emailCol ? (row[emailCol] || '').trim() : '';
    const rawBranch = branchCol ? (row[branchCol] || '').trim() : '';
    const rawAdmission = admissionCol ? (row[admissionCol] || '').trim() : '';

    if (!rawName && !rawUsn && !rawEmail) continue;

    const matchedStudent = resolveStudent(rawName, rawUsn, rawEmail, dbStudents);
    let effectiveStudent = matchedStudent.student;

    if (!effectiveStudent) {
      const existingPlannedStudent = getPlannedStudent(rawUsn, rawEmail, plannedStudentsByUsn, plannedStudentsByEmail);

      if (existingPlannedStudent) {
        effectiveStudent = existingPlannedStudent;
      } else if (rawName && rawUsn && rawBranch) {
        const placeholderId = `new:${plan.students.length + 1}`;
        effectiveStudent = {
          id: placeholderId,
          name: rawName,
          usn: rawUsn,
          email: rawEmail || null,
          admission_number: rawAdmission || null,
          branch_code: rawBranch,
          _isNew: true,
        };
        plan.students.push(effectiveStudent);
        plannedStudentsByUsn.set(rawUsn.toLowerCase(), effectiveStudent);
        if (rawEmail) {
          plannedStudentsByEmail.set(rawEmail.toLowerCase(), effectiveStudent);
        }
      } else {
        plan.warnings.push({
          type: 'unmatched_student',
          rawName,
          rawUsn,
          rawEmail,
          confidence: matchedStudent.confidence,
          message: `Could not match student "${rawName || rawUsn}" (confidence: ${matchedStudent.confidence}%)`,
        });
        continue;
      }
    }

    if (format === 'wide') {
      for (const col of sessionCols) {
        const date = dateMap[col];
        if (!date || datesToSkip.has(date)) continue;

        const rawStatus = (row[col] || '').toString().trim();
        const isPresent = presentValues.some((value) => rawStatus.toLowerCase() === value.toLowerCase());

        plan.attendance.push({
          studentId: effectiveStudent.id,
          studentName: effectiveStudent.name,
          date,
          present: isPresent,
          rawStatus,
        });
      }
    }
  }

  return plan;
}

function findHeaderMatch(rows, candidates) {
  const sampleRow = rows[0];
  if (!sampleRow) return null;
  const keys = Object.keys(sampleRow);
  return keys.find((key) => candidates.includes(normalizeHeader(key))) || null;
}

function getPlannedStudent(rawUsn, rawEmail, plannedStudentsByUsn, plannedStudentsByEmail) {
  if (rawUsn) {
    const byUsn = plannedStudentsByUsn.get(rawUsn.toLowerCase());
    if (byUsn) return byUsn;
  }
  if (rawEmail) {
    const byEmail = plannedStudentsByEmail.get(rawEmail.toLowerCase());
    if (byEmail) return byEmail;
  }
  return null;
}

function resolveStudent(name, usn, email, dbStudents) {
  if (usn) {
    const match = dbStudents.find((student) => student.usn?.toLowerCase() === usn.toLowerCase());
    if (match) return { student: match, confidence: 100, method: 'usn' };
  }

  if (email) {
    const match = dbStudents.find((student) => student.email?.toLowerCase() === email.toLowerCase());
    if (match) return { student: match, confidence: 100, method: 'email' };
  }

  if (name) {
    let best = null;
    let bestScore = 0;
    for (const student of dbStudents) {
      const score = nameSimilarity(name.toLowerCase(), student.name.toLowerCase());
      if (score > bestScore) {
        bestScore = score;
        best = student;
      }
    }
    if (best && bestScore >= 0.85) {
      return { student: best, confidence: Math.round(bestScore * 100), method: 'name_fuzzy' };
    }
    if (best) {
      return { student: null, confidence: Math.round(bestScore * 100), method: 'name_fuzzy_low' };
    }
  }

  return { student: null, confidence: 0, method: 'none' };
}

function nameSimilarity(a, b) {
  const bigrams = (value) => {
    const set = new Set();
    for (let index = 0; index < value.length - 1; index += 1) {
      set.add(value[index] + value[index + 1]);
    }
    return set;
  };

  const left = bigrams(a);
  const right = bigrams(b);
  let intersection = 0;
  left.forEach((gram) => {
    if (right.has(gram)) intersection += 1;
  });
  return intersection / (left.size + right.size - intersection || 1);
}

export async function commitImport(plan, conflictResolutions, importedBy, onProgress) {
  const resolutionMap = {};
  conflictResolutions.forEach((resolution) => {
    resolutionMap[resolution.date] = resolution;
  });

  const dateToSessionId = {};
  const studentIdMap = {};
  let progress = 0;
  const total = plan.students.length + plan.sessions.length + plan.attendance.length;

  for (const student of plan.students) {
    const payload = {
      name: student.name,
      usn: student.usn,
      email: student.email,
      admission_number: student.admission_number,
      branch_code: student.branch_code,
    };

    const { data, error } = await supabase
      .from('students')
      .upsert(payload, { onConflict: 'usn' })
      .select('id, usn')
      .single();

    if (error) throw new Error(`Failed to create student ${student.name}: ${error.message}`);
    studentIdMap[student.id] = data.id;
    progress += 1;
    onProgress(progress, total);
  }

  for (const session of plan.sessions) {
    const resolution = resolutionMap[session.date];

    if (resolution?.action === 'overwrite' && resolution.existingSessionId) {
      dateToSessionId[session.date] = resolution.existingSessionId;
    } else {
      const { data, error } = await supabase
        .from('sessions')
        .insert(session)
        .select('id')
        .single();
      if (error) throw new Error(`Failed to create session for ${session.date}: ${error.message}`);
      dateToSessionId[session.date] = data.id;
    }
    onProgress(++progress, total);
  }

  conflictResolutions.forEach((resolution) => {
    if (resolution.existingSessionId && !dateToSessionId[resolution.date]) {
      dateToSessionId[resolution.date] = resolution.existingSessionId;
    }
  });

  const attendanceBatch = plan.attendance
    .filter((attendance) => dateToSessionId[attendance.date])
    .map((attendance) => ({
      student_id: studentIdMap[attendance.studentId] || attendance.studentId,
      session_id: dateToSessionId[attendance.date],
      present: attendance.present,
      marked_by: importedBy,
    }));

  if (attendanceBatch.length > 0) {
    for (let index = 0; index < attendanceBatch.length; index += 100) {
      const chunk = attendanceBatch.slice(index, index + 100);
      const { error } = await supabase
        .from('attendance')
        .upsert(chunk, { onConflict: 'student_id,session_id' });
      if (error) throw new Error(`Attendance write failed: ${error.message}`);
      progress += chunk.length;
      onProgress(progress, total);
    }
  }

  await supabase.from('import_log').insert({
    filename: 'ai_import',
    uploaded_by: importedBy,
    total_rows: plan.attendance.length + plan.warnings.length,
    imported_rows: plan.attendance.length,
    skipped_rows: plan.skipped.length,
    status: 'completed',
    warnings: plan.warnings.length > 0 ? plan.warnings : null,
  });

  return {
    imported: plan.attendance.length,
    warnings: plan.warnings.length,
    skipped: plan.skipped.length,
  };
}

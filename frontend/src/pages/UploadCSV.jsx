import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Bot, CheckCircle2, AlertTriangle, Loader2, ArrowRight, Database, SkipForward, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { ChatBubble } from '../components/ui/ChatBubble';
import { analyzeSpreadsheet, reconstructDates, checkConflicts, buildImportPlan, commitImport } from '../lib/attendanceAgent';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function normalizeCell(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split('T')[0];
  }
  return String(value).trim();
}

function scoreHeaderRow(row) {
  const cells = (row || []).map(normalizeCell);
  const nonEmpty = cells.filter(Boolean);
  if (nonEmpty.length === 0) return -1;

  let score = nonEmpty.length;
  nonEmpty.forEach((cell) => {
    const lower = cell.toLowerCase();
    if (/(name|email|usn|attendance|date|admission|branch|score)/.test(lower)) score += 4;
    if (/day\s+\d+/.test(lower)) score += 2;
    if (/^https?:\/\//.test(lower)) score -= 3;
  });

  return score;
}

function isLikelyMetadataRow(row) {
  const cells = (row || []).map(normalizeCell);
  const nonEmpty = cells.filter(Boolean);
  if (nonEmpty.length === 0) return true;
  return nonEmpty.every((cell) => /^day\s+\d+$/i.test(cell) || cell === '');
}

function makeUniqueHeaders(headers) {
  const seen = new Map();
  return headers.map((header, index) => {
    const base = header || `Column ${index + 1}`;
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
}

function toIsoDateString(value) {
  const text = normalizeCell(value);
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return text;

  const slashOrDashMatch = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (slashOrDashMatch) {
    const [, dayRaw, monthRaw, yearRaw] = slashOrDashMatch;
    const day = Number(dayRaw);
    const month = Number(monthRaw);
    let year = Number(yearRaw);
    if (yearRaw.length === 2) {
      year += year >= 70 ? 1900 : 2000;
    }
    return `${year.toString().padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

function parseWorksheet(sheet) {
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headerRowIndex = grid.reduce((bestIndex, row, index, allRows) => {
    return scoreHeaderRow(row) > scoreHeaderRow(allRows[bestIndex] || []) ? index : bestIndex;
  }, 0);

  const headerRow = grid[headerRowIndex] || [];
  const parentRow = headerRowIndex > 0 && isLikelyMetadataRow(grid[headerRowIndex - 1]) ? grid[headerRowIndex - 1] : [];

  const rawHeaders = headerRow.map((cell, index) => {
    const base = normalizeCell(cell);
    const parent = normalizeCell(parentRow[index]);
    if (parent && base) return `${parent} ${base}`;
    return base || parent || '';
  });

  const headers = makeUniqueHeaders(rawHeaders);
  const rows = grid
    .slice(headerRowIndex + 1)
    .map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] ?? '';
      });
      return obj;
    })
    .filter((row) => Object.values(row).some((value) => value !== ''));

  return { headers, rows };
}

export default function UploadCSV() {
  const { user } = useAuth();

  // Wizard state machine
  const [step, setStep] = useState('upload'); 
  // Steps: upload → sheet-select → analyzing → date-missing → conflict → dry-run → importing → done

  // File & Sheet State
  const [workbook, setWorkbook] = useState(null);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [allSheetNames, setAllSheetNames] = useState([]);
  const fileInputRef = useRef(null);

  // AI Analysis State
  const [analysis, setAnalysis] = useState(null);
  const [chatLog, setChatLog] = useState([]);

  // Date Reconstruction State
  const [selectedWeekdays, setSelectedWeekdays] = useState([]);
  const [programStartDate, setProgramStartDate] = useState('');
  const [dateMap, setDateMap] = useState({});

  // Conflict State
  const [conflicts, setConflicts] = useState([]);
  const [resolutions, setResolutions] = useState({});

  // Import Plan & Progress
  const [importPlan, setImportPlan] = useState(null);
  const [dbStudents, setDbStudents] = useState([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState(null);
  const chatMessageCounterRef = useRef(0);

  const addChat = (role, content, status = 'done') => {
    chatMessageCounterRef.current += 1;
    setChatLog(prev => [...prev, { role, content, status, id: `chat-${chatMessageCounterRef.current}` }]);
  };

  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLog]);

  // ── Step 1: File Upload ─────────────────────────────────────────────────────
  const handleFileDrop = async (file) => {
    if (!file) return;
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array', cellDates: true });
    setWorkbook(wb);

    if (wb.SheetNames.length === 1) {
      setSelectedSheets([wb.SheetNames[0]]);
      setAllSheetNames(wb.SheetNames);
      setStep('analyzing');
      runAnalysis(wb, [wb.SheetNames[0]]);
    } else {
      setAllSheetNames(wb.SheetNames);
      setStep('sheet-select');
      addChat('ai', `I found ${wb.SheetNames.length} sheets in this workbook: ${wb.SheetNames.join(', ')}. Which ones should I process?`);
    }
  };

  const onFileInput = (e) => handleFileDrop(e.target.files[0]);

  const onDrop = (e) => {
    e.preventDefault();
    handleFileDrop(e.dataTransfer.files[0]);
  };

  // ── Step 2: Sheet Selection ─────────────────────────────────────────────────
  const confirmSheets = () => {
    if (selectedSheets.length === 0) return;
    addChat('user', `Process these sheets: ${selectedSheets.join(', ')}`);
    setStep('analyzing');
    runAnalysis(workbook, selectedSheets);
  };

  // ── Step 3: AI Analysis ─────────────────────────────────────────────────────
  const runAnalysis = async (wb, sheets) => {
    addChat('ai', 'Analyzing your spreadsheet structure...', 'thinking');
    try {
      const { headers, rows } = parseWorksheet(wb.Sheets[sheets[0]]);

      // Load DB students
      const { data: students } = await supabase.from('students').select('id, name, usn, email');
      setDbStudents(students || []);

      const result = await analyzeSpreadsheet(headers, rows.slice(0, 3));
      setAnalysis({ ...result, rows, headers });

      setChatLog(prev => prev.filter(m => m.status !== 'thinking'));
      addChat('ai', `✅ ${result.reasoning}`);
      if (result.warning) {
        addChat('ai', `⚠️ ${result.warning}`);
      }

      if (result.dateMissing) {
        addChat('ai', `I noticed the session columns don't have explicit dates. I'll need to reconstruct the dates. Which days of the week does this class usually meet?`);
        setStep('date-missing');
      } else {
        const dates = result.sessionCols.map(col => {
          return toIsoDateString(col.replace('date_', '')) || col.replace('date_', '');
        }).filter(Boolean);

        const dm = {};
        result.sessionCols.forEach((col, i) => { if (dates[i]) dm[col] = dates[i]; });
        setDateMap(dm);
        await runConflictCheck(dates, result, rows, students || [], dm);
      }
    } catch (err) {
      setChatLog(prev => prev.filter(m => m.status !== 'thinking'));
      addChat('ai', `Error analyzing file: ${err.message}`, 'error');
      setStep('upload');
    }
  };

  // ── Step 2b: Date Reconstruction ────────────────────────────────────────────
  const confirmDates = async () => {
    if (!programStartDate || selectedWeekdays.length === 0) return;
    addChat('user', `Class meets on ${selectedWeekdays.join(', ')}, starting ${programStartDate}`);

    const sessionCount = analysis.sessionCols.length;
    const dates = reconstructDates(sessionCount, selectedWeekdays, programStartDate);
    const dm = {};
    analysis.sessionCols.forEach((col, i) => { dm[col] = dates[i]; });
    setDateMap(dm);

    addChat('ai', `Got it! I've mapped ${sessionCount} sessions to dates from ${dates[0]} to ${dates[dates.length - 1]}.`);
    await runConflictCheck(dates, analysis, analysis.rows, dbStudents, dm);
  };

  // ── Step 4: Conflict Check ──────────────────────────────────────────────────
  const runConflictCheck = async (dates, analysisData, rows, students, dm) => {
    addChat('ai', 'Checking for existing records in the database...', 'thinking');
    try {
      const existing = await checkConflicts(dates);
      setChatLog(prev => prev.filter(m => m.status !== 'thinking'));

      if (existing.length > 0) {
        setConflicts(existing);
        const defaultRes = {};
        existing.forEach(s => { defaultRes[s.date] = { action: 'skip', existingSessionId: s.id }; });
        setResolutions(defaultRes);
        addChat('ai', `⚠️ I found ${existing.length} date conflict(s). Please choose how to handle each one before I proceed.`);
        setStep('conflict');
      } else {
        addChat('ai', `No conflicts found. Building import preview...`);
        await runDryRun(analysisData, dm, rows, students, []);
      }
    } catch (err) {
      setChatLog(prev => prev.filter(m => m.status !== 'thinking'));
      addChat('ai', `Conflict check failed: ${err.message}`, 'error');
    }
  };

  // ── Step 5: Dry Run ─────────────────────────────────────────────────────────
  const confirmConflicts = async () => {
    const resolutionList = Object.entries(resolutions).map(([date, r]) => ({ date, ...r }));
    addChat('user', 'Conflict resolutions confirmed.');
    // dateMap state is reliable here since user interacted with conflict step after it was set
    await runDryRun(analysis, dateMap, analysis.rows, dbStudents, resolutionList);
  };

  const runDryRun = async (analysisData, dm, rows, students, resolutionList) => {
    addChat('ai', 'Building import preview...', 'thinking');
    try {
      const plan = await buildImportPlan(rows, analysisData, dm, resolutionList, students);
      setImportPlan(plan);
      setChatLog(prev => prev.filter(m => m.status !== 'thinking'));
      addChat('ai', `📋 Preview ready: ${plan.attendance.length} records to import, ${plan.students.length} new students to create, ${plan.warnings.length} unmatched students, ${plan.skipped.length} sessions skipped.`);
      setStep('dry-run');
    } catch (err) {
      setChatLog(prev => prev.filter(m => m.status !== 'thinking'));
      addChat('ai', `Failed to build plan: ${err.message}`, 'error');
    }
  };

  // ── Step 6: Commit Import ───────────────────────────────────────────────────
  const runImport = async () => {
    setStep('importing');
    const resolutionList = Object.entries(resolutions).map(([date, r]) => ({ date, ...r }));
    const total = importPlan.sessions.length + importPlan.attendance.length;
    setImportProgress({ current: 0, total });

    try {
      const displayName = user?.user_metadata?.display_name || user?.email || 'mentor';
      const result = await commitImport(
        importPlan,
        resolutionList,
        displayName,
        (cur, tot) => setImportProgress({ current: cur, total: tot })
      );
      setImportResult(result);
      setStep('done');
    } catch (err) {
      addChat('ai', `Import failed: ${err.message}`, 'error');
      setStep('dry-run');
    }
  };

  const reset = () => {
    setStep('upload');
    setWorkbook(null); setSelectedSheets([]); setAllSheetNames([]);
    setAnalysis(null); setChatLog([]); setDateMap({});
    setConflicts([]); setResolutions({}); setImportPlan(null);
    setImportResult(null); setSelectedWeekdays([]); setProgramStartDate('');
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-display-sm text-fg-primary mb-1">AI Attendance Import</h1>
        <p className="text-body text-fg-secondary">Upload CSV or XLSX files — the AI agent handles the rest.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Main Wizard Panel ─────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* STEP: Upload */}
          {step === 'upload' && (
            <Card
              className="p-12 border-dashed border-2 hover:border-accent-glow/50 transition-all cursor-pointer group"
              onClick={() => fileInputRef.current.click()}
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
            >
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileInput} />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-accent-glow/10 border border-accent-glow/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Upload size={28} className="text-accent-glow" />
                </div>
                <h3 className="text-h3 text-fg-primary mb-2">Drop your attendance file here</h3>
                <p className="text-body-sm text-fg-tertiary mb-6 text-center max-w-xs">
                  Supports .csv, .xlsx, .xls · Any format · AI will handle mapping
                </p>
                <Button variant="secondary">Browse Files</Button>
              </div>
            </Card>
          )}

          {/* STEP: Sheet Select */}
          {step === 'sheet-select' && (
            <Card className="p-8">
              <CardHeader label="STEP 1" title="Select Sheets to Process" icon={Database} />
              <p className="text-body-sm text-fg-secondary mt-2 mb-6">
                Your workbook has multiple sheets. Choose which ones to import.
              </p>
              <div className="space-y-2">
                {allSheetNames.map(name => (
                  <label key={name} className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle hover:border-border-default cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSheets.includes(name)}
                      onChange={e => setSelectedSheets(prev =>
                        e.target.checked ? [...prev, name] : prev.filter(s => s !== name)
                      )}
                      className="accent-accent-glow"
                    />
                    <span className="text-body text-fg-primary">{name}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={confirmSheets} disabled={selectedSheets.length === 0}>
                  Analyze Selected Sheets
                </Button>
              </div>
            </Card>
          )}

          {/* STEP: Analyzing */}
          {step === 'analyzing' && (
            <Card className="p-12 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent-glow/10 border border-accent-glow/30 flex items-center justify-center">
                <Bot size={28} className="text-accent-glow animate-pulse" />
              </div>
              <p className="text-body text-fg-secondary">AI agent is analyzing your spreadsheet...</p>
            </Card>
          )}

          {/* STEP: Date Missing */}
          {step === 'date-missing' && (
            <Card className="p-8">
              <CardHeader label="DATE RECONSTRUCTION" title="Session Schedule" icon={Bot} />
              <p className="text-body-sm text-fg-secondary mt-2 mb-6">
                The session columns don't have explicit dates. Tell me about the class schedule.
              </p>
              <div className="mb-4">
                <label className="text-caption text-fg-tertiary uppercase mb-2 block">Which days does class meet?</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedWeekdays(prev =>
                        prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                      )}
                      className={`px-3 py-1.5 rounded-full text-body-sm border transition-all ${
                        selectedWeekdays.includes(day)
                          ? 'bg-accent-glow/15 border-accent-glow text-accent-glow'
                          : 'bg-surface-inset border-border-subtle text-fg-secondary hover:border-border-default'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="text-caption text-fg-tertiary uppercase mb-2 block">Program Start Date</label>
                <input
                  type="date"
                  value={programStartDate}
                  onChange={e => setProgramStartDate(e.target.value)}
                  className="input w-full"
                />
              </div>
              <Button
                onClick={confirmDates}
                disabled={!programStartDate || selectedWeekdays.length === 0}
              >
                Reconstruct Dates
              </Button>
            </Card>
          )}

          {/* STEP: Conflict Resolution */}
          {step === 'conflict' && (
            <Card className="p-8">
              <CardHeader label="CONFLICTS DETECTED" title="Resolve Data Conflicts" icon={AlertTriangle} />
              <p className="text-body-sm text-fg-secondary mt-2 mb-6">
                These sessions already exist in the database. Choose how to handle each one.
              </p>
              <div className="space-y-3">
                {conflicts.map(conflict => (
                  <div key={conflict.date} className="p-4 rounded-lg border border-warning/30 bg-warning/5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-body font-medium text-fg-primary">{conflict.date}</p>
                        <p className="text-body-sm text-fg-tertiary">{conflict.topic}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {['skip', 'overwrite', 'merge'].map(action => (
                          <button
                            key={action}
                            onClick={() => setResolutions(prev => ({
                              ...prev,
                              [conflict.date]: { action, existingSessionId: conflict.id }
                            }))}
                            className={`px-3 py-1 rounded-md text-caption capitalize border transition-all ${
                              resolutions[conflict.date]?.action === action
                                ? action === 'skip'
                                  ? 'bg-fg-tertiary/20 border-fg-tertiary text-fg-primary'
                                  : action === 'overwrite'
                                  ? 'bg-danger/20 border-danger text-danger'
                                  : 'bg-success/20 border-success text-success'
                                : 'bg-surface border-border-subtle text-fg-tertiary hover:border-border-default'
                            }`}
                          >
                            {action === 'skip' && <SkipForward size={10} className="inline mr-1" />}
                            {action === 'overwrite' && <RefreshCw size={10} className="inline mr-1" />}
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={confirmConflicts}
                  disabled={conflicts.some(c => !resolutions[c.date])}
                >
                  Continue with Resolutions
                </Button>
              </div>
            </Card>
          )}

          {/* STEP: Dry Run */}
          {step === 'dry-run' && importPlan && (
            <Card className="p-8">
              <CardHeader label="STEP 4" title="Pre-Import Summary" icon={CheckCircle2} />
              <div className="grid grid-cols-3 gap-4 my-6">
                <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-center">
                  <div className="text-display-sm text-success">{importPlan.attendance.length}</div>
                  <div className="text-caption text-success uppercase">Records Ready</div>
                </div>
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl text-center">
                  <div className="text-display-sm text-warning">{importPlan.warnings.length}</div>
                  <div className="text-caption text-warning uppercase">Unmatched Students</div>
                </div>
                <div className="p-4 bg-surface-inset border border-border-subtle rounded-xl text-center">
                  <div className="text-display-sm text-fg-tertiary">{importPlan.skipped.length}</div>
                  <div className="text-caption text-fg-tertiary uppercase">Sessions Skipped</div>
                </div>
              </div>

              {importPlan.students.length > 0 && (
                <div className="mb-6">
                  <p className="text-caption text-fg-tertiary uppercase mb-2">New Students</p>
                  <div className="text-body-sm text-success bg-success/5 border border-success/20 rounded-lg px-3 py-2">
                    {importPlan.students.length} student records will be created automatically from this sheet before attendance is imported.
                  </div>
                </div>
              )}

              {importPlan.warnings.length > 0 && (
                <div className="mb-6">
                  <p className="text-caption text-fg-tertiary uppercase mb-2">Unmatched Students</p>
                  <div className="max-h-36 overflow-y-auto space-y-2">
                    {importPlan.warnings.map((w, i) => (
                      <div key={i} className="flex items-center gap-2 text-body-sm text-warning bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">
                        <AlertTriangle size={14} />
                        {w.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-4">
                <Button variant="secondary" onClick={reset}>Start Over</Button>
                <Button
                  onClick={runImport}
                  disabled={importPlan.attendance.length === 0}
                >
                  Confirm &amp; Import
                </Button>
              </div>
            </Card>
          )}

          {/* STEP: Importing */}
          {step === 'importing' && (
            <Card className="p-12 flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-accent-glow/10 border border-accent-glow/30 flex items-center justify-center">
                <Loader2 size={36} className="text-accent-glow animate-spin" />
              </div>
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-caption text-fg-tertiary mb-2">
                  <span>Writing to database...</span>
                  <span>{importProgress.current}/{importProgress.total}</span>
                </div>
                <div className="h-2 bg-surface-inset rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-glow rounded-full transition-all duration-300"
                    style={{ width: `${importProgress.total ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* STEP: Done */}
          {step === 'done' && importResult && (
            <Card className="p-12 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                <CheckCircle2 size={40} className="text-success" />
              </div>
              <h2 className="text-display-sm text-fg-primary mb-2">Import Complete!</h2>
              <p className="text-body text-fg-secondary mb-8">
                <span className="text-fg-primary font-bold">{importResult.imported}</span> records imported · {importResult.warnings} warnings · {importResult.skipped} sessions skipped
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={reset}>Upload Another</Button>
                <Button onClick={() => window.location.href = '/history'}>View History</Button>
              </div>
            </Card>
          )}
        </div>

        {/* ── Right: AI Chat Panel ────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card className="p-4 h-full min-h-[400px] flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border-subtle">
              <div className="w-7 h-7 rounded-full bg-accent-glow/10 border border-accent-glow/30 flex items-center justify-center">
                <Bot size={14} className="text-accent-glow" />
              </div>
              <span className="text-body-sm font-medium text-fg-primary">Attendance AI Agent</span>
              <span className="ml-auto text-caption text-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                Active
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar">
              {chatLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
                  <Bot size={32} className="text-fg-tertiary/40" />
                  <p className="text-body-sm text-fg-tertiary">
                    Upload a file to start. I'll guide you through the import.
                  </p>
                </div>
              ) : (
                chatLog.map(msg => (
                  <ChatBubble key={msg.id} role={msg.role} content={msg.content} status={msg.status} />
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

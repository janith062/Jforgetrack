import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, HeroCard } from '../components/ui/Card';
import { Select } from '../components/ui/Input';
import { Pill, StatusDot } from '../components/ui/Pill';
import { Users, Calendar as CalendarIcon, History as HistoryIcon, TrendingUp } from 'lucide-react';

export default function History() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase.from('students').select('*').order('name');
      if (data) {
        setStudents(data);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setStudentData(null);
      setAttendanceRecords([]);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      const student = students.find(s => s.id.toString() === selectedStudentId);
      setStudentData(student);

      const { data } = await supabase
        .from('attendance')
        .select('*, sessions(*)')
        .eq('student_id', selectedStudentId)
        .order('sessions(date)', { ascending: false });

      if (data) {
        // Sort explicitly because Supabase nested ordering can sometimes be tricky
        const sorted = data.sort((a, b) => new Date(b.sessions.date) - new Date(a.sessions.date));
        setAttendanceRecords(sorted);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [selectedStudentId, students]);

  const calcStats = () => {
    if (!attendanceRecords.length) return { present: 0, total: 0, pct: 0, streak: 0, maxStreak: 0 };
    
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(a => a.present).length;
    const pct = Math.round((present / total) * 100);

    let streak = 0;
    let maxStreak = 0;
    let currentStreak = 0;

    // Ordered descending (newest first). Let's calculate streaks from oldest to newest.
    const ascending = [...attendanceRecords].reverse();
    ascending.forEach(a => {
      if (a.present) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });
    
    // Current streak is just walking back from newest
    for (let a of attendanceRecords) {
      if (a.present) streak++;
      else break;
    }

    return { present, total, pct, streak, maxStreak };
  };

  const stats = calcStats();
  
  let colorClass = 'text-success';
  if (stats.pct < 60) colorClass = 'text-danger';
  else if (stats.pct <= 75) colorClass = 'text-warning';

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-12 pt-8 pb-16 w-full animate-in fade-in duration-500">
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-surface-inset flex items-center justify-center">
          <HistoryIcon className="text-fg-secondary" size={24} />
        </div>
        <h1 className="text-display-lg text-fg-primary">Student History</h1>
      </div>

      <Card className="mb-8">
        <Select 
          options={[
            { label: 'Select a student...', value: '' },
            ...students.map(s => ({ label: `${s.name} (${s.usn})`, value: s.id }))
          ]}
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="mb-0 max-w-md"
        />
      </Card>

      {!selectedStudentId ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Users size={48} className="text-fg-tertiary mb-6 opacity-50" />
          <h2 className="text-h2 text-fg-secondary">No student selected</h2>
          <p className="text-body text-fg-tertiary mt-2">Choose a student from the dropdown above to view their attendance history.</p>
        </div>
      ) : loading ? (
        <div className="h-[400px] animate-pulse bg-surface-inset rounded-2xl" />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <HeroCard className="flex flex-col justify-between">
              <div>
                <h2 className="text-display-sm text-fg-primary mb-2">{studentData?.name}</h2>
                <div className="flex flex-wrap gap-2 mb-8">
                  <Pill className="font-mono">{studentData?.usn}</Pill>
                  <Pill>{studentData?.branch_code}</Pill>
                  <Pill>{studentData?.batch}</Pill>
                </div>
              </div>
              <div>
                <div className="text-label text-fg-tertiary uppercase tracking-wider mb-2">Overall Attendance</div>
                <div className="flex items-baseline gap-3">
                  <span className={`text-display-hero tabular-nums ${colorClass}`}>{stats.pct}%</span>
                  <span className="text-body-lg text-fg-secondary">({stats.present}/{stats.total})</span>
                </div>
              </div>
            </HeroCard>

            <HeroCard className="lg:col-span-2">
              <CardHeader label="ATTENDANCE HEATMAP" icon={CalendarIcon} />
              <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-12 gap-2 mt-4">
                {/* We render cells from oldest to newest */}
                {[...attendanceRecords].reverse().map((record) => {
                  const dateStr = new Date(record.sessions.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                  return (
                    <div 
                      key={record.id}
                      className="group relative"
                    >
                      <div className={`w-full aspect-square rounded-md border flex items-center justify-center transition-colors ${
                        record.present 
                          ? 'bg-success-bg border-success-border' 
                          : 'bg-danger-bg border-danger-border'
                      }`}>
                        <span className={`text-micro opacity-0 group-hover:opacity-100 ${record.present ? 'text-success' : 'text-danger'}`}>
                          {record.present ? 'P' : 'A'}
                        </span>
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-surface-raised border border-border-default rounded text-caption text-fg-primary opacity-0 group-hover:opacity-100 pointer-events-none z-10 shadow-raised transition-opacity">
                        {dateStr}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-8 mt-10 pt-6 border-t border-border-subtle">
                <div className="flex items-center gap-3">
                  <TrendingUp size={16} className="text-fg-tertiary" />
                  <span className="text-caption text-fg-secondary uppercase tracking-wider">Current Streak</span>
                  <span className="text-body-lg font-semibold tabular-nums">{stats.streak}</span>
                </div>
                <div className="w-[1px] h-4 bg-border-subtle my-auto" />
                <div className="flex items-center gap-3">
                  <TrendingUp size={16} className="text-success" />
                  <span className="text-caption text-fg-secondary uppercase tracking-wider">Longest Streak</span>
                  <span className="text-body-lg font-semibold tabular-nums">{stats.maxStreak}</span>
                </div>
              </div>
            </HeroCard>
          </div>

          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Topic</th>
                    <th>Status</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map(record => (
                    <tr key={record.id}>
                      <td className="font-mono text-fg-tertiary">
                        {new Date(record.sessions.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="font-medium text-fg-primary">{record.sessions.topic}</td>
                      <td>
                        <Pill status={record.present ? 'success' : 'danger'}>
                          <StatusDot status={record.present ? 'success' : 'danger'} />
                          {record.present ? 'Present' : 'Absent'}
                        </Pill>
                      </td>
                      <td className="text-fg-secondary tabular-nums">{record.sessions.duration_hours}h</td>
                    </tr>
                  ))}
                  {attendanceRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-fg-tertiary">No session history found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

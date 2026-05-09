import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, HeroCard, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill, StatusDot } from '../components/ui/Pill';
import { Calendar, Users, Activity, Clock, Plus, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TickerStrip = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
    {[
      { icon: Calendar, label: 'Total Sessions', value: stats.totalSessions },
      { icon: Activity, label: 'Avg Attendance', value: `${stats.avgAttendance}%` },
      { icon: Users, label: 'Active Students', value: stats.activeStudents },
      { icon: Clock, label: 'Last Session', value: stats.lastSessionDate },
    ].map(({ icon: Icon, label, value }) => (
      <div key={label} className="bg-surface/40 backdrop-blur-xl border border-border-subtle rounded-2xl p-5 relative overflow-hidden group hover:border-accent-glow/30 hover:shadow-lg hover:shadow-accent-glow/5 transition-all duration-300">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-strong to-transparent" />
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-accent-glow/10 border border-accent-glow/20 flex items-center justify-center">
            <Icon size={14} className="text-accent-glow" />
          </div>
          <span className="text-[10px] font-semibold text-fg-tertiary uppercase tracking-[0.1em]">{label}</span>
        </div>
        <div className="text-2xl font-display font-bold text-white tabular-nums">{value}</div>
      </div>
    ))}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalSessions: '-', avgAttendance: '-', activeStudents: '-', lastSessionDate: '-' });
  const [todaySessions, setTodaySessions] = useState([]);
  const [currentSessionIdx, setCurrentSessionIdx] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState({ loading: true, data: [] });
  const [recentActivity, setRecentActivity] = useState([]);
  const [programOverview, setProgramOverview] = useState({ highest: null, lowest: null });
  const [studentStats, setStudentStats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      
      // 1. Ticker Stats & Program Overview
      const [sessionsRes, studentsRes, allAttendanceRes] = await Promise.all([
        supabase.from('sessions').select('*').order('date', { ascending: false }),
        supabase.from('students').select('*').eq('is_active', true),
        supabase.from('attendance').select('*, students(name, usn)')
      ]);

      const sessions = sessionsRes.data || [];
      const students = studentsRes.data || [];
      const attendance = allAttendanceRes.data || [];

      const totalSessions = sessions.length;
      const activeStudents = students.length;
      const lastSession = sessions.filter(s => s.date <= today)[0];
      
      let avgAttendance = 0;
      if (attendance.length > 0) {
        const presentCount = attendance.filter(a => a.present).length;
        avgAttendance = Math.round((presentCount / attendance.length) * 100);
      }

      setStats({
        totalSessions,
        activeStudents,
        avgAttendance,
        lastSessionDate: lastSession ? new Date(lastSession.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'
      });

      // Program Overview calculations
      const studentMap = {};
      attendance.forEach(a => {
        if (!studentMap[a.student_id]) studentMap[a.student_id] = { total: 0, present: 0, name: a.students?.name };
        studentMap[a.student_id].total += 1;
        if (a.present) studentMap[a.student_id].present += 1;
      });
      let highest = { pct: 0, name: '-' }, lowest = { pct: 100, name: '-' };
      Object.values(studentMap).forEach(s => {
        if (s.total > 0) {
          const pct = (s.present / s.total) * 100;
          if (pct > highest.pct) highest = { pct, name: s.name };
          if (pct < lowest.pct) lowest = { pct, name: s.name };
        }
      });
      setProgramOverview({ 
        highest: highest.name !== '-' ? `${highest.name} (${Math.round(highest.pct)}%)` : '-', 
        lowest: lowest.name !== '-' ? `${lowest.name} (${Math.round(lowest.pct)}%)` : '-' 
      });

      // 1.2 Student Stats List
      const statsList = Object.keys(studentMap).map(id => {
        const s = studentMap[id];
        return {
          id,
          name: s.name,
          total: s.total,
          present: s.present,
          pct: Math.round((s.present / s.total) * 100)
        };
      }).sort((a, b) => b.pct - a.pct);
      setStudentStats(statsList);

      // 2. Today's Sessions
      const todays = sessions.filter(s => s.date === today);
      setTodaySessions(todays);

      // 3. Today's Attendance (for the first session initially)
      if (todays.length > 0) {
        const firstSession = todays[0];
        const { data: todayAtt } = await supabase
          .from('attendance')
          .select('*, students(name, usn)')
          .eq('session_id', firstSession.id);
        setTodayAttendance({ loading: false, data: todayAtt || [] });
      } else {
        setTodayAttendance({ loading: false, data: [] });
      }

      // 4. Recent Activity
      const { data: recentImports } = await supabase.from('import_log').select('*').order('uploaded_at', { ascending: false }).limit(5);
      
      let activities = [];
      
      const sessionGrouped = {};
      attendance.forEach(a => {
        if (!sessionGrouped[a.session_id] || a.marked_at > sessionGrouped[a.session_id].marked_at) {
          sessionGrouped[a.session_id] = { ...a, type: 'attendance' };
        }
      });
      activities.push(...Object.values(sessionGrouped).map(a => ({
        id: `att-${a.id}`,
        icon: CheckCircle2,
        desc: `Marked attendance for Session ID ${a.session_id}`,
        time: new Date(a.marked_at)
      })));
      
      activities.push(...(recentImports || []).map(i => ({
        id: `imp-${i.id}`,
        icon: Upload,
        desc: `Imported CSV: ${i.filename}`,
        time: new Date(i.uploaded_at)
      })));

      activities.sort((a, b) => b.time - a.time);
      setRecentActivity(activities.slice(0, 5));
    };

    fetchDashboardData();
  }, []);

  const handleSwitchSession = async (newIdx) => {
    if (newIdx < 0 || newIdx >= todaySessions.length) return;
    setCurrentSessionIdx(newIdx);
    setTodayAttendance(prev => ({ ...prev, loading: true }));
    
    const session = todaySessions[newIdx];
    const { data: att } = await supabase
      .from('attendance')
      .select('*, students(name, usn)')
      .eq('session_id', session.id);
    
    setTodayAttendance({ loading: false, data: att || [] });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-12 pt-10 pb-16 w-full animate-in fade-in duration-500">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-glow/10 border border-accent-glow/20 text-accent-glow text-xs font-semibold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-glow animate-pulse" />
          Live Dashboard
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-2">
          <span className="bg-gradient-to-r from-white via-white to-fg-secondary bg-clip-text text-transparent">
            Welcome Back,{' '}
          </span>
          <span className="bg-gradient-to-r from-accent-glow to-accent-purple bg-clip-text text-transparent">
            {user?.display_name?.split(' ')[0] || 'Mentor'}
          </span>
        </h1>
        <p className="text-fg-secondary text-sm">Last login: Today &mdash; everything is looking great.</p>
      </div>

      <TickerStrip stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Today's Session */}
        <HeroCard>
          <CardHeader 
            label={todaySessions.length > 1 ? `TODAY'S SESSIONS (${currentSessionIdx + 1}/${todaySessions.length})` : "TODAY'S SESSION"} 
            icon={Calendar} 
          />
          {todaySessions.length === 0 ? (
            <div>
              <h2 className="text-h2 text-fg-secondary mb-6">No session scheduled for today</h2>
              <Button onClick={() => navigate('/attendance')}><Plus size={16} className="mr-2 inline" />Create Session</Button>
            </div>
          ) : (
            <div>
              <h2 className="text-display-sm text-fg-primary mb-4">{todaySessions[currentSessionIdx].topic}</h2>
              <div className="flex gap-4 mb-8">
                <Pill status="default">{todaySessions[currentSessionIdx].session_type}</Pill>
                <Pill status="default">{todaySessions[currentSessionIdx].duration_hours} hrs</Pill>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/attendance')}>Mark Attendance</Button>
                {todaySessions.length > 1 && (
                  <div className="flex gap-2 ml-auto">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleSwitchSession(currentSessionIdx - 1)}
                      disabled={currentSessionIdx === 0}
                    >
                      Prev
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleSwitchSession(currentSessionIdx + 1)}
                      disabled={currentSessionIdx === todaySessions.length - 1}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </HeroCard>

        {/* Today's Attendance */}
        <HeroCard>
          <CardHeader label="TODAY'S ATTENDANCE" icon={Users} />
          {todayAttendance.loading ? (
             <div className="h-32 animate-pulse bg-surface-inset rounded-lg" />
          ) : todaySessions.length > 0 && todayAttendance.data.length > 0 ? (
            <div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-display-md tabular-nums">{todayAttendance.data.filter(a => a.present).length}</span>
                <span className="text-h3 text-fg-tertiary mb-2">/ {todayAttendance.data.length} Present</span>
              </div>
              <div className="w-full h-2 bg-surface-inset rounded-full mb-6 overflow-hidden">
                <div 
                  className="h-full bg-success rounded-full" 
                  style={{ width: `${(todayAttendance.data.filter(a => a.present).length / todayAttendance.data.length) * 100}%` }}
                />
              </div>
              <div className="text-caption text-fg-secondary uppercase tracking-wider mb-2">Absent Students</div>
              <div className="flex flex-wrap gap-2">
                {todayAttendance.data.filter(a => !a.present).slice(0, 5).map(a => (
                  <Pill key={a.id} status="danger">{a.students.name.split(' ')[0]}</Pill>
                ))}
                {todayAttendance.data.filter(a => !a.present).length > 5 && (
                  <Pill status="default">+{todayAttendance.data.filter(a => !a.present).length - 5} more</Pill>
                )}
                {todayAttendance.data.filter(a => !a.present).length === 0 && (
                  <span className="text-body-sm text-success">Everyone is present!</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start">
              <span className="text-h2 text-fg-secondary mb-6">
                {todaySessions.length > 0 ? 'Not yet marked' : 'No session today'}
              </span>
              <Button onClick={() => navigate('/attendance')}>Mark Now</Button>
            </div>
          )}
        </HeroCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader label="PROGRAM OVERVIEW" icon={BarChart2} title="Attendance Stats" />
          <div className="space-y-4 mt-6">
             <div className="flex justify-between items-center pb-4 border-b border-border-subtle">
               <span className="text-body text-fg-secondary">Total Sessions</span>
               <span className="text-body font-semibold tabular-nums">{stats.totalSessions}</span>
             </div>
             <div className="flex justify-between items-center pb-4 border-b border-border-subtle">
               <span className="text-body text-fg-secondary">Average Attendance</span>
               <span className="text-body font-semibold tabular-nums">{stats.avgAttendance}%</span>
             </div>
             <div className="flex justify-between items-center pb-4 border-b border-border-subtle">
               <span className="text-body text-fg-secondary">Highest Attendance</span>
               <span className="text-body text-success tabular-nums">{programOverview.highest}</span>
             </div>
             <div className="flex justify-between items-center pb-2">
               <span className="text-body text-fg-secondary">Lowest Attendance</span>
               <span className="text-body text-danger tabular-nums">{programOverview.lowest}</span>
             </div>
          </div>
        </Card>

        <Card>
          <CardHeader label="RECENT ACTIVITY" icon={Activity} title="System Log" />
          <div className="space-y-4 mt-6">
            {recentActivity.map((act, i) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-surface-inset flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-fg-secondary" />
                  </div>
                  <div>
                    <p className="text-body text-fg-primary">{act.desc}</p>
                    <p className="text-caption text-fg-tertiary">{act.time.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
            {recentActivity.length === 0 && <p className="text-body text-fg-tertiary">No recent activity.</p>}
          </div>
        </Card>
      </div>

      {/* Detailed Student Stats */}
      <div className="mt-6">
        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <CardHeader label="STUDENT PERFORMANCE" icon={Users} title="Detailed Attendance" />
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search students..." 
                className="input pl-10 w-full md:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
          
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="py-3 text-caption text-fg-tertiary uppercase tracking-wider">Student Name</th>
                  <th className="py-3 text-caption text-fg-tertiary uppercase tracking-wider">Sessions</th>
                  <th className="py-3 text-caption text-fg-tertiary uppercase tracking-wider">Progress</th>
                  <th className="py-3 text-caption text-fg-tertiary uppercase tracking-wider text-right">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {studentStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-fg-tertiary">
                      No student data available yet. Import a CSV to see stats.
                    </td>
                  </tr>
                ) : studentStats
                  .filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 10)
                  .map(s => (
                  <tr key={s.id} className="border-b border-border-subtle hover:bg-surface-inset transition-colors group">
                    <td className="py-4">
                      <div className="font-medium text-fg-primary">{s.name}</div>
                      <div className="text-caption text-fg-tertiary">ID: {s.id.slice(0, 8)}</div>
                    </td>
                    <td className="py-4 text-body-sm text-fg-secondary">
                      {s.present} / {s.total}
                    </td>
                    <td className="py-4 w-1/3">
                      <div className="w-full h-1.5 bg-surface-inset rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${s.pct >= 85 ? 'bg-success' : s.pct >= 70 ? 'bg-warning' : 'bg-danger'}`} 
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <Pill status={s.pct >= 85 ? 'success' : s.pct >= 70 ? 'default' : 'danger'}>
                        {s.pct}%
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {studentStats.length > 10 && (
              <div className="py-4 text-center">
                <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>View All Students</Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Icons
const CheckCircle2 = ({ className, size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>;
const Upload = ({ className, size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, HeroCard, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill, StatusDot } from '../components/ui/Pill';
import { Calendar, Users, Activity, Clock, Plus, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TickerStrip = ({ stats }) => (
  <div className="flex items-center gap-6 overflow-x-auto pb-4 mb-8 border-b border-border-subtle hide-scrollbar">
    <div className="flex items-center gap-3 min-w-max">
      <Calendar size={16} className="text-fg-tertiary" />
      <span className="text-caption text-fg-tertiary uppercase tracking-wider">Total Sessions</span>
      <span className="text-body-lg font-semibold tabular-nums">{stats.totalSessions}</span>
    </div>
    <div className="w-[1px] h-4 bg-border-subtle" />
    <div className="flex items-center gap-3 min-w-max">
      <Activity size={16} className="text-fg-tertiary" />
      <span className="text-caption text-fg-tertiary uppercase tracking-wider">Overall Attendance</span>
      <span className="text-body-lg font-semibold tabular-nums">{stats.avgAttendance}%</span>
    </div>
    <div className="w-[1px] h-4 bg-border-subtle" />
    <div className="flex items-center gap-3 min-w-max">
      <Users size={16} className="text-fg-tertiary" />
      <span className="text-caption text-fg-tertiary uppercase tracking-wider">Active Students</span>
      <span className="text-body-lg font-semibold tabular-nums">{stats.activeStudents}</span>
    </div>
    <div className="w-[1px] h-4 bg-border-subtle" />
    <div className="flex items-center gap-3 min-w-max">
      <Clock size={16} className="text-fg-tertiary" />
      <span className="text-caption text-fg-tertiary uppercase tracking-wider">Last Session</span>
      <span className="text-body-lg font-semibold tabular-nums">{stats.lastSessionDate}</span>
    </div>
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      
      // 1. Ticker Stats & Program Overview
      const [sessionsRes, studentsRes, allAttendanceRes] = await Promise.all([
        supabase.from('sessions').select('*').order('date', { ascending: false }),
        supabase.from('students').select('*').eq('is_active', true),
        supabase.from('attendance').select('*, students(name)')
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
    <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-12 pt-8 pb-16 w-full animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-display-hero text-fg-primary mb-2">Welcome Back, {user?.display_name?.split(' ')[0] || 'Mentor'}</h1>
        <p className="text-body-sm text-fg-secondary">Last login: Today</p>
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
    </div>
  );
}

// Icons
const CheckCircle2 = ({ className, size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>;
const Upload = ({ className, size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;

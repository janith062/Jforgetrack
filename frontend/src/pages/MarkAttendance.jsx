import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Pill } from '../components/ui/Pill';
import { ConfirmModal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Save, CheckSquare } from 'lucide-react';

export default function MarkAttendance() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  
  // Create Session Form
  const [newTopic, setNewTopic] = useState('');
  const [newType, setNewType] = useState('offline');
  const [newDuration, setNewDuration] = useState('2.0');
  
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // student_id -> boolean
  const [initialAttendance, setInitialAttendance] = useState({}); // tracking to see if dirty
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSession(date);
  }, [date]);

  const fetchSession = async (selectedDate) => {
    setLoadingSession(true);
    setSession(null);
    setStudents([]);
    setAttendance({});
    setInitialAttendance({});

    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('date', selectedDate)
      .single();

    if (sessionData) {
      setSession(sessionData);
      await fetchStudentsAndAttendance(sessionData.id);
    }
    setLoadingSession(false);
  };

  const fetchStudentsAndAttendance = async (sessionId) => {
    const [studentsRes, attendanceRes] = await Promise.all([
      supabase.from('students').select('*').eq('is_active', true).order('name'),
      supabase.from('attendance').select('*').eq('session_id', sessionId)
    ]);

    const activeStudents = studentsRes.data || [];
    const existingAtt = attendanceRes.data || [];

    setStudents(activeStudents);

    const attMap = {};
    existingAtt.forEach(a => {
      attMap[a.student_id] = a.present;
    });

    setAttendance(attMap);
    setInitialAttendance({ ...attMap });
  };

  const handleCreateSession = async () => {
    const monthNumber = new Date(date).getMonth() + 1; // Basic calculation for month
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        date,
        topic: newTopic,
        session_type: newType,
        duration_hours: parseFloat(newDuration),
        month_number: monthNumber
      })
      .select()
      .single();

    if (error) {
      addToast('Error', error.message, 'danger');
    } else {
      addToast('Success', 'Session created', 'success');
      setSession(data);
      await fetchStudentsAndAttendance(data.id);
    }
  };

  const toggleStudent = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const selectAll = (status) => {
    const newAtt = {};
    students.forEach(s => newAtt[s.id] = status);
    setAttendance(newAtt);
  };

  const isDirty = () => {
    // If we have existing attendance, it's an update.
    return Object.keys(initialAttendance).length > 0;
  };

  const handleSaveClick = () => {
    if (Object.keys(attendance).length === 0) return;
    if (isDirty()) {
      setIsConfirmOpen(true);
    } else {
      saveAttendance();
    }
  };

  const saveAttendance = async () => {
    setIsConfirmOpen(false);
    setIsSaving(true);

    const payload = students.map(s => ({
      student_id: s.id,
      session_id: session.id,
      present: attendance[s.id] || false,
      marked_by: user.display_name
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(payload, { onConflict: 'student_id,session_id' });

    setIsSaving(false);

    if (error) {
      addToast('Error saving attendance', error.message, 'danger');
    } else {
      const presentCount = Object.values(attendance).filter(Boolean).length;
      const absentCount = students.length - presentCount;
      addToast('Saved', `Marked ${presentCount} present, ${absentCount} absent`, 'success');
      navigate('/dashboard');
    }
  };

  const hasChanges = Object.keys(attendance).length > 0;
  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="max-w-[800px] mx-auto px-6 pt-8 pb-32 animate-in fade-in duration-500">
      <h1 className="text-h1 text-fg-primary mb-8">Mark Attendance</h1>

      <Card className="mb-6 !p-6">
        <div className="flex flex-col md:flex-row md:items-end gap-6">
          <Input 
            type="date" 
            label="Session Date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toLocaleDateString('en-CA')}
            min="2025-08-04"
            className="w-full md:w-auto mb-0"
          />
          
          <div className="flex-1 flex items-center h-11 px-4 bg-surface-inset rounded-md border border-border-default">
            {loadingSession ? (
              <span className="text-body text-fg-tertiary">Loading session...</span>
            ) : session ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-body font-semibold text-fg-primary">{session.topic}</span>
                <div className="flex gap-2">
                  <Pill>{session.session_type}</Pill>
                  <Pill>{session.duration_hours}h</Pill>
                </div>
              </div>
            ) : (
              <span className="text-body text-fg-tertiary italic">No session found for this date.</span>
            )}
          </div>
        </div>
      </Card>

      {!loadingSession && !session && (
        <Card className="mb-6 !p-6 border-accent-glow shadow-[0_0_15px_rgba(99,102,241,0.1)]">
          <CardHeader label="Create Session" icon={Calendar} title="New Session Details" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Topic" value={newTopic} onChange={e => setNewTopic(e.target.value)} className="md:col-span-3 mb-0" placeholder="e.g. 8-Layer AI Stack" />
            <Select label="Type" value={newType} onChange={e => setNewType(e.target.value)} options={[{label: 'Offline', value: 'offline'}, {label: 'Online', value: 'online'}]} className="mb-0" />
            <Input label="Duration (hrs)" type="number" step="0.5" value={newDuration} onChange={e => setNewDuration(e.target.value)} className="mb-0" />
            <div className="flex items-end">
              <Button onClick={handleCreateSession} disabled={!newTopic} className="w-full">Create</Button>
            </div>
          </div>
        </Card>
      )}

      {session && students.length > 0 && (
        <Card className="!p-0 overflow-hidden relative">
          <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-fg-secondary" />
              <h2 className="text-h3 text-fg-primary">Student List</h2>
              <Pill className="ml-2">{students.length} Total</Pill>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => selectAll(true)}>All Present</Button>
              <Button variant="secondary" onClick={() => selectAll(false)}>All Absent</Button>
            </div>
          </div>

          <div className="divide-y divide-border-subtle">
            {students.map((student) => {
              const isPresent = attendance[student.id];
              return (
                <div 
                  key={student.id} 
                  className="flex items-center px-6 py-3 hover:bg-surface-raised cursor-pointer transition-colors"
                  onClick={() => toggleStudent(student.id)}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-4 shrink-0 transition-colors ${isPresent ? 'bg-success border-success text-[#07070B]' : 'border-fg-tertiary bg-surface-inset'}`}>
                    {isPresent && <CheckSquare size={14} className="stroke-[3px]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-body-lg font-medium text-fg-primary">{student.name}</p>
                    <p className="text-caption font-mono text-fg-tertiary">{student.usn}</p>
                  </div>
                  <Pill>{student.branch_code}</Pill>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {session && students.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-20 flex justify-center pointer-events-none">
          <div className="w-full max-w-[800px] bg-surface-raised border border-border-default shadow-raised rounded-xl p-4 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-4">
              <span className="text-body text-fg-primary">
                <span className="text-success font-semibold">{presentCount}</span> Present
              </span>
              <span className="w-1 h-1 rounded-full bg-border-strong" />
              <span className="text-body text-fg-primary">
                <span className="text-danger font-semibold">{absentCount}</span> Absent
              </span>
            </div>
            <Button onClick={handleSaveClick} disabled={!hasChanges || isSaving}>
              {isSaving ? 'Saving...' : Object.keys(initialAttendance).length > 0 ? 'Update Attendance' : 'Save Attendance'}
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={saveAttendance}
        title="Overwrite Existing Attendance?"
        message="You are updating attendance records that have already been saved. This will overwrite the previous data for this session. Do you wish to proceed?"
        confirmText="Yes, Overwrite"
        isDestructive={true}
      />
    </div>
  );
}

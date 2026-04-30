import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { BookOpen, Video, FileText, Link as LinkIcon, Plus, Search, ExternalLink } from 'lucide-react';

const TypeIcon = ({ type, className = '' }) => {
  switch (type) {
    case 'slides': return <BookOpen size={16} className={className} />;
    case 'recording': return <Video size={16} className={className} />;
    case 'document': return <FileText size={16} className={className} />;
    default: return <LinkIcon size={16} className={className} />;
  }
};

export default function Materials() {
  const { addToast } = useToast();
  
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    session_id: '', title: '', type: 'slides', url: '', description: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const [sessionsRes, materialsRes] = await Promise.all([
      supabase.from('sessions').select('*').order('date', { ascending: false }),
      supabase.from('materials').select('*').order('created_at', { ascending: false })
    ]);

    if (sessionsRes.data) {
      setSessions(sessionsRes.data);
      const uniqueMonths = [...new Set(sessionsRes.data.map(s => s.month_number))].sort((a, b) => a - b);
      setMonths(uniqueMonths);
    }
    
    if (materialsRes.data) {
      setMaterials(materialsRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMaterial = async () => {
    if (!newMaterial.session_id || !newMaterial.title || !newMaterial.url) {
      addToast('Validation Error', 'Session, title, and URL are required.', 'danger');
      return;
    }

    try {
      new URL(newMaterial.url);
    } catch (_) {
      addToast('Validation Error', 'Invalid URL format.', 'danger');
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('materials')
      .insert([newMaterial])
      .select();

    setIsSubmitting(false);

    if (error) {
      addToast('Error', error.message, 'danger');
    } else {
      addToast('Success', 'Material added successfully', 'success');
      setMaterials(prev => [data[0], ...prev]);
      setIsModalOpen(false);
      setNewMaterial({ session_id: '', title: '', type: 'slides', url: '', description: '' });
    }
  };

  // Group materials by session
  const groupedData = [];
  sessions.forEach(session => {
    const sessionMaterials = materials.filter(m => m.session_id === session.id);
    if (sessionMaterials.length > 0) {
      // Apply filters
      const matchesMonth = selectedMonth ? session.month_number.toString() === selectedMonth : true;
      const q = searchQuery.toLowerCase();
      const matchesSearch = q === '' || 
        session.topic.toLowerCase().includes(q) || 
        sessionMaterials.some(m => m.title.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q)));

      if (matchesMonth && matchesSearch) {
        groupedData.push({ session, materials: sessionMaterials });
      }
    }
  });

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-12 pt-8 pb-16 w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-h1 text-fg-primary mb-2">Materials Library</h1>
          <p className="text-body text-fg-secondary">Access slides, recordings, and references for all sessions.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select 
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            options={[
              { label: 'All Months', value: '' },
              ...months.map(m => ({ label: `Month ${m}`, value: m }))
            ]}
            className="mb-0 w-32"
          />
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" size={16} />
            <input 
              type="text" 
              placeholder="Search topic or title..." 
              className="input pl-10 mb-0"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="whitespace-nowrap"><Plus size={16} className="mr-2 inline" /> Add Material</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 animate-pulse bg-surface-inset rounded-2xl" />)}
        </div>
      ) : groupedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen size={48} className="text-fg-tertiary mb-6 opacity-50" />
          <h2 className="text-h2 text-fg-secondary">No materials found</h2>
          <p className="text-body text-fg-tertiary mt-2">Try adjusting your filters or add a new material.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedData.map((group) => {
            const dateStr = new Date(group.session.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <Card key={group.session.id} className="flex flex-col h-full">
                <div className="mb-4">
                  <p className="text-caption text-fg-tertiary uppercase tracking-wider mb-2">{dateStr} • Month {group.session.month_number}</p>
                  <h3 className="text-h3 text-fg-primary leading-snug">{group.session.topic}</h3>
                </div>
                
                <div className="flex-1 space-y-3 mt-4">
                  {group.materials.map(material => (
                    <a 
                      key={material.id}
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-3 rounded-lg bg-surface-inset border border-border-default hover:bg-surface-raised hover:border-accent-glow transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-fg-secondary group-hover:text-accent-glow transition-colors">
                            <TypeIcon type={material.type} />
                          </div>
                          <div>
                            <p className="text-body font-medium text-fg-primary group-hover:text-white transition-colors">{material.title}</p>
                            {material.description && <p className="text-caption text-fg-tertiary mt-1 line-clamp-2">{material.description}</p>}
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-fg-tertiary opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0" />
                      </div>
                    </a>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Add Material"
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleAddMaterial} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Material'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select 
            label="Session" 
            value={newMaterial.session_id} 
            onChange={e => setNewMaterial({...newMaterial, session_id: e.target.value})}
            options={[
              { label: 'Select a session...', value: '' },
              ...sessions.map(s => ({ 
                label: `${new Date(s.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})} - ${s.topic}`, 
                value: s.id 
              }))
            ]}
          />
          <Input 
            label="Title" 
            placeholder="e.g. Slide Deck" 
            value={newMaterial.title}
            onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
          />
          <Select 
            label="Type" 
            value={newMaterial.type} 
            onChange={e => setNewMaterial({...newMaterial, type: e.target.value})}
            options={[
              { label: 'Slides', value: 'slides' },
              { label: 'Recording', value: 'recording' },
              { label: 'Document', value: 'document' },
              { label: 'Link', value: 'link' },
            ]}
          />
          <Input 
            label="URL" 
            placeholder="https://..." 
            value={newMaterial.url}
            onChange={e => setNewMaterial({...newMaterial, url: e.target.value})}
          />
          <Input 
            label="Description (Optional)" 
            placeholder="Brief notes about this material..." 
            value={newMaterial.description}
            onChange={e => setNewMaterial({...newMaterial, description: e.target.value})}
          />
        </div>
      </Modal>
    </div>
  );
}

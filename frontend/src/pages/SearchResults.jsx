import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardHeader } from '../components/ui/Card';
import { Search, Users, BookOpen, Calendar, ArrowRight } from 'lucide-react';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState({ students: [], sessions: [], materials: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      setLoading(true);
      
      const [studentsRes, sessionsRes, materialsRes] = await Promise.all([
        supabase.from('students').select('*').ilike('name', `%${query}%`),
        supabase.from('sessions').select('*').ilike('topic', `%${query}%`),
        supabase.from('materials').select('*').ilike('title', `%${query}%`)
      ]);

      setResults({
        students: studentsRes.data || [],
        sessions: sessionsRes.data || [],
        materials: materialsRes.data || []
      });
      setLoading(false);
    };

    fetchResults();
  }, [query]);

  const ResultSection = ({ title, icon: Icon, data, type }) => {
    if (data.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 text-fg-secondary">
          <Icon size={18} />
          <h2 className="text-h3 font-medium uppercase tracking-wider">{title}</h2>
          <span className="text-caption bg-surface px-2 py-0.5 rounded border border-border-subtle">{data.length}</span>
        </div>
        <div className="grid gap-3">
          {data.map(item => (
            <div 
              key={item.id} 
              onClick={() => {
                if (type === 'student') navigate(`/history?usn=${item.usn}`);
                if (type === 'session') navigate('/attendance');
                if (type === 'material') navigate('/materials');
              }}
              className="flex items-center justify-between p-4 bg-surface-raised border border-border-subtle rounded-xl hover:border-accent-glow hover:shadow-raised transition-all cursor-pointer group"
            >
              <div>
                <div className="text-body font-medium text-fg-primary group-hover:text-accent-glow transition-colors">
                  {item.name || item.topic || item.title}
                </div>
                <div className="text-caption text-fg-tertiary">
                  {item.usn || item.date || item.type}
                </div>
              </div>
              <ArrowRight size={16} className="text-fg-tertiary group-hover:translate-x-1 group-hover:text-accent-glow transition-all" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-10">
        <div className="text-caption text-fg-tertiary uppercase tracking-widest mb-2">Search Results</div>
        <h1 className="text-display-sm text-fg-primary">Showing results for "{query}"</h1>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Search size={40} className="text-fg-tertiary animate-pulse" />
          <div className="text-body text-fg-tertiary">Searching through the bootcamp data...</div>
        </div>
      ) : (
        <>
          {results.students.length === 0 && results.sessions.length === 0 && results.materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-6">
                <Search size={24} className="text-fg-tertiary" />
              </div>
              <h3 className="text-h3 text-fg-primary mb-2">No results found</h3>
              <p className="text-body text-fg-secondary">Try searching for a student name, session topic, or USN.</p>
            </div>
          ) : (
            <>
              <ResultSection title="Students" icon={Users} data={results.students} type="student" />
              <ResultSection title="Sessions" icon={Calendar} data={results.sessions} type="session" />
              <ResultSection title="Materials" icon={BookOpen} data={results.materials} type="material" />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;

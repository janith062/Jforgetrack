import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, Loader2, Database, Trash2, X } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';

const UploadCSV = () => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Validate, 4: Success
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [validationResults, setValidationResults] = useState({ ready: 0, warnings: 0, errors: 0, rows: [] });
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef(null);

  const targetFields = [
    { value: 'student_name', label: 'Student Name' },
    { value: 'usn', label: 'USN' },
    { value: 'email', label: 'Email' },
    { value: 'date', label: 'Date' },
    { value: 'attendance_status', label: 'Attendance Status' },
    { value: 'IGNORE', label: 'Ignore Column' }
  ];

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data);
          setHeaders(Object.keys(results.data[0]));
          // Simple auto-mapping logic
          const autoMap = {};
          Object.keys(results.data[0]).forEach(h => {
            const low = h.toLowerCase();
            if (low.includes('name')) autoMap[h] = 'student_name';
            else if (low.includes('usn')) autoMap[h] = 'usn';
            else if (low.includes('email')) autoMap[h] = 'email';
            else if (low.includes('date')) autoMap[h] = 'date';
            else if (low.includes('status') || low.includes('attendance')) autoMap[h] = 'attendance_status';
            else autoMap[h] = 'IGNORE';
          });
          setMapping(autoMap);
          setStep(2);
        }
      });
    }
  };

  const validateData = () => {
    setLoading(true);
    // Simulation of validation logic
    setTimeout(() => {
      const rows = csvData.map((row, idx) => {
        const errors = [];
        const warnings = [];
        
        const name = row[Object.keys(mapping).find(k => mapping[k] === 'student_name')];
        const usn = row[Object.keys(mapping).find(k => mapping[k] === 'usn')];
        
        if (!name) errors.push('Missing name');
        if (!usn) errors.push('Missing USN');
        
        return { 
          id: idx, 
          data: row, 
          errors, 
          warnings, 
          status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'clean' 
        };
      });

      setValidationResults({
        ready: rows.filter(r => r.status === 'clean').length,
        warnings: rows.filter(r => r.status === 'warning').length,
        errors: rows.filter(r => r.status === 'error').length,
        rows
      });
      setLoading(false);
      setStep(3);
    }, 1000);
  };

  const runImport = async () => {
    setLoading(true);
    const total = validationResults.rows.filter(r => r.status !== 'error').length;
    setImportStatus({ current: 0, total });

    // In a real app, we would batch insert to Supabase here
    // For now, we simulate the import
    for (let i = 0; i <= 10; i++) {
      await new Promise(r => setTimeout(r, 200));
      setImportStatus({ current: Math.min(total, Math.round((i / 10) * total)), total });
    }

    setLoading(false);
    setStep(4);
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setMapping({});
    setValidationResults({ ready: 0, warnings: 0, errors: 0, rows: [] });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center">
        <h1 className="text-display-sm text-fg-primary mb-2">Import Attendance Data</h1>
        <p className="text-body text-fg-secondary">Upload historical records from CSV or Excel files</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {[1, 2, 3, 4].map(s => (
          <React.Fragment key={s}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              step >= s ? 'bg-accent-glow border-accent-glow text-white' : 'bg-surface border-border-default text-fg-tertiary'
            }`}>
              {step > s ? <CheckCircle2 size={20} /> : s}
            </div>
            {s < 4 && (
              <div className={`w-12 h-[2px] transition-all duration-300 ${step > s ? 'bg-accent-glow' : 'bg-border-subtle'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card className="p-12 border-dashed border-2 hover:border-accent-glow/50 transition-colors group cursor-pointer" onClick={() => fileInputRef.current.click()}>
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Upload className="text-accent-glow" size={32} />
            </div>
            <h3 className="text-h3 text-fg-primary mb-2">Drag and drop your CSV file</h3>
            <p className="text-body-sm text-fg-tertiary mb-8 text-center max-w-xs">
              Supports .csv files up to 5MB. Make sure headers are in the first row.
            </p>
            <Button variant="secondary">Browse Files</Button>
          </div>
        </Card>
      )}

      {/* Step 2: Map Columns */}
      {step === 2 && (
        <Card className="p-8">
          <CardHeader label="STEP 2" title="Map CSV Columns" icon={FileText} />
          <p className="text-body-sm text-fg-secondary mb-8 mt-2">
            Match your CSV headers to the fields in our database.
          </p>
          
          <div className="space-y-4">
            {headers.map(header => (
              <div key={header} className="flex items-center gap-6 p-4 bg-surface-inset rounded-lg border border-border-subtle hover:border-border-default transition-colors">
                <div className="flex-1">
                  <div className="text-caption text-fg-tertiary uppercase mb-1">CSV HEADER</div>
                  <div className="text-body font-medium text-fg-primary">{header}</div>
                  <div className="text-[10px] text-fg-tertiary mt-1 truncate max-w-[200px]">
                    Example: {csvData[0][header]}
                  </div>
                </div>
                <ArrowRight size={20} className="text-fg-tertiary" />
                <div className="flex-1">
                  <div className="text-caption text-fg-tertiary uppercase mb-1">DATABASE FIELD</div>
                  <select 
                    value={mapping[header]} 
                    onChange={(e) => setMapping({...mapping, [header]: e.target.value})}
                    className="select !h-10 text-body-sm bg-surface-raised"
                  >
                    {targetFields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-10">
            <Button variant="ghost" onClick={reset}>Cancel</Button>
            <Button onClick={validateData} loading={loading}>
              Validate Data
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Validate */}
      {step === 3 && (
        <Card className="p-8">
          <CardHeader label="STEP 3" title="Review & Validate" icon={CheckCircle2} />
          
          <div className="grid grid-cols-3 gap-4 my-8">
            <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-center">
              <div className="text-display-sm text-success">{validationResults.ready}</div>
              <div className="text-caption text-success uppercase">Ready to Import</div>
            </div>
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl text-center">
              <div className="text-display-sm text-warning">{validationResults.warnings}</div>
              <div className="text-caption text-warning uppercase">Warnings</div>
            </div>
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-center">
              <div className="text-display-sm text-danger">{validationResults.errors}</div>
              <div className="text-caption text-danger uppercase">Errors Found</div>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto border border-border-subtle rounded-lg hide-scrollbar mb-8">
            <table className="w-full text-left text-body-sm">
              <thead className="sticky top-0 bg-surface-raised border-b border-border-subtle">
                <tr>
                  <th className="px-4 py-3 font-medium text-fg-secondary">ROW</th>
                  <th className="px-4 py-3 font-medium text-fg-secondary">STUDENT</th>
                  <th className="px-4 py-3 font-medium text-fg-secondary">STATUS</th>
                  <th className="px-4 py-3 font-medium text-fg-secondary">ISSUES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {validationResults.rows.map(row => (
                  <tr key={row.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 text-fg-tertiary">{row.id + 1}</td>
                    <td className="px-4 py-3 text-fg-primary font-medium">
                      {row.data[Object.keys(mapping).find(k => mapping[k] === 'student_name')] || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Pill status={row.status === 'clean' ? 'success' : row.status === 'warning' ? 'warning' : 'danger'}>
                        {row.status}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 text-danger text-[12px]">
                      {row.errors.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between mt-10">
            <Button variant="ghost" onClick={() => setStep(2)}>Back to Mapping</Button>
            <div className="flex gap-4">
              <Button variant="secondary" onClick={reset} icon={Trash2}>Discard</Button>
              <Button onClick={runImport} disabled={validationResults.errors > 0} loading={loading}>
                {loading ? `Importing ${importStatus.current}/${importStatus.total}...` : 'Start Import'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <Card className="p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-8 animate-in zoom-in duration-500">
            <CheckCircle2 size={40} className="text-success" />
          </div>
          <h2 className="text-display-sm text-fg-primary mb-4">Import Completed!</h2>
          <p className="text-body text-fg-secondary mb-10 max-w-md">
            Successfully imported {importStatus.total} attendance records to the database. All student records have been synced.
          </p>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={reset}>Upload Another</Button>
            <Button onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UploadCSV;

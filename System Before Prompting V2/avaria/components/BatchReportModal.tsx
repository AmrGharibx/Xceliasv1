'use client';
import { useState } from 'react';
import { generateBatchReport, ReportPayload } from '@/lib/generateBatchReport';

interface BatchReportModalProps {
  batchId: string;
  batchName: string;
  companies: string[];
  onClose: () => void;
}

export default function BatchReportModal({ batchId, batchName, companies, onClose }: BatchReportModalProps) {
  const [selectedCompany, setSelectedCompany] = useState(companies[0] ?? '');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError]           = useState('');

  async function handleGenerate() {
    if (!selectedCompany) { setError('Select a company first'); return; }
    setError('');
    setGenerating(true);
    setProgress(0);
    setProgressMsg('Fetching trainee data...');

    try {
      const res = await fetch(`/api/report/batch?batchId=${encodeURIComponent(batchId)}&company=${encodeURIComponent(selectedCompany)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Server error ${res.status}`);
      }
      const data: ReportPayload = await res.json();
      if (!data.trainees.length) {
        throw new Error(`No assessments found for ${selectedCompany} in this batch`);
      }
      setProgressMsg('Generating PDF...');
      setProgress(10);

      await generateBatchReport(data, (msg, pct) => {
        setProgressMsg(msg);
        setProgress(pct);
      });

      setProgressMsg('PDF downloaded!');
      setProgress(100);
      setTimeout(() => { setGenerating(false); onClose(); }, 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setGenerating(false);
      setProgress(0);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={e => { if (!generating && e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1f2937' }}>Generate Batch Report</h2>
            <p style={{ margin: '4px 0 0', fontSize: '.85rem', color: '#6b7280' }}>{batchName}</p>
          </div>
          {!generating && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>✕</button>
          )}
        </div>

        {/* Company selector */}
        {!generating && (
          <>
            <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '8px' }}>
              Select Company
            </label>
            <select
              value={selectedCompany}
              onChange={e => { setError(''); setSelectedCompany(e.target.value); }}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '.95rem', color: '#1f2937', background: '#f9fafb', marginBottom: '20px', outline: 'none' }}
            >
              {companies.length === 0 && <option value="">No companies found</option>}
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '.85rem', color: '#dc2626', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', fontSize: '.82rem', color: '#1e40af', marginBottom: '24px' }}>
              <strong>What this generates:</strong> An A4 PDF with a cover page, one detailed page per trainee (scores, attendance, assessment), and a concluding remarks page. Automatically downloaded.
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '.9rem', cursor: 'pointer', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!selectedCompany || !!companies.length === false}
                style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#c1121f', color: '#fff', fontSize: '.9rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Generate PDF
              </button>
            </div>
          </>
        )}

        {/* Progress state */}
        {generating && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#c1121f', marginBottom: '8px', fontFamily: 'Georgia, serif' }}>
              {progress}%
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '8px', marginBottom: '14px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(90deg,#c1121f,#e63946)', height: '100%', width: `${progress}%`, borderRadius: '999px', transition: 'width .3s ease' }} />
            </div>
            <p style={{ fontSize: '.9rem', color: '#6b7280', margin: 0 }}>{progressMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}

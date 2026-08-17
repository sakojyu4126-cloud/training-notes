/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TrainingReport } from './types';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import ReportPreview from './components/ReportPreview';
import QuizSheet from './components/QuizSheet';
import { 
  FileText, 
  Settings, 
  HelpCircle, 
  Cloud, 
  CloudOff, 
  Clipboard, 
  Sparkles,
  BookOpen,
  ArrowLeft
} from 'lucide-react';

export default function App() {
  const [reports, setReports] = useState<TrainingReport[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'edit' | 'preview-report' | 'preview-quiz'>('dashboard');
  const [selectedReport, setSelectedReport] = useState<TrainingReport | null>(null);
  
  // Connection state
  const [serverConnected, setServerConnected] = useState<boolean>(true);

  // Load reports from server API or LocalStorage fallback
  const loadReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        setReports(data.reports);
        setServerConnected(true);
        // Sync to local storage as double-backup
        localStorage.setItem('momonosato_reports_cache', JSON.stringify(data.reports));
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (err) {
      console.warn("Could not load reports from server API, using local cache fallback:", err);
      setServerConnected(false);
      const cache = localStorage.getItem('momonosato_reports_cache');
      if (cache) {
        try {
          setReports(JSON.parse(cache));
        } catch {
          // ignore
        }
      }
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Save report (Create or Update)
  const handleSaveReport = async (report: TrainingReport) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      const data = await res.json();
      if (data.success) {
        // Reload from server
        await loadReports();
        alert("研修報告書を正常に保存し、データベースを同期しました。");
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Failed to save to server, saving locally:", err);
      setServerConnected(false);
      
      // Local fallback saving
      const updatedReports = [...reports];
      const index = updatedReports.findIndex(r => r.id === report.id);
      if (index >= 0) {
        updatedReports[index] = report;
      } else {
        updatedReports.push(report);
      }
      setReports(updatedReports);
      localStorage.setItem('momonosato_reports_cache', JSON.stringify(updatedReports));
      alert("ローカルストレージに報告書を保存しました。（サーバー接続復帰時に自動で同期されます）");
    }

    setCurrentView('dashboard');
    setSelectedReport(null);
  };

  // Delete report
  const handleDeleteReport = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await loadReports();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Failed to delete on server, updating locally:", err);
      const updated = reports.filter(r => r.id !== id);
      setReports(updated);
      localStorage.setItem('momonosato_reports_cache', JSON.stringify(updated));
    }
  };

  // Import JSON backup
  const handleImportBackup = async (importedReports: TrainingReport[]) => {
    // Save to server if connected
    let successCount = 0;
    for (const report of importedReports) {
      try {
        await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });
        successCount++;
      } catch (err) {
        console.warn("Could not save imported report to server:", report.id);
      }
    }

    // Refresh state
    if (successCount > 0) {
      await loadReports();
    } else {
      // Local fallback
      setReports(importedReports);
      localStorage.setItem('momonosato_reports_cache', JSON.stringify(importedReports));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b]">
      {/* Top Main Navigation / Brand Bar - Hidden on print */}
      <header className="no-print bg-[#0f172a] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-white shrink-0">
              桃
            </div>
            <div>
              <h1 className="text-md sm:text-lg font-bold tracking-tight font-hgs-gothic flex items-center gap-1.5 text-white">
                桃の郷 京都東山
              </h1>
              <p className="text-[10px] text-slate-300 font-meiryo-ui mt-0.5">
                法定研修報告・議事録管理システム | ヘルパーステーション・デイサービス・サ高住
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Server connection indicator */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-meiryo-ui ${
              serverConnected 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}>
              {serverConnected ? <Cloud size={13} /> : <CloudOff size={13} />}
              {serverConnected ? "サーバー同期中" : "ローカル作動中"}
            </span>

            <span className="hidden sm:inline-flex w-10 h-10 rounded-full bg-slate-700 border border-slate-600 items-center justify-center text-xs font-medium text-slate-200">
              管理
            </span>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dynamic sub navigation tabs for selected report (Hidden on print) */}
        {selectedReport && (currentView === 'preview-report' || currentView === 'preview-quiz') && (
          <div className="no-print flex items-center justify-between border-b border-slate-200 mb-6 pb-2">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setSelectedReport(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition font-meiryo-ui"
            >
              <ArrowLeft size={14} />
              一覧に戻る
            </button>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setCurrentView('preview-report')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  currentView === 'preview-report' 
                    ? "bg-white text-blue-700 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                } font-hgs-gothic`}
              >
                <span className="mr-1">①</span>
                研修報告書 兼 議事録
              </button>
              <button
                onClick={() => setCurrentView('preview-quiz')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  currentView === 'preview-quiz' 
                    ? "bg-white text-blue-700 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                } font-hgs-gothic`}
              >
                <span className="mr-1">②</span>
                理解度テスト ({selectedReport.quizQuestions?.length || 0}問)
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-500 font-meiryo-ui truncate max-w-xs hidden md:block">
              表示中: {selectedReport.theme}
            </div>
          </div>
        )}

        {/* Tab rendering logic */}
        {currentView === 'dashboard' && (
          <Dashboard 
            reports={reports}
            onSelectReport={(report) => {
              setSelectedReport(report);
              setCurrentView('preview-report');
            }}
            onEditReport={(report) => {
              setSelectedReport(report);
              setCurrentView('edit');
            }}
            onDeleteReport={handleDeleteReport}
            onAddNew={() => {
              setSelectedReport(null);
              setCurrentView('create');
            }}
            onImportBackup={handleImportBackup}
          />
        )}

        {currentView === 'create' && (
          <ReportForm 
            onSave={handleSaveReport}
            onCancel={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'edit' && (
          <ReportForm 
            initialReport={selectedReport}
            onSave={handleSaveReport}
            onCancel={() => {
              setCurrentView('dashboard');
              setSelectedReport(null);
            }}
          />
        )}

        {selectedReport && currentView === 'preview-report' && (
          <ReportPreview 
            report={selectedReport}
            onClose={() => {
              setCurrentView('dashboard');
              setSelectedReport(null);
            }}
            onEdit={() => setCurrentView('edit')}
          />
        )}

        {selectedReport && currentView === 'preview-quiz' && (
          <QuizSheet 
            report={selectedReport}
            onClose={() => {
              setCurrentView('dashboard');
              setSelectedReport(null);
            }}
          />
        )}

      </main>

      {/* Footer (Hidden on print) */}
      <footer className="no-print border-t border-slate-200 bg-white py-6 mt-16 text-center text-xs text-slate-400 font-meiryo-ui">
        <p>© 2026 桃の郷 京都東山. All Rights Reserved. (HGSｺﾞｼｯｸM / Meiryo UI / UDデジタル教科書体準拠)</p>
      </footer>
    </div>
  );
}

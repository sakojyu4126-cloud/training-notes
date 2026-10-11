/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { TrainingReport } from '../types';
import { 
  FileText, 
  Plus, 
  Search, 
  Building2, 
  Calendar, 
  Trash2, 
  Edit, 
  Printer, 
  Download, 
  Upload, 
  X
} from 'lucide-react';

interface DashboardProps {
  reports: TrainingReport[];
  onSelectReport: (report: TrainingReport) => void;
  onEditReport: (report: TrainingReport) => void;
  onDeleteReport: (id: string) => void;
  onAddNew: () => void;
  onImportBackup: (importedData: TrainingReport[]) => void;
}

export default function Dashboard({
  reports,
  onSelectReport,
  onEditReport,
  onDeleteReport,
  onAddNew,
  onImportBackup
}: DashboardProps) {
  // Filters requested by user:
  // 1. 何年何月開催 (Year-Month)
  const [selectedMonth, setSelectedMonth] = useState('');
  // 2. 研修テーマ (Theme)
  const [themeSearch, setThemeSearch] = useState('');

  // Extract all distinct year-months from reports for fast dropdown selection
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => {
      if (r.trainingDate && r.trainingDate.length >= 7) {
        set.add(r.trainingDate.substring(0, 7)); // e.g. "2026-06", "2026-07"
      }
    });
    return Array.from(set).sort().reverse();
  }, [reports]);

  // Format YYYY-MM to Japanese era / readable string
  const formatMonthLabel = (ym: string) => {
    if (!ym) return '';
    const [yearStr, monthStr] = ym.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const reiwa = year >= 2019 ? `令和${year - 2018}年` : `${year}年`;
    return `${reiwa}${month}月開催 (${ym})`;
  };

  // Filter reports strictly based on user's requested criteria:
  // 1. 何年何月開催
  // 2. 研修テーマ
  const filteredReports = reports.filter((report) => {
    const matchesMonth = 
      !selectedMonth || 
      (report.trainingDate && report.trainingDate.startsWith(selectedMonth));

    const matchesTheme = 
      !themeSearch.trim() || 
      report.theme.toLowerCase().includes(themeSearch.toLowerCase().trim());

    return matchesMonth && matchesTheme;
  });

  // Sort reports by office priority and training date descending
  const getOfficeSortWeight = (office: string) => {
    if (office.includes('ヘルパーステーション')) return 1;
    if (office.includes('デイサービス')) return 2;
    if (office.includes('住宅') || office.includes('サ高住') || office.includes('サービス付')) return 3;
    return 4;
  };

  const sortedReports = [...filteredReports].sort((a, b) => {
    const weightA = getOfficeSortWeight(a.officeName);
    const weightB = getOfficeSortWeight(b.officeName);
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    const dateA = new Date(a.trainingDate).getTime();
    const dateB = new Date(b.trainingDate).getTime();
    return dateB - dateA;
  });

  // Export JSON file (データ保存)
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(reports, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const dateStr = new Date().toISOString().split('T')[0];
    const exportFileName = `桃の郷_法定研修データ保存_${dateStr}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };

  // Import JSON file (データ復元)
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      fileReader.readAsText(file, "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0) {
            onImportBackup(parsed);
          } else {
            console.warn("無効なバックアップファイルです。研修データの配列が含まれていません。");
          }
        } catch (error) {
          console.error("ファイルの解析に失敗しました。正しいJSONファイルを選択してください。", error);
        }
      };
    }
    // reset input value so re-selecting same file triggers event
    e.target.value = '';
  };

  // Print list
  const handlePrintList = () => {
    window.print();
  };

  // Reset filter
  const handleResetFilters = () => {
    setSelectedMonth('');
    setThemeSearch('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Action Header (Hidden on Print) */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-hgs-gothic">研修報告書・議事録 一覧</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-meiryo-ui mt-1">
            全 <span className="font-bold text-blue-600">{reports.length}</span> 件の法定研修が記録されています。
            （ローカル保存・復元対応 / 1日5万回の無料枠内で安全稼働）
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* New Training */}
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 bg-[#1e293b] hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition shadow-md font-meiryo-ui cursor-pointer"
          >
            <Plus size={16} />
            新規研修の作成・要約
          </button>

          {/* Print / Save PDF for List Table */}
          <button
            onClick={handlePrintList}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition shadow-sm font-meiryo-ui cursor-pointer"
            title="現在の一覧表を印刷、またはPDFとして保存します"
          >
            <Printer size={16} />
            一覧表を印刷 / PDF保存
          </button>
          
          {/* Data Backup / Export */}
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2.5 rounded-lg text-sm border border-slate-200 transition font-meiryo-ui cursor-pointer"
            title="全研修データをJSONファイルとしてローカル保存（バックアップ）します"
          >
            <Download size={15} className="text-emerald-600" />
            データ保存 (JSON)
          </button>

          {/* Data Restore / Import */}
          <label className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2.5 rounded-lg text-sm border border-slate-200 transition cursor-pointer font-meiryo-ui">
            <Upload size={15} className="text-amber-600" />
            データ復元
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportJSON} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {/* 2. Focused Search / Filter Bar (Hidden on Print) */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-hgs-gothic">
            検索・絞り込み （開催年月・研修テーマ）
          </div>
          {(selectedMonth || themeSearch) && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold font-meiryo-ui cursor-pointer"
            >
              <X size={14} />
              検索条件をクリア
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filter 1: 何年何月開催 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1 flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-600" />
              何年何月開催
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Dropdown of existing recorded months */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-meiryo-ui cursor-pointer"
              >
                <option value="">すべての開催年月</option>
                {availableMonths.map((ym) => (
                  <option key={ym} value={ym}>
                    {formatMonthLabel(ym)}
                  </option>
                ))}
              </select>

              {/* Direct Month Picker */}
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-meiryo-ui"
                title="開催年月を直接カレンダー選択"
              />
            </div>
          </div>

          {/* Filter 2: 研修テーマ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1 flex items-center gap-1.5">
              <Search size={14} className="text-blue-600" />
              研修テーマ
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="研修テーマを入力して検索（例：個人情報、感染症など）"
                value={themeSearch}
                onChange={(e) => setThemeSearch(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-meiryo-ui"
              />
              {themeSearch && (
                <button
                  type="button"
                  onClick={() => setThemeSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter status */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-500 font-meiryo-ui">
          <div>
            該当件数: <span className="font-bold text-blue-600">{sortedReports.length}</span> 件
            {reports.length > 0 && `（全 ${reports.length} 件中）`}
            {selectedMonth && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                {formatMonthLabel(selectedMonth)}
              </span>
            )}
            {themeSearch && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-100">
                テーマ「{themeSearch}」
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Official Administrative Print Header (VISIBLE ONLY IN PRINT) */}
      <div className="hidden print:block mb-4 border-b-2 border-black pb-3 font-meiryo-ui">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold font-hgs-gothic tracking-wider text-black">
              法定研修 実施記録一覧表（研修・受講管理簿）
            </h1>
            <p className="text-xs text-gray-700 mt-1">
              施設名：桃の郷 京都東山（ヘルパーステーション・デイサービス・サービス付高齢者向け住宅）
            </p>
          </div>
          <div className="text-right text-[10pt] text-gray-800">
            <div>出力日：{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            {selectedMonth ? (
              <div className="font-bold text-black">【対象年月：{formatMonthLabel(selectedMonth)}】</div>
            ) : (
              <div>【対象：全記録】</div>
            )}
            <div>記録件数：{sortedReports.length} 件</div>
          </div>
        </div>
      </div>

      {/* 4. Reports Table */}
      {sortedReports.length === 0 ? (
        <div className="no-print bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <FileText className="mx-auto text-slate-300" size={48} />
          <h3 className="text-lg font-semibold text-slate-700 font-hgs-gothic">該当する研修報告書が見つかりません</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto font-meiryo-ui">
            「何年何月開催」または「研修テーマ」の検索条件を変更するか、クリアボタンを押してください。
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition font-meiryo-ui cursor-pointer"
          >
            すべての記録を表示する
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in print:border-none print:shadow-none">
          {/* Main Table for Desktop & Print */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse list-print-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-bold font-hgs-gothic print:bg-gray-100 print:text-black">
                  <th className="px-3 py-3 w-[4%] text-center print:w-[5%]">No.</th>
                  <th className="px-4 py-3 w-[26%] print:w-[24%]">事業所名</th>
                  <th className="px-3 py-3 w-[12%] text-center print:w-[13%]">開催日</th>
                  <th className="px-3 py-3 w-[12%] text-center print:w-[12%]">研修時間</th>
                  <th className="px-4 py-3 w-[28%] print:w-[28%]">研修テーマ（議題）</th>
                  <th className="px-3 py-3 w-[10%] text-center print:w-[10%]">受講状況</th>
                  <th className="px-3 py-3 w-[8%] text-center no-print">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-meiryo-ui text-xs text-slate-700 print:divide-black">
                {sortedReports.map((report, index) => (
                  <tr 
                    key={report.id} 
                    className="hover:bg-slate-50/80 transition-colors duration-150 print:hover:bg-transparent"
                  >
                    <td className="px-3 py-3 text-center font-mono text-slate-500 print:text-black font-semibold">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 print:text-black">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100/50 print:bg-transparent print:border-none print:p-0 print:text-black">
                        <Building2 size={12} className="shrink-0 no-print" />
                        {report.officeName}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap text-slate-600 print:text-black font-mono">
                      {report.trainingDate}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap text-slate-600 print:text-black font-mono text-[11px]">
                      {report.trainingTimeStart} ～ {report.trainingTimeEnd}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 print:text-black">
                      <span 
                        onClick={() => onSelectReport(report)}
                        className="hover:text-blue-600 cursor-pointer transition-colors duration-100 block break-words leading-relaxed"
                        title={report.theme}
                      >
                        {report.theme}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap text-[11px]">
                      <span className="font-semibold text-slate-800 print:text-black">
                        受講: {report.attendeesCount || 0}名
                      </span>
                      {report.nonAttendeesCount > 0 && (
                        <span className="block text-rose-600 print:text-black text-[10px]">
                          未: {report.nonAttendeesCount}名
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectReport(report)}
                          className="p-1.5 hover:bg-blue-50 rounded text-slate-600 hover:text-blue-600 transition cursor-pointer"
                          title="閲覧・個別印刷"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={() => onEditReport(report)}
                          className="p-1.5 hover:bg-blue-50 rounded text-slate-600 hover:text-blue-600 transition cursor-pointer"
                          title="編集"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("この研修報告書を削除してもよろしいですか？（元には戻せません）")) {
                              onDeleteReport(report.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="削除"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Print footer notice */}
          <div className="hidden print:block mt-4 text-right text-[9pt] text-gray-600 font-meiryo-ui">
            桃の郷 京都東山 法定研修記録システム 出力帳票（行政監査・運営指導対応）
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TrainingReport } from '../types';
import { 
  FileText, 
  Plus, 
  Search, 
  Building2, 
  Calendar, 
  User, 
  Trash2, 
  Edit, 
  Printer, 
  Download, 
  Upload, 
  HelpCircle,
  Clock
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState('all');

  const offices = [
    'ヘルパーステーション桃の郷 京都東山',
    'デイサービス桃の郷 京都東山',
    'サービス付高齢者向け住宅 桃の郷京都東山'
  ];

  // Filter reports based on search term and office filter
  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      report.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.lecturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.attendees.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.summary?.content || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOffice = 
      selectedOfficeFilter === 'all' || report.officeName === selectedOfficeFilter;

    return matchesSearch && matchesOffice;
  });

  // Sort reports by office weight and training date descending
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

  // Export JSON file
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(reports, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `momonosato_training_reports_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportBackup(parsed);
            alert(`バックアップから ${parsed.length} 件の研修報告書を正常に復元しました。`);
          } else {
            alert("無効なファイル形式です。バックアップデータの配列が含まれている必要があります。");
          }
        } catch (error) {
          alert("ファイルの解析に失敗しました。正しいJSONファイルを選択してください。");
        }
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-hgs-gothic">研修報告書・議事録 一覧</h2>
          <p className="text-sm text-slate-500 font-meiryo-ui mt-1">
            全 <span className="font-bold text-blue-600">{reports.length}</span> 件の法定研修が記録されています。
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 bg-[#1e293b] hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition shadow-md font-meiryo-ui cursor-pointer"
          >
            <Plus size={16} />
            新規研修の作成・要約
          </button>
          
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2.5 rounded-lg text-sm border border-slate-200 transition font-meiryo-ui cursor-pointer"
            title="データをJSONファイルとしてダウンロードして保存します"
          >
            <Download size={15} />
            一括バックアップ
          </button>

          <label className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2.5 rounded-lg text-sm border border-slate-200 transition cursor-pointer font-meiryo-ui">
            <Upload size={15} />
            復元
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportJSON} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="テーマ、講師、受講者名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-meiryo-ui"
          />
        </div>

        {/* Office filter */}
        <div className="relative">
          <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <select
            value={selectedOfficeFilter}
            onChange={(e) => setSelectedOfficeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 appearance-none font-meiryo-ui"
          >
            <option value="all">すべての事業所</option>
            {offices.map((office) => (
              <option key={office} value={office}>{office}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table List */}
      {sortedReports.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <FileText className="mx-auto text-slate-300" size={48} />
          <h3 className="text-lg font-semibold text-slate-700 font-hgs-gothic">該当する報告書が見つかりません</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto font-meiryo-ui">
            検索ワードや事業所フィルターを変更するか、上の「新規研修の作成・要約」ボタンから新しく完璧な法定研修を記録しましょう。
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-bold font-hgs-gothic">
                  <th className="px-5 py-3.5 w-[30%]">事業所名</th>
                  <th className="px-4 py-3.5 w-[14%] text-center">研修日</th>
                  <th className="px-4 py-3.5 w-[16%] text-center">研修時刻</th>
                  <th className="px-5 py-3.5 w-[30%]">研修テーマ</th>
                  <th className="px-5 py-3.5 w-[10%] text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-meiryo-ui text-xs text-slate-700">
                {sortedReports.map((report) => (
                  <tr 
                    key={report.id} 
                    className="hover:bg-slate-50/80 transition-colors duration-150"
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100/50">
                        <Building2 size={12} className="shrink-0" />
                        {report.officeName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap text-slate-600 font-mono">
                      {report.trainingDate}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap text-slate-600 font-mono">
                      {report.trainingTimeStart} ～ {report.trainingTimeEnd}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <span 
                        onClick={() => onSelectReport(report)}
                        className="hover:text-blue-600 cursor-pointer transition-colors duration-100 block truncate max-w-[340px]"
                        title={report.theme}
                      >
                        {report.theme}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectReport(report)}
                          className="p-1.5 hover:bg-blue-50 rounded text-slate-600 hover:text-blue-600 transition cursor-pointer"
                          title="閲覧・印刷"
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

          {/* Mobile Stacked List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {sortedReports.map((report) => (
              <div key={report.id} className="p-4 space-y-3 font-meiryo-ui text-xs">
                {/* Office and Date Row */}
                <div className="flex justify-between items-start gap-2">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                    {report.officeName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap shrink-0">
                    {report.trainingDate}
                  </span>
                </div>

                {/* Theme row */}
                <div>
                  <h4 
                    onClick={() => onSelectReport(report)}
                    className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer leading-relaxed text-sm"
                  >
                    {report.theme}
                  </h4>
                </div>

                {/* Time & Actions Row */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-mono">
                    時間: {report.trainingTimeStart} ～ {report.trainingTimeEnd}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectReport(report)}
                      className="p-1 text-slate-600 hover:text-blue-600 cursor-pointer"
                      title="閲覧・印刷"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      onClick={() => onEditReport(report)}
                      className="p-1 text-slate-600 hover:text-blue-600 cursor-pointer"
                      title="編集"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("この研修報告書を削除してもよろしいですか？（元には戻せません）")) {
                          onDeleteReport(report.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TrainingReport } from '../types';
import { Printer, X, Eye } from 'lucide-react';

interface ReportPreviewProps {
  report: TrainingReport;
  onClose: () => void;
  onEdit: () => void;
}

// Format Western date to traditional Japanese Reiwa format
function formatJapaneseEraDate(dateStr: string) {
  if (!dateStr) return "令和    年    月    日 (   )";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "令和    年    月    日 (   )";
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[date.getDay()];
  
  const reiwaYear = year >= 2019 ? year - 2018 : year;
  const eraStr = year >= 2019 ? `令和 ${reiwaYear}` : `${year}`;
  
  // Convert numbers to Meiryo UI styled spans
  return (
    <span className="font-meiryo-ui text-[10pt]">
      {eraStr} 年 {month} 月 {day} 日 ( {weekday} )
    </span>
  );
}

// Formats a time string or falls back
function formatTimeMeiryo(timeStr: string) {
  if (!timeStr) return "--:--";
  return <span className="font-meiryo-ui text-[10pt]">{timeStr}</span>;
}

// Helper to auto-fit text onto a single line by adjusting font-size dynamically
function AutoFitText({ text }: { text: string }) {
  let fontSize = "text-[10pt]";
  if (text.length > 28) {
    fontSize = "text-[7pt]";
  } else if (text.length > 22) {
    fontSize = "text-[8pt]";
  } else if (text.length > 16) {
    fontSize = "text-[9pt]";
  }
  return (
    <div className={`whitespace-nowrap overflow-hidden text-ellipsis ${fontSize} leading-none font-bold w-full`}>
      {text}
    </div>
  );
}

// Convert plain text paragraph or sentences to bullet points if they aren't already
function formatToBullets(text: string | undefined): string {
  if (!text) return "研修内容は未要約です。";
  const trimmed = text.trim();
  if (!trimmed) return "研修内容は未要約です。";
  
  // If already formatted as bullet points, return as is
  if (trimmed.startsWith("・") || trimmed.includes("\n・")) {
    return trimmed;
  }
  
  // Split by Japanese full stop, newline, etc.
  const items = trimmed
    .split(/[。.\n\r]+/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
    
  if (items.length === 0) return trimmed;
  return items.map(item => `・${item}`).join("\n");
}

export default function ReportPreview({ report, onClose, onEdit }: ReportPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top action bar - hidden during print */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Eye className="text-blue-600" size={18} />
          <span className="font-bold text-slate-800 text-sm font-hgs-gothic">A4 印刷プレビュー表示中</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs border border-slate-200 transition font-meiryo-ui cursor-pointer"
          >
            編集する
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#1e293b] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md font-meiryo-ui cursor-pointer"
          >
            <Printer size={14} />
            A4 縦で印刷する
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg border border-slate-200 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Actual A4 Printable Sheet Container */}
      <div className="print-area a4-page font-hgs-gothic text-slate-800 leading-relaxed overflow-x-auto">
        <div className="w-[180mm] mx-auto space-y-3">
          {/* Top Info Header Section (Centered 14pt title, no underline, minimized spacing) */}
          <div className="text-center pb-1 pt-0 w-full">
            <h1 className="text-[14pt] font-bold tracking-widest text-black font-hgs-gothic leading-none">
              研修報告書 兼 議事録
            </h1>
          </div>

          {/* Main Grid Table (Audit-compliant styled border box) */}
          <div className="border border-black w-full text-xs text-black">
            
            {/* Row 1: Office and Training Date */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center">
                事業所名
              </div>
              <div className="col-span-4 px-3 py-1.5 border-r border-black flex items-center font-meiryo-ui text-[10pt] font-bold leading-tight break-words whitespace-normal">
                {report.officeName}
              </div>
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center">
                開催日
              </div>
              <div className="col-span-4 px-3 py-1.5 flex items-center">
                {formatJapaneseEraDate(report.trainingDate)}
              </div>
            </div>

            {/* Row 2: Hours and Location */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center">
                開催時間
              </div>
              <div className="col-span-4 px-3 py-1.5 border-r border-black flex items-center gap-1">
                {formatTimeMeiryo(report.trainingTimeStart)}
                <span className="font-meiryo-ui text-[9pt]">～</span>
                {formatTimeMeiryo(report.trainingTimeEnd)}
              </div>
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center">
                開催場所
              </div>
              <div className="col-span-4 px-3 py-1.5 flex items-center font-meiryo-ui text-[10pt] leading-tight break-words whitespace-normal">
                {report.location}
              </div>
            </div>

            {/* Row 3: Facilitator and Report Date/Reporter */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center">
                講師・進行
              </div>
              <div className="col-span-4 px-3 py-1.5 border-r border-black flex items-center font-meiryo-ui text-[10pt]">
                {report.lecturer}
              </div>
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center">
                報告日／報告者
              </div>
              <div className="col-span-4 px-3 py-1.5 flex items-center font-meiryo-ui text-[10pt] leading-tight break-words whitespace-normal">
                {report.reportDate ? report.reportDate.replace(/-/g, '/') : ''}　／　{report.reporter}
              </div>
            </div>

            {/* Row 4: Theme (Increased height and extra visual prominence) */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 bg-slate-100 px-3 py-2.5 border-r border-black font-bold flex items-center justify-center text-center">
                議題・テーマ
              </div>
              <div className="col-span-10 px-4 py-2.5 font-bold text-[11pt] flex items-center bg-slate-50/30 font-meiryo-ui break-words whitespace-normal">
                {report.theme}
              </div>
            </div>

            {/* Row 5: Materials (Moved here right below Theme, full-width row) */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 bg-slate-50 px-3 py-2 border-r border-black font-bold flex items-center justify-center text-center">
                使用教材等
              </div>
              <div className="col-span-10 px-4 py-2 font-meiryo-ui text-xs leading-relaxed break-words whitespace-normal">
                {report.materials || "なし"}
              </div>
            </div>

            {/* Row 6: Attendance Status */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 bg-slate-50 px-3 py-2 border-r border-black font-bold flex items-center justify-center text-center">
                参加状況
              </div>
              <div className="col-span-10 p-2 space-y-1.5">
                {/* Attendees and Non-attendees list in a 2-column format */}
                <div className="grid grid-cols-12 gap-2 text-[9pt] font-meiryo-ui">
                  <div className="col-span-6 flex items-start gap-1">
                    <span className="font-bold shrink-0 text-black">受講 ({report.attendeesCount}名):</span>
                    <span className="text-slate-800 leading-snug break-words whitespace-normal">{report.attendees || "未入力"}</span>
                  </div>
                  <div className="col-span-6 flex items-start gap-1 text-slate-700 border-l border-slate-200 pl-2">
                    <span className="font-bold shrink-0 text-slate-700">未受講 ({report.nonAttendeesCount}名):</span>
                    <span className="text-slate-600 leading-snug break-words whitespace-normal">{report.nonAttendees || "なし"}</span>
                  </div>
                </div>

                {/* Follow-up comments - completely shown with no truncate */}
                <div className="pt-1.5 border-t border-dashed border-slate-200 flex gap-2 text-[8.5pt]">
                  <span className="font-bold shrink-0 text-slate-600">未受講フォロー:</span>
                  <span className="font-meiryo-ui italic text-slate-700 leading-snug break-words whitespace-normal">
                    {report.followUpRecord || "受講者全員出席のため、個別補講等のフォローアップは不要。"}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 7: ① 研修内容 (最小高さ50mm) */}
            <div className="grid grid-cols-12 border-b border-black min-h-[50mm]">
              <div className="col-span-2 bg-slate-50 px-3 py-4 border-r border-black font-bold flex flex-col items-center justify-center text-center">
                <span className="block mb-1">①</span>
                <span>研修内容</span>
              </div>
              <div className="col-span-10 p-3 font-ud-kyokasho text-[9pt] text-slate-900 whitespace-pre-wrap dotted-notepad">
                {formatToBullets(report.summary?.content)}
              </div>
            </div>

            {/* Row 8: ② 研修を通して学んだこと気づいたこと (最小高さ40mm) */}
            <div className="grid grid-cols-12 border-b border-black min-h-[40mm]">
              <div className="col-span-2 bg-slate-50 px-3 py-4 border-r border-black font-bold flex flex-col items-center justify-center text-center">
                <span className="block mb-1">②</span>
                <span>研修を通して</span>
                <span>学んだこと</span>
                <span>気づいたこと</span>
              </div>
              <div className="col-span-10 p-3 font-ud-kyokasho text-[9pt] text-slate-900 whitespace-pre-wrap dotted-notepad">
                {report.summary?.learned || "研修を通じた学びは未要約です。"}
              </div>
            </div>

            {/* Row 9: ③ 事業所内での課題・質疑応答 (最小高さ40mm) */}
            <div className="grid grid-cols-12 border-b border-black min-h-[40mm]">
              <div className="col-span-2 bg-slate-50 px-3 py-4 border-r border-black font-bold flex flex-col items-center justify-center text-center">
                <span className="block mb-1">③</span>
                <span>事業所内で</span>
                <span>の課題・</span>
                <span>質疑応答</span>
              </div>
              <div className="col-span-10 p-3 font-ud-kyokasho text-[9pt] text-slate-900 whitespace-pre-wrap dotted-notepad">
                {report.summary?.challenges || "課題・質疑応答は未要約です。"}
              </div>
            </div>

             {/* Row 10: Attached Materials checkboxes */}
            <div className="grid grid-cols-12">
              <div className="col-span-2 bg-slate-50 px-3 py-3 border-r border-black font-bold flex items-center justify-center text-center">
                添付資料
              </div>
              <div className="col-span-10 px-4 py-3 flex items-center gap-6 font-meiryo-ui text-[9.5pt]">
                <div className="flex items-center gap-1">
                  <span className="inline-block border border-black w-3.5 h-3.5 text-center leading-[12px] font-bold text-blue-700 shrink-0">✓</span>
                  <span>1，今回の研修で使用した教材類</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block border border-black w-3.5 h-3.5 text-center leading-[12px] font-bold text-blue-700 shrink-0">✓</span>
                  <span>2，受講者の理解度テスト</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

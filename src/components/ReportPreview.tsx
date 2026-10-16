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

// Helper to auto-fit text onto a single line by adjusting font-size dynamically so no line breaks occur
function AutoFitSingleLine({ 
  text, 
  basePt = 9.5, 
  minPt = 5,
  bold = false,
  className = "" 
}: { 
  text: string; 
  basePt?: number; 
  minPt?: number;
  bold?: boolean;
  className?: string; 
}) {
  if (!text || text.trim() === "") {
    return <span className="font-meiryo-ui text-slate-400 font-normal text-[9pt]">なし</span>;
  }

  const clean = text.trim();
  const len = clean.length;
  let pt = basePt;

  // Dynamically calculate font-size so all characters display on a single line
  if (len > 55) {
    pt = Math.max(minPt, basePt * 0.44);
  } else if (len > 42) {
    pt = Math.max(minPt, basePt * 0.54);
  } else if (len > 30) {
    pt = Math.max(minPt, basePt * 0.65);
  } else if (len > 22) {
    pt = Math.max(minPt, basePt * 0.76);
  } else if (len > 15) {
    pt = Math.max(minPt, basePt * 0.88);
  }

  return (
    <div 
      className={`whitespace-nowrap overflow-hidden flex items-center w-full font-meiryo-ui ${bold ? 'font-bold' : ''} ${className}`}
      style={{ 
        fontSize: `${pt}pt`, 
        lineHeight: 1.15,
        letterSpacing: len > 24 ? "-0.025em" : "normal"
      }}
      title={clean}
    >
      {clean}
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
              <div className="col-span-4 px-3 py-1.5 border-r border-black flex items-center overflow-hidden whitespace-nowrap">
                <AutoFitSingleLine text={report.officeName} basePt={10} bold={true} />
              </div>
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center">
                開催日
              </div>
              <div className="col-span-4 px-3 py-1.5 flex items-center overflow-hidden whitespace-nowrap">
                {formatJapaneseEraDate(report.trainingDate)}
              </div>
            </div>

            {/* Row 2: 合同研修の事業所名 and 受講者名 (事業所名の一番左下段に追加) */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center leading-tight">
                合同研修の事業所名
              </div>
              <div className="col-span-4 px-3 py-1.5 border-r border-black flex items-center overflow-hidden whitespace-nowrap">
                <AutoFitSingleLine text={report.jointOfficeName || "なし"} basePt={9.5} />
              </div>
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center">
                受講者名
              </div>
              <div className="col-span-4 px-3 py-1.5 flex items-center overflow-hidden whitespace-nowrap">
                <AutoFitSingleLine text={report.jointAttendees || "なし"} basePt={9.5} />
              </div>
            </div>

            {/* Row 3: Hours and Location */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center">
                開催時間
              </div>
              <div className="col-span-4 px-3 py-1.5 border-r border-black flex items-center gap-1 overflow-hidden whitespace-nowrap">
                {formatTimeMeiryo(report.trainingTimeStart)}
                <span className="font-meiryo-ui text-[9pt]">～</span>
                {formatTimeMeiryo(report.trainingTimeEnd)}
              </div>
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center">
                開催場所
              </div>
              <div className="col-span-4 px-3 py-1.5 flex items-center overflow-hidden whitespace-nowrap">
                <AutoFitSingleLine text={report.location || "事務所にて"} basePt={9.5} />
              </div>
            </div>

            {/* Row 4: Facilitator and Report Date/Reporter */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center">
                講師・進行役
              </div>
              <div className="col-span-4 px-3 py-1.5 border-r border-black flex items-center overflow-hidden whitespace-nowrap">
                <AutoFitSingleLine text={report.lecturer || "-"} basePt={9.5} />
              </div>
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center">
                報告日／報告者
              </div>
              <div className="col-span-4 px-3 py-1.5 flex items-center overflow-hidden whitespace-nowrap">
                <AutoFitSingleLine 
                  text={`${report.reportDate ? report.reportDate.replace(/-/g, '/') : ''}　／　${report.reporter || ''}`} 
                  basePt={9.5} 
                />
              </div>
            </div>

            {/* Row 5: Theme (Single line auto-fit with visual prominence, ~1.5x font size) */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 bg-slate-100 px-3 py-2.5 border-r border-black font-bold flex items-center justify-center text-center">
                議題・テーマ
              </div>
              <div className="col-span-10 px-4 py-2.5 font-bold flex items-center bg-slate-50/20 overflow-hidden whitespace-nowrap">
                <AutoFitSingleLine text={report.theme || "-"} basePt={16.5} minPt={9.5} bold={true} className="text-black tracking-wide" />
              </div>
            </div>

            {/* Row 6: Materials (Single line auto-fit) */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 bg-slate-50 px-3 py-1.5 border-r border-black font-bold flex items-center justify-center text-center">
                使用教材等
              </div>
              <div className="col-span-10 px-4 py-1.5 flex items-center overflow-hidden whitespace-nowrap">
                <AutoFitSingleLine text={report.materials || "なし"} basePt={9} />
              </div>
            </div>

            {/* Row 7: Attendance Status */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 bg-slate-50 px-3 py-2 border-r border-black font-bold flex items-center justify-center text-center">
                参加状況
              </div>
              <div className="col-span-10 p-2 space-y-1.5">
                {/* Attendees and Non-attendees list */}
                <div className="grid grid-cols-12 gap-2 text-[9pt] font-meiryo-ui">
                  <div className="col-span-6 flex items-center gap-1 overflow-hidden whitespace-nowrap">
                    <span className="font-bold shrink-0 text-black">受講 ({report.attendeesCount || 0}名):</span>
                    <AutoFitSingleLine text={report.attendees || "未入力"} basePt={8.5} />
                  </div>
                  <div className="col-span-6 flex items-center gap-1 text-slate-700 border-l border-slate-200 pl-2 overflow-hidden whitespace-nowrap">
                    <span className="font-bold shrink-0 text-slate-700">未受講 ({report.nonAttendeesCount || 0}名):</span>
                    <AutoFitSingleLine text={report.nonAttendees || "なし"} basePt={8.5} />
                  </div>
                </div>

                {/* Follow-up comments */}
                <div className="pt-1 border-t border-dashed border-slate-200 flex items-center gap-2 overflow-hidden whitespace-nowrap text-[8.5pt]">
                  <span className="font-bold shrink-0 text-slate-600">未受講フォロー:</span>
                  <AutoFitSingleLine 
                    text={report.followUpRecord || "受講者全員出席のため、個別補講等のフォローアップは不要。"} 
                    basePt={8} 
                    className="italic text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Row 8: ① 研修内容 (最小高さ58mmに拡大、罫線撤廃・白地化、自動改行・伸縮対応) */}
            <div className="grid grid-cols-12 border-b border-black min-h-[58mm]">
              <div className="col-span-2 bg-slate-50 px-3 py-4 border-r border-black font-bold flex flex-col items-center justify-center text-center">
                <span className="block mb-1">①</span>
                <span>研修内容</span>
              </div>
              <div className="col-span-10 p-3.5 font-ud-kyokasho text-[9pt] text-slate-900 bg-white break-words whitespace-pre-wrap leading-relaxed resize-y overflow-y-auto resizable-report-box min-h-[58mm]">
                {formatToBullets(report.summary?.content)}
              </div>
            </div>

            {/* Row 9: ② 研修を通して学んだこと気づいたこと (最小高さ46mmに拡大、罫線撤廃・白地化、自動改行・伸縮対応) */}
            <div className="grid grid-cols-12 border-b border-black min-h-[46mm]">
              <div className="col-span-2 bg-slate-50 px-3 py-4 border-r border-black font-bold flex flex-col items-center justify-center text-center">
                <span className="block mb-1">②</span>
                <span>研修を通して</span>
                <span>学んだこと</span>
                <span>気づいたこと</span>
              </div>
              <div className="col-span-10 p-3.5 font-ud-kyokasho text-[9pt] text-slate-900 bg-white break-words whitespace-pre-wrap leading-relaxed resize-y overflow-y-auto resizable-report-box min-h-[46mm]">
                {report.summary?.learned || "研修を通じた学びは未要約です。"}
              </div>
            </div>

            {/* Row 10: ③ 事業所内での課題・質疑応答 (最下段のためborder-bなし、最小高さ46mmに拡大、罫線撤廃・白地化、自動改行・伸縮対応) */}
            <div className="grid grid-cols-12 min-h-[46mm]">
              <div className="col-span-2 bg-slate-50 px-3 py-4 border-r border-black font-bold flex flex-col items-center justify-center text-center">
                <span className="block mb-1">③</span>
                <span>事業所内で</span>
                <span>の課題・</span>
                <span>質疑応答</span>
              </div>
              <div className="col-span-10 p-3.5 font-ud-kyokasho text-[9pt] text-slate-900 bg-white break-words whitespace-pre-wrap leading-relaxed resize-y overflow-y-auto resizable-report-box min-h-[46mm]">
                {report.summary?.challenges || "課題・質疑応答は未要約です。"}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

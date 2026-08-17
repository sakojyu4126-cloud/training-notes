/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TrainingReport, QuizQuestion } from '../types';
import { Printer, Eye, EyeOff, CheckCircle, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface QuizSheetProps {
  report: TrainingReport;
  onClose: () => void;
}

export default function QuizSheet({ report, onClose }: QuizSheetProps) {
  const [showAnswers, setShowAnswers] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const questions = report.quizQuestions || [];

  const handlePrint = () => {
    window.print();
  };

  const handleOptionSelect = (qId: string, answer: string) => {
    if (isSubmitted) return;
    setUserAnswers({
      ...userAnswers,
      [qId]: answer
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let correctCount = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setIsSubmitted(true);
    setShowAnswers(true); // Auto show answers & explanations on submission
  };

  const handleReset = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setShowAnswers(false);
    setScore(0);
  };

  return (
    <div className="space-y-6">
      {/* Quiz controls - Hidden on Print */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <HelpCircle className="text-blue-600" size={18} />
          <span className="font-bold text-slate-800 text-sm font-hgs-gothic">受講者理解度テスト 画面表示・印刷設定</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAnswers(!showAnswers)}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs border border-slate-200 transition font-meiryo-ui flex items-center gap-1.5 cursor-pointer"
          >
            {showAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
            {showAnswers ? "解答・解説を隠す" : "解答・解説を表示"}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-[#1e293b] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md font-meiryo-ui cursor-pointer"
          >
            <Printer size={14} />
            テスト用紙を印刷 (A4)
          </button>
        </div>
      </div>

      {/* Interactive Mode Stats Panel - Hidden on Print */}
      {!isSubmitted ? (
        <div className="no-print bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-xs font-bold text-amber-800 font-hgs-gothic">画面上でテストに挑戦できます</h4>
            <p className="text-xs text-amber-700 font-meiryo-ui mt-1">
              下の設問に解答をマークし、「採点する」ボタンをクリックすると、即座に採点と詳細解説が行われます。
              印刷の際は、右上の「解答・解説を表示」トグルでお手本の赤ペン解答（模範解答）の有無を切り替えてから印刷してください。
            </p>
          </div>
        </div>
      ) : (
        <div className="no-print bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-bold text-emerald-800 font-hgs-gothic">採点結果が確定しました</h4>
              <p className="text-xs text-emerald-700 font-meiryo-ui mt-1">
                正解数: <span className="text-lg font-bold text-emerald-600 font-meiryo-ui">{score}</span> / {questions.length} 問中
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold transition font-meiryo-ui shadow-sm"
          >
            <RefreshCw size={12} />
            やり直す
          </button>
        </div>
      )}

      {/* Quiz layout optimized for A4 vertical printing */}
      <div className="print-area a4-page font-hgs-gothic text-slate-800 leading-relaxed overflow-x-auto">
        <div className="w-[180mm] mx-auto space-y-6">
          
          {/* Header */}
          <div className="border-b-2 border-black pb-2 flex items-end justify-between">
            <div>
              <p className="text-[9pt] text-slate-500 font-meiryo-ui uppercase">
                {report.officeName} 法定研修資料
              </p>
              <h2 className="text-xl font-bold font-hgs-gothic text-black tracking-wider">
                研修理解度テスト（確認問題）
              </h2>
            </div>
            
            {/* Blank Score boxes for hand grading in print */}
            <div className="flex border border-black text-center text-xs w-[60mm] h-14">
              <div className="w-1/2 border-r border-black flex flex-col justify-between p-1">
                <div className="font-bold border-b border-dashed border-slate-300 pb-0.5">受講者署名</div>
                <div className="h-6"></div>
              </div>
              <div className="w-1/2 flex flex-col justify-between p-1 bg-slate-50/50">
                <div className="font-bold border-b border-dashed border-slate-300 pb-0.5">得点 / 評価</div>
                <div className="font-meiryo-ui text-slate-400 text-[10pt] leading-tight">
                  {isSubmitted ? `${score} / ${questions.length}` : `　　　 / ${questions.length}`}
                </div>
              </div>
            </div>
          </div>

          {/* Training theme context bar */}
          <div className="bg-slate-50 border border-slate-300 px-3 py-2.5 rounded font-meiryo-ui text-xs flex flex-wrap justify-between gap-2">
            <div>
              <span className="font-bold">対象テーマ:</span> {report.theme}
            </div>
            <div>
              <span className="font-bold">実施日:</span> {report.trainingDate}
            </div>
          </div>

          {/* Quiz list */}
          {questions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-meiryo-ui text-sm border border-dashed border-slate-200 rounded">
              現在、この研修用に自動生成されたテスト問題はありません。
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {questions.map((q, index) => {
                const isCorrect = userAnswers[q.id] === q.correctAnswer;
                
                return (
                  <div key={q.id} className="space-y-3 pb-6 border-b border-dashed border-slate-200 last:border-b-0">
                    {/* Question text */}
                    <div className="flex items-start gap-2">
                      <span className="font-meiryo-ui text-[11pt] font-bold text-black shrink-0">
                        問 {index + 1}.
                      </span>
                      <p className="font-ud-kyokasho text-[11.5pt] text-slate-900 leading-relaxed font-semibold">
                        {q.questionText}
                      </p>
                    </div>

                    {/* Question choices (Render 〇× for boolean, choices for choice) */}
                    <div className="pl-6 space-y-2">
                      {q.type === 'boolean' ? (
                        <div className="flex gap-4">
                          {['〇', '×'].map((option) => {
                            const isSelected = userAnswers[q.id] === option;
                            return (
                              <button
                                type="button"
                                key={option}
                                onClick={() => handleOptionSelect(q.id, option)}
                                className={`px-5 py-2 border rounded-lg text-sm font-bold font-meiryo-ui transition-all duration-100 flex items-center justify-center min-w-[60px] cursor-pointer ${
                                  isSelected 
                                    ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                                    : "bg-white hover:bg-slate-50 border-slate-300 text-slate-800"
                                  }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.choices || []).map((choice) => {
                            const isSelected = userAnswers[q.id] === choice;
                            return (
                              <button
                                type="button"
                                key={choice}
                                onClick={() => handleOptionSelect(q.id, choice)}
                                className={`p-2.5 border rounded-lg text-xs font-meiryo-ui text-left transition-all duration-100 flex items-center gap-2 cursor-pointer ${
                                  isSelected 
                                    ? "bg-blue-600 border-blue-600 text-white font-bold shadow-sm" 
                                    : "bg-white hover:bg-slate-50 border-slate-300 text-slate-700"
                                }`}
                              >
                                <span className="inline-block border border-slate-300 rounded-full w-4 h-4 text-center leading-3 shrink-0 bg-slate-50">
                                  {isSelected ? "✓" : ""}
                                </span>
                                <span>{choice}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Show correct answer check / markers during display or print with answers */}
                    {showAnswers && (
                      <div className="pl-6 mt-3 bg-slate-50 border-l-4 border-blue-600 p-3 rounded-r-lg space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-blue-700 font-meiryo-ui">【正解】</span>
                          <span className="text-sm font-bold text-blue-900 font-meiryo-ui">{q.correctAnswer}</span>
                          
                          {/* Checked on-screen results */}
                          {isSubmitted && (
                            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${
                              isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            } font-meiryo-ui`}>
                              {isCorrect ? "正解" : "不正解"}
                            </span>
                          )}
                        </div>
                        <p className="font-ud-kyokasho text-[10.5pt] text-slate-700 leading-relaxed whitespace-pre-wrap">
                          <span className="font-bold text-[10pt] font-meiryo-ui text-slate-500 block mb-0.5">【解説】</span>
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Submit Button on interactive screens - Hidden on Print */}
              {!isSubmitted && (
                <div className="no-print flex justify-center pt-4">
                  <button
                    type="submit"
                    disabled={Object.keys(userAnswers).length < questions.length}
                    className={`px-8 py-3 rounded-lg font-bold text-sm shadow transition-all duration-150 cursor-pointer ${
                      Object.keys(userAnswers).length < questions.length
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-[#1e293b] hover:bg-slate-800 text-white scale-100 active:scale-95 shadow-md"
                    } font-meiryo-ui`}
                  >
                    採点する（解答と解説を表示）
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Footer of Printable PDF Page */}
          <div className="text-center text-[9pt] text-slate-400 pt-8 border-t border-slate-200">
            {report.officeName}
          </div>

        </div>
      </div>
    </div>
  );
}

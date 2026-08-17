/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { TrainingReport, QuizQuestion } from '../types';
import { 
  Building2, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  BookOpen, 
  Mic, 
  Square, 
  Upload, 
  Cpu, 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertCircle,
  Undo
} from 'lucide-react';

interface ReportFormProps {
  initialReport?: TrainingReport | null;
  onSave: (report: TrainingReport) => void;
  onCancel: () => void;
}

export default function ReportForm({ initialReport, onSave, onCancel }: ReportFormProps) {
  // Form values
  const [id, setId] = useState('');
  const [officeName, setOfficeName] = useState('ヘルパーステーション桃の郷 京都東山');
  const [trainingDate, setTrainingDate] = useState('');
  const [trainingTimeStart, setTrainingTimeStart] = useState('14:00');
  const [trainingTimeEnd, setTrainingTimeEnd] = useState('15:00');
  const [location, setLocation] = useState('ヘルパーステーション桃の郷 事務所にて');
  const [lecturer, setLecturer] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [reporter, setReporter] = useState('');
  const [attendees, setAttendees] = useState('');
  const [attendeesCount, setAttendeesCount] = useState(0);
  const [nonAttendees, setNonAttendees] = useState('');
  const [nonAttendeesCount, setNonAttendeesCount] = useState(0);
  const [followUpRecord, setFollowUpRecord] = useState('');
  const [theme, setTheme] = useState('');
  const [materials, setMaterials] = useState('');
  
  // Custom manual paste inputs / audio inputs
  const [copiedMaterialsText, setCopiedMaterialsText] = useState('');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/mp3');
  const [audioFileName, setAudioFileName] = useState<string>('');

  // Summaries
  const [summaryContent, setSummaryContent] = useState('');
  const [summaryLearned, setSummaryLearned] = useState('');
  const [summaryChallenges, setSummaryChallenges] = useState('');

  // Quiz
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initial populate
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (initialReport) {
      setId(initialReport.id);
      setOfficeName(initialReport.officeName);
      setTrainingDate(initialReport.trainingDate);
      setTrainingTimeStart(initialReport.trainingTimeStart);
      setTrainingTimeEnd(initialReport.trainingTimeEnd);
      setLocation(initialReport.location);
      setLecturer(initialReport.lecturer);
      setReportDate(initialReport.reportDate);
      setReporter(initialReport.reporter);
      setAttendees(initialReport.attendees);
      setAttendeesCount(initialReport.attendeesCount);
      setNonAttendees(initialReport.nonAttendees);
      setNonAttendeesCount(initialReport.nonAttendeesCount);
      setFollowUpRecord(initialReport.followUpRecord);
      setTheme(initialReport.theme);
      setMaterials(initialReport.materials);
      setSummaryContent(initialReport.summary.content);
      setSummaryLearned(initialReport.summary.learned);
      setSummaryChallenges(initialReport.summary.challenges);
      setQuizQuestions(initialReport.quizQuestions || []);
    } else {
      setId('');
      setOfficeName('ヘルパーステーション桃の郷 京都東山');
      setTrainingDate(todayStr);
      setTrainingTimeStart('14:00');
      setTrainingTimeEnd('15:00');
      setLocation('ヘルパーステーション桃の郷 事務所にて');
      setLecturer('');
      setReportDate(todayStr);
      setReporter('');
      setAttendees('');
      setAttendeesCount(0);
      setNonAttendees('');
      setNonAttendeesCount(0);
      setFollowUpRecord('');
      setTheme('');
      setMaterials('');
      setSummaryContent('');
      setSummaryLearned('');
      setSummaryChallenges('');
      setQuizQuestions([]);
    }
  }, [initialReport]);

  // Handle location default change based on office selection
  useEffect(() => {
    if (!initialReport) {
      if (officeName.includes('デイサービス')) {
        setLocation('デイサービス桃の郷 京都東山 デイルームにて');
      } else if (officeName.includes('サービス付高齢者向け住宅')) {
        setLocation('サービス付高齢者向け住宅 桃の郷京都東山 共用談話室にて');
      } else {
        setLocation('ヘルパーステーション桃の郷 事務所にて');
      }
    }
  }, [officeName, initialReport]);

  // Auto count attendees based on input names (separated by comma, space or newline)
  useEffect(() => {
    if (!attendees.trim()) {
      setAttendeesCount(0);
      return;
    }
    const names = attendees.split(/[,、\s\n]+/).filter(name => name.trim().length > 0);
    setAttendeesCount(names.length);
  }, [attendees]);

  // Auto count non-attendees based on names
  useEffect(() => {
    if (!nonAttendees.trim() || nonAttendees.trim() === 'なし' || nonAttendees.trim() === '無し') {
      setNonAttendeesCount(0);
      return;
    }
    const names = nonAttendees.split(/[,、\s\n]+/).filter(name => name.trim().length > 0);
    setNonAttendeesCount(names.length);
  }, [nonAttendees]);

  // Direct Audio Recording Handlers
  const startRecording = async () => {
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setAudioMimeType('audio/mp3');
        setAudioFileName('direct_microphone_recording.mp3');

        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        // stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Microphone access failed:", err);
      setErrorMsg("マイクへのアクセスが拒否されました。ブラウザの権限設定を確認してください。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Handle uploaded audio files
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFileName(file.name);
      setAudioMimeType(file.type || 'audio/mp3');

      const reader = new FileReader();
      reader.onloadend = () => {
        setAudioBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Call Gemini summarizing API on the server
  const handleAutoSummarize = async () => {
    if (!audioBase64 && !copiedMaterialsText.trim()) {
      setErrorMsg("録音した音声、またはコピー＆ペースト用の教材テキストのどちらかを事前に入力してください。");
      return;
    }

    if (!theme.trim()) {
      setErrorMsg("研修の議題・テーマを入力してください（AIの重要な要約の手がかりになります）。");
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: audioBase64,
          mimeType: audioMimeType,
          textData: copiedMaterialsText,
          theme: theme,
          officeName: officeName
        })
      });

      const data = await response.json();
      if (data.success) {
        setSummaryContent(data.summary.content);
        setSummaryLearned(data.summary.learned);
        setSummaryChallenges(data.summary.challenges);
        setQuizQuestions(data.quizQuestions);
      } else {
        setErrorMsg(data.error || "要約の生成に失敗しました。APIキーまたはネットワークを確認してください。");
      }
    } catch (err: any) {
      console.error("Summary error:", err);
      setErrorMsg("サーバーとの接続中にエラーが発生しました。設定メニューからAPIキーの有無を確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  // Save the report
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim() || !reporter.trim() || !lecturer.trim()) {
      setErrorMsg("必須項目（議題、報告者、講師・進行担当）を全て入力してください。");
      return;
    }

    const report: TrainingReport = {
      id: id || "report-" + Date.now(),
      officeName,
      trainingDate,
      trainingTimeStart,
      trainingTimeEnd,
      location,
      lecturer,
      reportDate,
      reporter,
      attendees,
      attendeesCount,
      nonAttendees,
      nonAttendeesCount,
      followUpRecord,
      theme,
      materials,
      summary: {
        content: summaryContent,
        learned: summaryLearned,
        challenges: summaryChallenges
      },
      quizQuestions,
      createdAt: new Date().toISOString()
    };

    onSave(report);
  };

  // Helper to format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to add a custom quiz question
  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `man-${Date.now()}`,
      type: 'boolean',
      questionText: '新しい問題文をここに入力してください。',
      correctAnswer: '〇',
      explanation: 'ここに問題に対する正しい解説を詳しく記載してください。'
    };
    setQuizQuestions([...quizQuestions, newQ]);
  };

  // Helper to delete a quiz question
  const handleDeleteQuestion = (idToDelete: string) => {
    setQuizQuestions(quizQuestions.filter(q => q.id !== idToDelete));
  };

  // Helper to edit a quiz question
  const handleEditQuestion = (index: number, updatedField: Partial<QuizQuestion>) => {
    const updated = [...quizQuestions];
    updated[index] = { ...updated[index], ...updatedField } as QuizQuestion;
    setQuizQuestions(updated);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8 bg-white p-6 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-hgs-gothic">
            {initialReport ? '研修報告書の編集' : '新規研修報告書・議事録の作成'}
          </h2>
          <p className="text-xs text-slate-500 font-meiryo-ui mt-1">
            音声データや研修資料テキストを取り込んで、行政監査に対応可能な報告書と理解度テストを自動生成します。
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm border border-slate-200 transition font-meiryo-ui cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#1e293b] hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition shadow-sm font-meiryo-ui cursor-pointer"
          >
            報告書を保存
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-md flex items-start gap-2">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-rose-700 font-meiryo-ui">{errorMsg}</div>
        </div>
      )}

      {/* 1. 基本項目セクション */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-slate-400 font-hgs-gothic border-b border-slate-100 pb-2 uppercase tracking-wider">
          1. 研修の基本情報
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 事業所名（都度選択可能） */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
              <Building2 size={14} className="text-blue-600" />
              事業所名 <span className="text-rose-500">*</span>
            </label>
            <select
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-meiryo-ui"
            >
              <option value="ヘルパーステーション桃の郷 京都東山">ヘルパーステーション桃の郷 京都東山</option>
              <option value="デイサービス桃の郷 京都東山">デイサービス桃の郷 京都東山</option>
              <option value="サービス付高齢者向け住宅　桃の郷京都東山">サービス付高齢者向け住宅　桃の郷京都東山</option>
            </select>
          </div>

          {/* 議題・テーマ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
              <BookOpen size={14} className="text-blue-600" />
              議題・テーマ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例：個人情報保護・守秘義務研修"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
            />
          </div>

          {/* 開催日 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
              <Calendar size={14} className="text-blue-600" />
              開催日
            </label>
            <input
              type="date"
              value={trainingDate}
              onChange={(e) => setTrainingDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
            />
          </div>

          {/* 開催時間 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
                <Clock size={14} className="text-blue-600" />
                開始時間
              </label>
              <input
                type="time"
                value={trainingTimeStart}
                onChange={(e) => setTrainingTimeStart(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
                <Clock size={14} className="text-blue-600" />
                終了時間
              </label>
              <input
                type="time"
                value={trainingTimeEnd}
                onChange={(e) => setTrainingTimeEnd(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
              />
            </div>
          </div>

          {/* 開催場所 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
              <MapPin size={14} className="text-blue-600" />
              開催場所
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
            />
          </div>

          {/* 講師・進行担当 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
              <User size={14} className="text-blue-600" />
              講師・進行担当 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例：山田 太郎（管理者）"
              value={lecturer}
              onChange={(e) => setLecturer(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
            />
          </div>

          {/* 報告日 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
              <Calendar size={14} className="text-blue-600" />
              報告日
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
            />
          </div>

          {/* 報告者 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
              <User size={14} className="text-blue-600" />
              報告者 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例：山田 太郎"
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
            />
          </div>
        </div>

        {/* 使用教材・資料 */}
        <div>
          <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
            <FileText size={14} className="text-blue-600" />
            使用教材・資料 （EラーニングやYouTubeのURLも含めてご記入ください）
          </label>
          <input
            type="text"
            placeholder="例：厚生労働省「虐待防止ガイドライン」、YouTube: 介護の尊厳を守る研修動画"
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
          />
        </div>
      </div>

      {/* 2. 参加状況・フォローセクション */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-slate-400 font-hgs-gothic border-b border-slate-100 pb-2 uppercase tracking-wider">
          2. 受講者・未受講状況（手入力）
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 受講者名 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 font-meiryo-ui flex items-center gap-1">
                受講者名（お名前を入力してください。読点「、」や改行で区切ると自動カウントされます）
              </label>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold font-meiryo-ui">
                受講数: {attendeesCount} 名
              </span>
            </div>
            <textarea
              placeholder="例：山田 太郎、鈴木 花子、佐藤 二郎、高橋 三郎、渡辺 四郎、伊藤 五郎"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
            />
          </div>

          {/* 未受講者名 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 font-meiryo-ui flex items-center gap-1">
                未受講者名
              </label>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold font-meiryo-ui">
                未受講数: {nonAttendeesCount} 名
              </span>
            </div>
            <textarea
              placeholder="例：中村 六子、小林 七郎（いない場合は「なし」）"
              value={nonAttendees}
              onChange={(e) => setNonAttendees(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
            />
          </div>
        </div>

        {/* 未受講者フォロー記録 */}
        <div>
          <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5">
            未受講者フォロー記録
          </label>
          <textarea
            placeholder="例：未受講の中村氏・小林氏には、後日、本日の研修レジュメを配布し、理解度テストを個別に実施することでフォローアップと評価を実施する。"
            value={followUpRecord}
            onChange={(e) => setFollowUpRecord(e.target.value)}
            rows={2}
            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
          />
        </div>
      </div>

      {/* 3. 音声・コピーテキスト取り込み＆AI要約エンジン */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 font-hgs-gothic flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            3. AI自動要約・監査報告書生成エンジン
          </h3>
          <p className="text-xs text-slate-500 font-meiryo-ui mt-1">
            Excel、PDF、Wordなどの研修教材を直コピペ、またはスマートフォンからの直接録音・音声ファイルアップロードを行い、「AIで要約＆テスト自動生成」をクリックしてください。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Audio Data section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 font-meiryo-ui">【A】研修音声の取り込み（直接録音 ＆ ファイルインポート）</h4>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Direct Record Button */}
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shadow-sm font-meiryo-ui"
                >
                  <Mic size={16} />
                  直接録音を開始
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition animate-pulse font-meiryo-ui"
                >
                  <Square size={16} />
                  録音停止 ({formatTime(recordingSeconds)})
                </button>
              )}

              {/* Upload audio file (supports iPhone, Android, etc.) */}
              <label className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-sm border border-slate-300 transition cursor-pointer font-meiryo-ui shadow-sm">
                <Upload size={16} className="text-slate-500" />
                音声ファイルを選択
                <input 
                  type="file" 
                  accept="audio/*,video/*" 
                  onChange={handleAudioUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* Audio Preview status */}
            {audioFileName && (
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex items-center justify-between font-meiryo-ui">
                <div className="flex items-center gap-2 text-slate-600 truncate">
                  <FileText size={14} className="text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">{audioFileName}</span>
                  <span className="text-slate-400">({(audioMimeType || 'audio').split('/')[1]})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAudioBase64(null);
                    setAudioFileName('');
                  }}
                  className="text-rose-500 hover:text-rose-600 font-bold px-1 cursor-pointer"
                  title="削除"
                >
                  取り消し
                </button>
              </div>
            )}
          </div>

          {/* Copy-paste manuals section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 font-meiryo-ui flex items-center gap-1">
              【B】研修資料テキスト（PDF、Excel、Word、WEB等のコピー＆ペースト）
            </h4>
            <textarea
              placeholder="教材、レジュメ、スライド資料、またはEラーニングの文章、ニュース記事などをここに貼り付けてください。"
              value={copiedMaterialsText}
              onChange={(e) => setCopiedMaterialsText(e.target.value)}
              rows={5}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
            />
          </div>
        </div>

        {/* Generate triggers */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            disabled={isLoading || (!audioBase64 && !copiedMaterialsText.trim())}
            onClick={handleAutoSummarize}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white shadow transition-all duration-150 cursor-pointer ${
              isLoading || (!audioBase64 && !copiedMaterialsText.trim())
                ? "bg-slate-300 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-amber-500 to-blue-600 hover:from-amber-600 hover:to-blue-700 scale-100 active:scale-95 shadow-md"
            } font-meiryo-ui`}
          >
            <Cpu size={18} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "AIが解析・要約・理解度テスト生成中..." : "AIで要約 ＆ 理解度テストを自動生成"}
          </button>
        </div>
      </div>

      {/* 4. 自動入力部分のプレビュー・編集 */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-slate-400 font-hgs-gothic border-b border-slate-100 pb-2 uppercase tracking-wider">
          4. 研修結果の要約（自動入力 ＆ カスタマイズ）
        </h3>

        {/* ① 研修内容 (UD デジタル 教科書体 NK) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
            ①研修内容（UD デジタル 教科書体 NKで表示されます。手動修正も可能です）
          </label>
          <textarea
            placeholder="AIで要約、または手入力してください。監査において最も重要視される部分です。"
            value={summaryContent}
            onChange={(e) => setSummaryContent(e.target.value)}
            rows={5}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-ud-kyokasho bg-slate-50/50"
          />
        </div>

        {/* ② 研修を通して学んだこと、気づいたこと */}
        <div>
          <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
            ②研修を通して学んだこと、気づいたこと
          </label>
          <textarea
            placeholder="AIで要約、または手入力してください。参加スタッフとしての具体的な学びや意識向上を記載します。"
            value={summaryLearned}
            onChange={(e) => setSummaryLearned(e.target.value)}
            rows={5}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-ud-kyokasho bg-slate-50/50"
          />
        </div>

        {/* ③ 事業所内での課題・質疑応答 */}
        <div>
          <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
            ③事業所内での課題・質疑応答（Q＆Aを含む）
          </label>
          <textarea
            placeholder="AIで要約、または手入力してください。今後の事業所独自のルール策定や、質疑応答（Q: 〜 A: 〜）を記載します。"
            value={summaryChallenges}
            onChange={(e) => setSummaryChallenges(e.target.value)}
            rows={5}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-ud-kyokasho bg-slate-50/50"
          />
        </div>
      </div>

      {/* 5. 理解度テスト編集セクション */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-400 font-hgs-gothic uppercase tracking-wider">
            5. 受講者の理解度テスト（自動生成 ＆ 編集）
          </h3>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition font-meiryo-ui cursor-pointer"
          >
            <Plus size={14} />
            問題を追加
          </button>
        </div>

        {quizQuestions.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-6 text-center text-sm text-slate-500 font-meiryo-ui">
            現在、理解度テスト問題はありません。上記の「AIで自動生成」を実行するか、右上の「問題を追加」ボタンから手動で問題を作成できます。
          </div>
        ) : (
          <div className="space-y-4">
            {quizQuestions.map((q, qIndex) => (
              <div key={q.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/30 space-y-3 relative group">
                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="この問題を削除"
                >
                  <Trash2 size={16} />
                </button>

                {/* Question Type and Number */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-600 font-meiryo-ui">
                    問 {qIndex + 1}
                  </span>
                  <select
                    value={q.type}
                    onChange={(e) => handleEditQuestion(qIndex, { type: e.target.value as any })}
                    className="border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-meiryo-ui"
                  >
                    <option value="boolean">〇×問題</option>
                    <option value="choice">多肢選択問題</option>
                  </select>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 font-meiryo-ui mb-1">問題文</label>
                  <input
                    type="text"
                    value={q.questionText}
                    onChange={(e) => handleEditQuestion(qIndex, { questionText: e.target.value })}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm bg-white focus:ring-1 focus:ring-blue-500 font-meiryo-ui"
                  />
                </div>

                {/* Choices (only if choice) */}
                {q.type === 'choice' && (
                  <div className="space-y-1 bg-white p-3 rounded border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 font-meiryo-ui mb-1">
                      選択肢（4つ。変更すると正解の設定も更新されます）
                    </label>
                    {Array.from({ length: 4 }).map((_, choiceIdx) => {
                      const currentChoices = q.choices || ["1. ", "2. ", "3. ", "4. "];
                      return (
                        <input
                          key={choiceIdx}
                          type="text"
                          value={currentChoices[choiceIdx] || ''}
                          placeholder={`選択肢 ${choiceIdx + 1}`}
                          onChange={(e) => {
                            const newChoices = [...currentChoices];
                            newChoices[choiceIdx] = e.target.value;
                            handleEditQuestion(qIndex, { choices: newChoices });
                          }}
                          className="w-full border border-slate-150 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 font-meiryo-ui mb-1"
                        />
                      );
                    })}
                  </div>
                )}

                {/* Correct Answer and Explanation */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 font-meiryo-ui mb-1">正解</label>
                    {q.type === 'boolean' ? (
                      <select
                        value={q.correctAnswer}
                        onChange={(e) => handleEditQuestion(qIndex, { correctAnswer: e.target.value })}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 font-meiryo-ui"
                      >
                        <option value="〇">〇</option>
                        <option value="×">×</option>
                      </select>
                    ) : (
                      <select
                        value={q.correctAnswer}
                        onChange={(e) => handleEditQuestion(qIndex, { correctAnswer: e.target.value })}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 font-meiryo-ui"
                      >
                        {(q.choices || ["1. ", "2. ", "3. ", "4. "]).map((choice, idx) => (
                          <option key={idx} value={choice}>{choice}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-600 font-meiryo-ui mb-1">詳細な解説</label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => handleEditQuestion(qIndex, { explanation: e.target.value })}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 font-meiryo-ui"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm border border-slate-200 transition font-meiryo-ui cursor-pointer"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-[#1e293b] hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition shadow-md font-meiryo-ui cursor-pointer"
        >
          完璧な報告書として保存
        </button>
      </div>
    </form>
  );
}

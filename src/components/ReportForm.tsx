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
  Undo,
  CheckCircle2,
  RotateCw,
  Loader2,
  Volume2,
  Settings2,
  Paperclip,
  Image as ImageIcon,
  Clipboard,
  X,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  convertAudioWithWebAudio, 
  convertAudioFormat, 
  convertAudioToWav, 
  convertM4aToWav, 
  convertAudioToWebM, 
  getMediaRecorderSupportInfo, 
  getOptimalRecordingMimeType, 
  isRecordingSupported, 
  formatFileSize, 
  formatAudioDuration,
  MediaRecorderSupportInfo
} from '../utils/audioConverter';

interface ReportFormProps {
  initialReport?: TrainingReport | null;
  onSave: (report: TrainingReport) => void;
  onCancel: () => void;
}

export default function ReportForm({ initialReport, onSave, onCancel }: ReportFormProps) {
  // Form values
  const [id, setId] = useState('');
  const [officeName, setOfficeName] = useState('ヘルパーステーション桃の郷 京都東山');
  const [jointOfficeName, setJointOfficeName] = useState('なし');
  const [jointAttendees, setJointAttendees] = useState('');
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
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/mp4');
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [audioFileSize, setAudioFileSize] = useState<string>('');
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioConversionInfo, setAudioConversionInfo] = useState<string>('');
  const [isConvertingAudio, setIsConvertingAudio] = useState(false);
  const [audioTargetFormat, setAudioTargetFormat] = useState<'auto' | 'wav' | 'webm'>('auto');
  const [mediaSupportInfo, setMediaSupportInfo] = useState<MediaRecorderSupportInfo | null>(null);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedAudioFileRef = useRef<File | Blob | null>(null);

  // Check MediaRecorder capabilities once on mount
  useEffect(() => {
    try {
      const info = getMediaRecorderSupportInfo();
      setMediaSupportInfo(info);
    } catch (e) {
      console.warn("Failed to inspect MediaRecorder capabilities:", e);
    }
  }, []);

  // Summaries
  const [summaryContent, setSummaryContent] = useState('');
  const [summaryLearned, setSummaryLearned] = useState('');
  const [summaryImprovements, setSummaryImprovements] = useState('');
  const [summaryChallenges, setSummaryChallenges] = useState('');
  const [nextTrainingMonth, setNextTrainingMonth] = useState('');
  const [nextTrainingTheme, setNextTrainingTheme] = useState('');

  // Quiz
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Attachments & document paste state
  interface AttachedDoc {
    id: string;
    fileName: string;
    mimeType: string;
    data?: string;
    size?: number;
    type: 'image' | 'pdf' | 'text';
  }
  const [attachments, setAttachments] = useState<AttachedDoc[]>([]);
  const [isParsingDocument, setIsParsingDocument] = useState(false);
  const [documentParseNote, setDocumentParseNote] = useState<string>('');
  const docFileInputRef = useRef<HTMLInputElement | null>(null);

  // Anti-loop and quota safeguards
  const isCallingRef = useRef<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for cooldown safeguard
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const t = setInterval(() => {
      setCooldownRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownRemaining]);

  // Initial populate
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (initialReport) {
      setId(initialReport.id);
      setOfficeName(initialReport.officeName);
      setJointOfficeName(initialReport.jointOfficeName || 'なし');
      setJointAttendees(initialReport.jointAttendees || '');
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
      setSummaryImprovements(initialReport.summary.improvements || '');
      setSummaryChallenges(initialReport.summary.challenges);
      setNextTrainingMonth(initialReport.nextTrainingMonth || '');
      setNextTrainingTheme(initialReport.nextTrainingTheme || '');
      setQuizQuestions(initialReport.quizQuestions || []);
    } else {
      setId('');
      setOfficeName('ヘルパーステーション桃の郷 京都東山');
      setJointOfficeName('なし');
      setJointAttendees('');
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
      setSummaryImprovements('');
      setSummaryChallenges('');
      setNextTrainingMonth('');
      setNextTrainingTheme('');
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
      if (!isRecordingSupported()) {
        setErrorMsg('お使いのブラウザはマイク録音（MediaRecorder）に対応していません。音声ファイルのアップロードをご利用ください。');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      audioChunksRef.current = [];
      
      // Determine optimal audio mime type supported by this browser
      const preferredMime = getOptimalRecordingMimeType();
      const recorder = preferredMime 
        ? new MediaRecorder(stream, { mimeType: preferredMime }) 
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const actualMime = recorder.mimeType || preferredMime || 'audio/webm';
        const rawBlob = new Blob(audioChunksRef.current, { type: actualMime });
        
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        // If targetFormat is explicitly 'wav', convert recording to universal 16kHz WAV
        if (audioTargetFormat === 'wav') {
          setIsConvertingAudio(true);
          setAudioConversionInfo('録音音声を16kHz WAVへ変換中...');
          try {
            const result = await convertAudioToWav(rawBlob);
            selectedAudioFileRef.current = result.blob;
            if (audioBlobUrl) {
              URL.revokeObjectURL(audioBlobUrl);
            }
            const newUrl = URL.createObjectURL(result.blob);
            setAudioBlobUrl(newUrl);
            setAudioMimeType(result.mimeType);
            setAudioFileName(result.fileName);
            setAudioFileSize(formatFileSize(result.convertedSize));
            setAudioDuration(result.duration);
            setAudioConversionInfo(result.formatNote);
            return;
          } catch (convErr) {
            console.warn('WAV conversion of recording failed, using raw recorded blob:', convErr);
          } finally {
            setIsConvertingAudio(false);
          }
        }

        const ext = actualMime.includes('mp4') ? 'm4a' : 'webm';
        const fileName = `direct_recording.${ext}`;
        selectedAudioFileRef.current = rawBlob;
        if (audioBlobUrl) {
          URL.revokeObjectURL(audioBlobUrl);
        }
        const newUrl = URL.createObjectURL(rawBlob);
        setAudioBlobUrl(newUrl);

        setAudioMimeType(actualMime);
        setAudioFileName(fileName);
        setAudioFileSize(formatFileSize(rawBlob.size));
        setAudioConversionInfo(`ブラウザ直接録音 (${actualMime.split(';')[0]})`);
      };

      // 1000ms timeslice ensures continuous chunk buffering and resilience against browser suspends
      recorder.start(1000);
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

  // Handle uploaded audio files with Web Audio API conversion (M4A to 16kHz WAV / WebM)
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      selectedAudioFileRef.current = file;

      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
      const newUrl = URL.createObjectURL(file);
      setAudioBlobUrl(newUrl);

      setIsConvertingAudio(true);
      setAudioFileName(file.name);
      setAudioFileSize(formatFileSize(file.size));
      setAudioConversionInfo('音声を解析し、AI最適化形式へ変換中...');

      try {
        const result = await convertAudioFormat(file, audioTargetFormat);
        selectedAudioFileRef.current = result.blob;
        if (audioBlobUrl) {
          URL.revokeObjectURL(audioBlobUrl);
        }
        const convertedUrl = URL.createObjectURL(result.blob);
        setAudioBlobUrl(convertedUrl);
        setAudioMimeType(result.mimeType);
        setAudioFileName(result.fileName);
        setAudioDuration(result.duration);
        setAudioFileSize(formatFileSize(result.convertedSize));
        setAudioConversionInfo(result.formatNote);
      } catch (err: any) {
        console.error("Audio inspection/conversion error:", err);
        setAudioMimeType('audio/mp4');
      } finally {
        setIsConvertingAudio(false);
      }
    }
  };

  // Change target conversion format (e.g., M4A -> 16kHz WAV or WebM)
  const handleFormatChange = async (newFormat: 'auto' | 'wav' | 'webm') => {
    setAudioTargetFormat(newFormat);
    if (selectedAudioFileRef.current) {
      setIsConvertingAudio(true);
      setAudioConversionInfo('フォーマット再変換中...');
      try {
        const result = await convertAudioFormat(selectedAudioFileRef.current, newFormat);
        selectedAudioFileRef.current = result.blob;
        if (audioBlobUrl) {
          URL.revokeObjectURL(audioBlobUrl);
        }
        const convertedUrl = URL.createObjectURL(result.blob);
        setAudioBlobUrl(convertedUrl);
        setAudioMimeType(result.mimeType);
        setAudioFileName(result.fileName);
        setAudioDuration(result.duration);
        setAudioFileSize(formatFileSize(result.convertedSize));
        setAudioConversionInfo(result.formatNote);
      } catch (err: any) {
        console.error("Format change error:", err);
      } finally {
        setIsConvertingAudio(false);
      }
    }
  };

  // Clear audio state
  const clearAudio = () => {
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    selectedAudioFileRef.current = null;
    setAudioBlobUrl(null);
    setAudioBase64(null);
    setAudioFileName('');
    setAudioFileSize('');
    setAudioDuration(0);
    setAudioConversionInfo('');
    setUploadProgressText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process any uploaded or pasted document (Word, Excel, PDF, Text, Images)
  const processUploadedDocument = async (file: File) => {
    setIsParsingDocument(true);
    setDocumentParseNote(`ファイル「${file.name}」を取り込み中...`);
    setErrorMsg('');

    try {
      const lowerName = (file.name || '').toLowerCase();

      // 1. Client-side instant Excel processing for zero-latency, 100% reliable extraction
      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv') || file.type.includes('spreadsheet') || file.type.includes('excel')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheetTexts: string[] = [];
          for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) continue;
            const csv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t' });
            const validLines = csv.split('\n').filter(line => line.trim().length > 0 && line.replace(/\t/g, '').trim().length > 0);
            if (validLines.length > 0) {
              sheetTexts.push(`【シート: ${sheetName}】\n` + validLines.slice(0, 1000).join('\n'));
            }
          }
          const extractedText = sheetTexts.join('\n\n');
          if (extractedText.trim()) {
            setCopiedMaterialsText(prev => {
              const separator = prev.trim() ? '\n\n---\n\n' : '';
              return prev + separator + `【Excel資料: ${file.name}】\n` + extractedText;
            });
            setDocumentParseNote(`Excel「${file.name}」から表データを正常に取り込みました（${workbook.SheetNames.length}シート）`);
            return;
          }
        } catch (excelErr) {
          console.warn("Client-side Excel extraction fallback to server:", excelErr);
        }
      }

      // 2. Server API fallback for Word (.docx), PDF, Images, or server-side parsing
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: file.name,
          mimeType: file.type
        })
      });

      if (!res.ok) {
        throw new Error(`ファイルの解析に失敗しました (HTTP ${res.status})`);
      }

      const parsed = await res.json();
      if (!parsed.success) {
        throw new Error(parsed.error || 'ファイルの解析に失敗しました');
      }

      if (parsed.type === 'text') {
        setCopiedMaterialsText(prev => {
          const separator = prev.trim() ? '\n\n---\n\n' : '';
          return prev + separator + `【資料テキスト: ${file.name}】\n` + parsed.text;
        });
        setDocumentParseNote(parsed.note || `「${file.name}」からテキストを抽出しました`);
      } else if (parsed.type === 'pdf' || parsed.type === 'image') {
        const newAtt: AttachedDoc = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fileName: file.name,
          mimeType: parsed.mimeType || file.type,
          data: parsed.base64,
          size: file.size,
          type: parsed.type
        };
        setAttachments(prev => [...prev, newAtt]);
        setDocumentParseNote(parsed.note || `「${file.name}」をAI解析対象として添付しました`);
      }
    } catch (err: any) {
      console.error("Document upload/parse error:", err);
      setErrorMsg(err.message || '資料の取り込みに失敗しました。');
    } finally {
      setIsParsingDocument(false);
      if (docFileInputRef.current) {
        docFileInputRef.current.value = '';
      }
    }
  };

  // Clipboard paste event handler on the text area
  const handleMaterialsPaste = async (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. If text/plain exists (including Excel tabular data, tab-delimited cells, or text),
    // DO NOT preventDefault! Let the textarea natively paste the text without interruption!
    const textData = clipboardData.getData('text/plain');
    if (textData && textData.trim().length > 0) {
      setErrorMsg('');
      setDocumentParseNote('クリップボードからテキスト・表データを取り込みました');
      // Natural native paste happens automatically into the textarea
      return;
    }

    // 2. If NO text data exists, check for pasted files (e.g. copied file from File Explorer or screenshot image)
    if (clipboardData.items) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            await processUploadedDocument(file);
            return;
          }
        }
      }
    }
  };

  // Paste from clipboard button
  const handlePasteFromClipboard = async () => {
    setErrorMsg('');
    try {
      // 1. Try reading text first (standard for Excel cells, tables, text)
      if (navigator.clipboard && navigator.clipboard.readText) {
        try {
          const text = await navigator.clipboard.readText();
          if (text && text.trim()) {
            setCopiedMaterialsText(prev => {
              const separator = prev.trim() ? '\n\n' : '';
              return prev + separator + text.trim();
            });
            setDocumentParseNote('クリップボードからテキスト・表データを貼り付けました');
            return;
          }
        } catch (textErr) {
          console.warn("readText permission/fallback:", textErr);
        }
      }

      // 2. If no text or text failed, try reading items (for images / screenshots)
      if (navigator.clipboard && navigator.clipboard.read) {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            for (const type of item.types) {
              if (type.startsWith('image/')) {
                const blob = await item.getType(type);
                const file = new File([blob], `screenshot_${Date.now()}.png`, { type });
                await processUploadedDocument(file);
                return;
              }
            }
          }
        } catch (readErr) {
          console.warn("navigator.clipboard.read failed:", readErr);
        }
      }

      // If browser security blocks clipboard API, guide user clearly
      setDocumentParseNote('テキスト枠をクリックし、キーボードの【Ctrl+V】（Macは【Cmd+V】）で貼り付けてください');
    } catch (err: any) {
      console.warn("Clipboard access error:", err);
      setDocumentParseNote('テキスト枠をクリックし、キーボードの【Ctrl+V】（Macは【Cmd+V】）で貼り付けてください');
    }
  };

  // Document file input change handler
  const handleDocFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      await processUploadedDocument(files[i]);
    }
  };

  // Drag and drop handlers
  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      await processUploadedDocument(files[i]);
    }
  };

  const removeAttachment = (attId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attId));
  };

  // Call Gemini summarizing API on the server using resilient chunked streaming for audio
  // Protected with concurrency locks, double-click prevention, rate limit safeguards, and quota monitoring
  const handleAutoSummarize = async () => {
    // Safeguard 1: Prevent parallel / double-click execution
    if (isCallingRef.current || isLoading) {
      return;
    }

    // Safeguard 2: Cooldown check
    if (cooldownRemaining > 0) {
      setErrorMsg(`短時間の連続実行を防止しています。あと ${cooldownRemaining} 秒お待ちください。`);
      return;
    }

    if (!theme.trim() && !copiedMaterialsText.trim() && !selectedAudioFileRef.current && !audioBase64 && attachments.length === 0) {
      setErrorMsg("研修の「議題・テーマ」、「教材テキスト」、「添付ファイル（PDF/Word/Excel/画像）」、または「音声」のいずれかを入力してください。");
      return;
    }

    isCallingRef.current = true;
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setUploadProgressText('');

    try {
      let uploadId: string | null = null;

      // 1. If an audio file or recorded blob exists, upload via small 2MB chunks to guarantee 100% success on any network/cloud proxy
      if (selectedAudioFileRef.current) {
        const file = selectedAudioFileRef.current;
        uploadId = `audio_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB safe chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const encodedFileName = encodeURIComponent(audioFileName || 'recording.m4a');

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(file.size, start + CHUNK_SIZE);
          const chunkBlob = file.slice(start, end);
          const percent = Math.round(((i + 1) / totalChunks) * 100);
          setUploadProgressText(`音声データを安全に送信中: ${percent}% (${i + 1}/${totalChunks})`);

          const chunkRes = await fetch('/api/audio/upload-chunk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'x-upload-id': uploadId,
              'x-chunk-index': String(i),
              'x-total-chunks': String(totalChunks),
              'x-mime-type': audioMimeType || 'audio/mp4',
              'x-file-name': encodedFileName
            },
            body: chunkBlob
          });

          if (!chunkRes.ok) {
            let errMsg = '音声データの送信に失敗しました';
            try {
              const j = await chunkRes.json();
              if (j.error) errMsg = j.error;
            } catch {}
            throw new Error(errMsg);
          }
        }
      }

      setUploadProgressText('AIが資料・音声を安全に解析し、研修報告書と理解度テストを作成中...');

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioId: uploadId,
          audioData: !uploadId ? audioBase64 : undefined,
          mimeType: audioMimeType,
          textData: copiedMaterialsText,
          theme: theme,
          officeName: officeName,
          attachments: attachments.map(a => ({
            fileName: a.fileName,
            mimeType: a.mimeType,
            data: a.data
          }))
        })
      });

      if (!response.ok) {
        let errorDetail = "AI自動生成の処理中にエラーが発生しました。";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorDetail = errData.error;
          }
        } catch {
          if (response.status === 413) {
            errorDetail = "音声または資料データのサイズが上限を超えています。データサイズを小さくしてお試しください。";
          } else if (response.status === 429) {
            errorDetail = "現在AI呼び出しが集中しているか、無料利用枠の制限に達しました。少し時間をおいてからお試しください。";
          } else if (response.status === 504 || response.status === 408) {
            errorDetail = "AI生成の通信がタイムアウトしました。再度「再試行」を押すか、少し時間をおいてお試しください。";
          } else {
            errorDetail = `サーバーエラー（HTTP ${response.status}）が発生しました。再度「再試行」をお試しください。`;
          }
        }
        setErrorMsg(errorDetail);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSummaryContent(data.summary.content);
        setSummaryLearned(data.summary.learned);
        setSummaryImprovements(data.summary.improvements || '');
        setSummaryChallenges(data.summary.challenges);
        setQuizQuestions(data.quizQuestions);
        const cacheNote = data.cached ? "（キャッシュから0秒で即時復元されました）" : "";
        setSuccessMsg(`AIによる研修内容・学んだこと・改善点・質疑応答の要約と、理解度テスト（全${data.quizQuestions?.length || 3}問）の作成が完了しました！${cacheNote}`);
      } else {
        setErrorMsg(data.error || "AI自動生成の処理中にエラーが発生しました。再度「再試行」をお試しください。");
      }
    } catch (err: any) {
      console.error("Summary error:", err);
      const isNetwork = err?.name === 'TypeError' || String(err).includes('fetch');
      if (isNetwork) {
        setErrorMsg("通信が中断されたか、一時的なタイムアウトが発生しました。再度「再試行」をお試しください。");
      } else {
        setErrorMsg(err?.message || "通信または処理の一時的なエラーが発生しました。再度「再試行」をお試しください。");
      }
    } finally {
      setIsLoading(false);
      isCallingRef.current = false;
      setUploadProgressText('');
      // Set a short cooldown to protect user's free tier quota from accidental rapid re-clicks
      setCooldownRemaining(5);
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
      jointOfficeName,
      jointAttendees,
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
        improvements: summaryImprovements,
        challenges: summaryChallenges
      },
      quizQuestions,
      nextTrainingMonth,
      nextTrainingTheme,
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
          {/* 事業所名（一番左上） */}
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
              placeholder="例：高齢者虐待防止・権利擁護研修"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
            />
          </div>

          {/* 事業所名の下段：合同研修の事業所（3つの事業所から追加があればプルダウン選択） */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
              <Building2 size={14} className="text-slate-600" />
              合同研修の事業所
            </label>
            <select
              value={jointOfficeName}
              onChange={(e) => setJointOfficeName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-meiryo-ui"
            >
              <option value="なし">なし（単独開催）</option>
              <option value="ヘルパーステーション桃の郷 京都東山">ヘルパーステーション桃の郷 京都東山</option>
              <option value="デイサービス桃の郷 京都東山">デイサービス桃の郷 京都東山</option>
              <option value="サービス付高齢者向け住宅　桃の郷京都東山">サービス付高齢者向け住宅　桃の郷京都東山</option>
            </select>
          </div>

          {/* 同じ行の右隣：受講者名（合同事業所からの受講者名） */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
              <User size={14} className="text-slate-600" />
              受講者名（合同事業所の参加者）
            </label>
            <input
              type="text"
              placeholder="例：合同参加者のお名前を入力（監査対応）"
              value={jointAttendees}
              onChange={(e) => setJointAttendees(e.target.value)}
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

          {/* 講師・進行役 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
              <User size={14} className="text-blue-600" />
              講師・進行役 <span className="text-rose-500">*</span>
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
            使用教材・資料
          </label>
          <input
            type="text"
            placeholder="例：厚生労働省「虐待防止ガイドライン」、研修資料レジュメ"
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
                受講者名
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
            3. AI議事録・要約・理解度テスト生成
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Audio Data section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 font-meiryo-ui flex items-center gap-1.5">
                <Volume2 size={14} className="text-blue-600" />
                研修音声の取り込み（M4A・スマホ録音対応）
              </h4>
              <span className="text-[11px] text-slate-500 font-meiryo-ui">Web Audio API自動最適化</span>
            </div>

            {/* Format mode selector & Environment details */}
            <div className="bg-slate-100/80 p-2 rounded-lg border border-slate-200/60 text-xs font-meiryo-ui space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Settings2 size={12} className="text-slate-500" />
                  変換・安定化設定:
                </span>
                {mediaSupportInfo && (
                  <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {mediaSupportInfo.isSafari ? 'Safari/iOS: MP4 & WAV' : 'Chrome/Edge: WebM & WAV'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFormatChange('auto')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                    audioTargetFormat === 'auto'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  自動最適化（M4A→WAV）
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatChange('wav')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                    audioTargetFormat === 'wav'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  16kHz WAV（最高互換性）
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatChange('webm')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                    audioTargetFormat === 'webm'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  WebM（高圧縮）
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Direct Record Button */}
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isConvertingAudio}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition shadow-sm font-meiryo-ui cursor-pointer disabled:opacity-50"
                >
                  <Mic size={15} />
                  直接録音を開始
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition animate-pulse font-meiryo-ui cursor-pointer"
                >
                  <Square size={15} />
                  録音停止 ({formatTime(recordingSeconds)})
                </button>
              )}

              {/* Upload audio file (supports iPhone .m4a, Android, mp3, wav, etc.) */}
              <label className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-300 transition cursor-pointer font-meiryo-ui shadow-sm">
                <Upload size={15} className="text-slate-500" />
                音声ファイルを選択 (.m4a, .mp3, .wav等)
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="audio/*,video/*,.m4a,.mp3,.wav,.aac,.webm,.ogg,.mp4,.mov,audio/mp4,audio/x-m4a" 
                  onChange={handleAudioUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* Converting state indicator */}
            {isConvertingAudio && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-center gap-3 animate-pulse font-meiryo-ui">
                <Loader2 size={18} className="animate-spin text-blue-600 shrink-0" />
                <div>
                  <div className="font-bold">Web Audio APIで音声を最適化変換中...</div>
                  <div className="text-[11px] text-blue-600 mt-0.5">
                    M4A/AAC音声データをデコードし、AI認識に最適な16kHz音声形式へブラウザ内で自動変換しています
                  </div>
                </div>
              </div>
            )}

            {/* Audio Preview & Status */}
            {!isConvertingAudio && audioFileName && (
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs font-meiryo-ui shadow-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-700 truncate min-w-0">
                    <FileText size={15} className="text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">{audioFileName}</span>
                    {audioDuration > 0 && (
                      <span className="shrink-0 text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {formatAudioDuration(audioDuration)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearAudio}
                    className="text-rose-600 hover:text-rose-700 font-bold px-1.5 py-0.5 text-xs rounded hover:bg-rose-50 cursor-pointer shrink-0 transition"
                    title="音声を取り消す"
                  >
                    取り消し
                  </button>
                </div>

                {/* Conversion badges and specs */}
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    AI対応形式へ自動変換済
                  </span>
                  {audioFileSize && (
                    <span className="text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                      サイズ: {audioFileSize}
                    </span>
                  )}
                  {audioConversionInfo && (
                    <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {audioConversionInfo}
                    </span>
                  )}
                </div>

                {/* Native HTML5 Audio Player */}
                {(audioBlobUrl || audioBase64) && (
                  <div className="pt-1">
                    <audio 
                      controls 
                      src={audioBlobUrl || audioBase64 || ''} 
                      className="w-full h-8 outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Explanatory helper note */}
            {!audioFileName && !isConvertingAudio && (
              <p className="text-[11px] text-slate-500 font-meiryo-ui leading-relaxed">
                ※ iPhoneのボイスメモ（.m4a）やICレコーダー、Android音声などに対応。分割送信ストリーミングで大容量音声も安全に解析されます。
              </p>
            )}
          </div>

          {/* Multi-format Materials Text & Files section (Word, Excel, PDF, Images, Direct Paste) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 font-meiryo-ui flex items-center gap-1.5">
                <FileText size={14} className="text-blue-600" />
                研修資料テキスト・ファイル取り込み
              </h4>
              <span className="text-[11px] text-slate-500 font-meiryo-ui">PDF/Word/Excel/画像/コピペ対応</span>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => docFileInputRef.current?.click()}
                disabled={isParsingDocument}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 transition cursor-pointer font-meiryo-ui shadow-xs disabled:opacity-50"
              >
                <Paperclip size={13} className="text-blue-600" />
                ファイル添付 (PDF・Word・Excel・画像)
              </button>

              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 transition cursor-pointer font-meiryo-ui shadow-xs"
                title="クリップボードからテキストや画像を直接貼り付けます"
              >
                <Clipboard size={13} className="text-slate-600" />
                クリップボードから貼り付け
              </button>

              <input
                ref={docFileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*"
                onChange={handleDocFileInputChange}
                className="hidden"
              />
            </div>

            {/* Drag & Drop / Paste area with textarea */}
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition"
            >
              <textarea
                placeholder="教材レジュメ、スライド資料、Eラーニング文章などを直接貼り付けてください。Word・Excel・PDF・画像（JPG/PNG）のドラッグ＆ドロップや、Ctrl+V / Cmd+V による貼り付けにも対応しています。"
                value={copiedMaterialsText}
                onChange={(e) => setCopiedMaterialsText(e.target.value)}
                onPaste={handleMaterialsPaste}
                rows={5}
                className="w-full p-2.5 text-xs bg-transparent outline-none font-meiryo-ui resize-y min-h-[100px]"
              />

              {/* Parsing Document Loader Indicator */}
              {isParsingDocument && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center gap-2 text-xs text-blue-700 font-meiryo-ui rounded-lg">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  <span>{documentParseNote || 'ファイルを解析しています...'}</span>
                </div>
              )}
            </div>

            {/* Document parse note feedback */}
            {documentParseNote && !isParsingDocument && (
              <div className="text-[11px] text-emerald-700 font-meiryo-ui flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>{documentParseNote}</span>
              </div>
            )}

            {/* Attached Multi-modal Files List (PDF & Images sent directly to Gemini) */}
            {attachments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-slate-600 font-meiryo-ui">
                  AI解析対象の添付資料（全 {attachments.length} 件）:
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-2 py-1 rounded text-xs font-meiryo-ui text-slate-700 transition"
                    >
                      {att.type === 'pdf' ? (
                        <FileText size={13} className="text-rose-600 shrink-0" />
                      ) : (
                        <ImageIcon size={13} className="text-emerald-600 shrink-0" />
                      )}
                      <span className="font-medium truncate max-w-[180px]">{att.fileName}</span>
                      {att.size && (
                        <span className="text-[10px] text-slate-400">
                          ({formatFileSize(att.size)})
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="text-slate-400 hover:text-rose-600 ml-1 p-0.5 rounded cursor-pointer transition"
                        title="添付を削除"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate triggers & Status */}
        <div className="flex flex-col items-center gap-3 pt-2">
          {errorMsg && (
            <div className="w-full max-w-xl bg-rose-50 border border-rose-200 p-3.5 rounded-lg flex items-center justify-between gap-3 text-xs sm:text-sm text-rose-700 font-meiryo-ui">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-rose-500 shrink-0" size={18} />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={handleAutoSummarize}
                disabled={isLoading || cooldownRemaining > 0}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                <RotateCw size={12} className={isLoading ? "animate-spin" : ""} />
                再試行
              </button>
            </div>
          )}

          {successMsg && (
            <div className="w-full max-w-xl bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2 text-xs sm:text-sm text-emerald-800 font-meiryo-ui">
              <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {isLoading && (
            <div className="w-full max-w-xl bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3 text-xs sm:text-sm text-blue-800 font-meiryo-ui shadow-xs animate-pulse">
              <Loader2 className="animate-spin text-blue-600 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <div className="font-bold text-blue-900">
                  {uploadProgressText || "AIが資料・音声を解析し、研修報告書と理解度テストを作成しています..."}
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  監査基準に適合する「箇条書き要約」「学んだこと」「質疑応答」「理解度テスト（正解・解説付き）」を自動生成中です。重複呼び出し防止ガード稼働中。
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              disabled={
                isLoading || 
                cooldownRemaining > 0 || 
                (!theme.trim() && !selectedAudioFileRef.current && !audioBase64 && !copiedMaterialsText.trim() && attachments.length === 0)
              }
              onClick={handleAutoSummarize}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white shadow transition-all duration-150 cursor-pointer ${
                isLoading || cooldownRemaining > 0 || (!theme.trim() && !selectedAudioFileRef.current && !audioBase64 && !copiedMaterialsText.trim() && attachments.length === 0)
                  ? "bg-slate-300 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-amber-500 to-blue-600 hover:from-amber-600 hover:to-blue-700 scale-100 active:scale-95 shadow-md"
              } font-meiryo-ui`}
            >
              <Cpu size={18} className={isLoading ? "animate-spin" : ""} />
              {isLoading 
                ? "AIが解析・要約・テスト生成中..." 
                : cooldownRemaining > 0 
                  ? `利用枠保護中（あと ${cooldownRemaining} 秒）` 
                  : "AIで要約 ＆ 理解度テストを自動生成"
              }
            </button>

            {/* Quota and loop safety reassurance label */}
            <span className="text-[10px] text-slate-400 font-meiryo-ui">
              ※ 連打防止ロック・同一データ自動キャッシュ・無料枠上限ガード機能搭載
            </span>
          </div>
        </div>
      </div>

      {/* 4. 自動入力部分のプレビュー・編集 */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-slate-400 font-hgs-gothic border-b border-slate-100 pb-2 uppercase tracking-wider">
          4. 研修結果の要約（自動入力 ＆ カスタマイズ）
        </h3>

        {/* ① 研修内容 */}
        <div>
          <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
            ①研修内容
          </label>
          <textarea
            placeholder="AIで要約、または手入力してください。監査において最も重要視される部分です。"
            value={summaryContent}
            onChange={(e) => setSummaryContent(e.target.value)}
            rows={5}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-ud-kyokasho bg-white resize-y leading-relaxed"
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
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-ud-kyokasho bg-white resize-y leading-relaxed"
          />
        </div>

        {/* ③ 改善点や実践で取り組むこと */}
        <div>
          <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
            ③改善点や実践で取り組むこと
          </label>
          <textarea
            placeholder="AIで要約、または手入力してください。研修を踏まえて業務改善や日々のケア・実践で具体的に取り組む事項を記載します。"
            value={summaryImprovements}
            onChange={(e) => setSummaryImprovements(e.target.value)}
            rows={5}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-ud-kyokasho bg-white resize-y leading-relaxed"
          />
        </div>

        {/* ④ 事業所内での課題・質疑応答 */}
        <div>
          <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
            ④事業所内での課題・質疑応答（Q＆Aを含む）
          </label>
          <textarea
            placeholder="AIで要約、または手入力してください。今後の事業所独自のルール策定や、質疑応答（Q: 〜 A: 〜）を記載します。"
            value={summaryChallenges}
            onChange={(e) => setSummaryChallenges(e.target.value)}
            rows={5}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-ud-kyokasho bg-white resize-y leading-relaxed"
          />
        </div>

        {/* 次回の研修予定 */}
        <div>
          <label className="block text-xs font-bold text-slate-700 font-meiryo-ui mb-1.5 flex items-center gap-1">
            次回の研修予定
          </label>
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-4 sm:col-span-3">
              <input
                type="text"
                list="next-month-options"
                placeholder="●月"
                value={nextTrainingMonth}
                onChange={(e) => setNextTrainingMonth(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-meiryo-ui"
              />
              <datalist id="next-month-options">
                {Array.from({ length: 12 }, (_, i) => `${i + 1}月`).map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div className="col-span-8 sm:col-span-9">
              <input
                type="text"
                placeholder="テーマ（予定）"
                value={nextTrainingTheme}
                onChange={(e) => setNextTrainingTheme(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-meiryo-ui"
              />
            </div>
          </div>
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

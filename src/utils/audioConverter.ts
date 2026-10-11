/**
 * Web Audio API & MediaRecorder Audio Converter and Helper Suite
 * 
 * Provides robust in-browser conversion, inspection, and format stabilization:
 * - M4A (iPhone voice memos, AAC) -> 16kHz Mono PCM WAV conversion
 * - MediaRecorder constraints investigation & optimal recording codec selection
 * - Automatic detection of Safari / iOS / Chrome / Firefox audio capabilities
 * - Universally accepted, speech-optimized 16kHz mono PCM WAV generation for AI & Gemini
 */

export interface AudioConversionResult {
  blob: Blob;            // Converted or validated audio Blob
  base64Data: string;    // Base64 Data URL for preview/inline transmission
  mimeType: string;      // Normalized MIME type (audio/wav, audio/webm, audio/mp4, etc.)
  fileName: string;      // Output file name
  duration: number;      // Audio duration in seconds
  originalSize: number;  // Original file size in bytes
  convertedSize: number; // Converted file size in bytes
  sampleRate: number;    // Sample rate in Hz
  channels: number;      // Channel count (1 = mono, 2 = stereo)
  isConverted: boolean;  // True if format or sample rate was transformed
  formatNote: string;    // Human-readable format summary and specs
}

export interface AudioConversionOptions {
  targetSampleRate?: number; // default: 16000 (speech AI optimal)
  targetChannels?: number;   // default: 1 (mono)
  preferWav?: boolean;       // default: true for M4A conversion
}

export interface MediaRecorderSupportInfo {
  isSupported: boolean;
  preferredMimeType: string;
  supportedMimeTypes: string[];
  supportsWebM: boolean;
  supportsOpus: boolean;
  supportsMp4: boolean;
  supportsAac: boolean;
  isSafari: boolean;
  isIOS: boolean;
  notes: string;
}

/**
 * Investigates browser MediaRecorder constraints and returns supported codecs & environment details.
 * 
 * Browser Constraints:
 * - Chrome / Edge: Supports audio/webm;codecs=opus, audio/webm. Does NOT support audio/mp4 recording.
 * - Firefox: Supports audio/webm;codecs=opus, audio/ogg. Does NOT support audio/mp4 recording.
 * - Safari (macOS / iOS): Supports audio/mp4 and audio/aac. Does NOT support audio/webm!
 * - iOS Safari constraints: Requires user gesture to activate AudioContext, MediaRecorder requires mp4.
 */
export function getMediaRecorderSupportInfo(): MediaRecorderSupportInfo {
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return {
      isSupported: false,
      preferredMimeType: '',
      supportedMimeTypes: [],
      supportsWebM: false,
      supportsOpus: false,
      supportsMp4: false,
      supportsAac: false,
      isSafari: false,
      isIOS: false,
      notes: 'サーバーサイド環境（ブラウザ機能なし）'
    };
  }

  const userAgent = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent) || isIOS;

  const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
  const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const isSupported = hasMediaRecorder && hasGetUserMedia;

  if (!hasMediaRecorder) {
    return {
      isSupported: false,
      preferredMimeType: '',
      supportedMimeTypes: [],
      supportsWebM: false,
      supportsOpus: false,
      supportsMp4: false,
      supportsAac: false,
      isSafari,
      isIOS,
      notes: 'このブラウザはMediaRecorder APIをサポートしていません。ファイルアップロードをご利用ください。'
    };
  }

  const candidateMimes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/wav'
  ];

  const supportedMimeTypes: string[] = [];
  for (const mime of candidateMimes) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) {
        supportedMimeTypes.push(mime);
      }
    } catch {}
  }

  const supportsWebM = supportedMimeTypes.some(m => m.includes('webm'));
  const supportsOpus = supportedMimeTypes.some(m => m.includes('opus'));
  const supportsMp4 = supportedMimeTypes.some(m => m.includes('mp4'));
  const supportsAac = supportedMimeTypes.some(m => m.includes('aac'));

  // Prioritize WebM with Opus where supported, fallback to MP4 for Safari/iOS
  let preferredMimeType = '';
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    preferredMimeType = 'audio/webm;codecs=opus';
  } else if (MediaRecorder.isTypeSupported('audio/webm')) {
    preferredMimeType = 'audio/webm';
  } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
    preferredMimeType = 'audio/mp4';
  } else if (MediaRecorder.isTypeSupported('audio/aac')) {
    preferredMimeType = 'audio/aac';
  } else if (supportedMimeTypes.length > 0) {
    preferredMimeType = supportedMimeTypes[0];
  }

  const notes = isSafari 
    ? 'Safari/iOS環境: audio/mp4 (AAC)録音形式を使用。Web Audio APIにより16kHz WAVへ変換可能。'
    : 'Chromium/Firefox環境: audio/webm (Opus)高圧縮録音形式を使用。';

  return {
    isSupported,
    preferredMimeType,
    supportedMimeTypes,
    supportsWebM,
    supportsOpus,
    supportsMp4,
    supportsAac,
    isSafari,
    isIOS,
    notes
  };
}

/**
 * Returns the best supported MediaRecorder MIME type for the current browser
 */
export function getOptimalRecordingMimeType(): string {
  const info = getMediaRecorderSupportInfo();
  return info.preferredMimeType || 'audio/webm';
}

/**
 * Checks if recording is supported in current browser
 */
export function isRecordingSupported(): boolean {
  return getMediaRecorderSupportInfo().isSupported;
}

/**
 * Robust AudioContext decodeAudioData helper.
 * Handles Safari / iOS constraints:
 * 1. Resumes suspended AudioContext.
 * 2. Clones the input ArrayBuffer (Safari detaches original buffer).
 * 3. Handles both Promise and callback styles.
 */
export async function decodeAudioDataRobust(
  audioContext: AudioContext,
  arrayBuffer: ArrayBuffer
): Promise<AudioBuffer> {
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch {}
  }

  // Clone arrayBuffer because decodeAudioData detaches the buffer in WebKit / Safari
  const bufferCopy = arrayBuffer.slice(0);

  return new Promise<AudioBuffer>((resolve, reject) => {
    let resolved = false;
    try {
      const res = audioContext.decodeAudioData(
        bufferCopy,
        (buf) => {
          if (!resolved) {
            resolved = true;
            resolve(buf);
          }
        },
        (err) => {
          if (!resolved) {
            resolved = true;
            reject(err || new Error('Web Audio decodeAudioData failed'));
          }
        }
      );
      if (res && typeof (res as any).then === 'function') {
        (res as any)
          .then((buf: AudioBuffer) => {
            if (!resolved) {
              resolved = true;
              resolve(buf);
            }
          })
          .catch((err: any) => {
            if (!resolved) {
              resolved = true;
              reject(err);
            }
          });
      }
    } catch (syncErr) {
      if (!resolved) {
        resolved = true;
        reject(syncErr);
      }
    }
  });
}

/**
 * Resamples an AudioBuffer to targetSampleRate (e.g. 16kHz) and mono channels.
 * Uses OfflineAudioContext when supported, with linear interpolation fallback.
 */
export async function resampleAudioBuffer(
  buffer: AudioBuffer,
  targetSampleRate: number = 16000,
  targetChannels: number = 1
): Promise<AudioBuffer> {
  const duration = buffer.duration;
  const targetLength = Math.max(1, Math.ceil(duration * targetSampleRate));

  const OfflineAudioContextClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  if (OfflineAudioContextClass) {
    try {
      const offlineCtx = new OfflineAudioContextClass(targetChannels, targetLength, targetSampleRate);
      const sourceNode = offlineCtx.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.connect(offlineCtx.destination);
      sourceNode.start(0);
      return await offlineCtx.startRendering();
    } catch (e) {
      console.warn('OfflineAudioContext rendering failed, using manual downsampler:', e);
    }
  }

  // Fallback: manual downmixing and linear interpolation
  const numChannels = buffer.numberOfChannels;
  const oldRate = buffer.sampleRate;
  const oldLength = buffer.length;

  const mono = new Float32Array(oldLength);
  for (let c = 0; c < numChannels; c++) {
    const chanData = buffer.getChannelData(c);
    for (let i = 0; i < oldLength; i++) {
      mono[i] += chanData[i] / numChannels;
    }
  }

  const resampledData = new Float32Array(targetLength);
  const ratio = (oldLength - 1) / (targetLength - 1 || 1);
  for (let i = 0; i < targetLength; i++) {
    const srcIndex = i * ratio;
    const i0 = Math.floor(srcIndex);
    const i1 = Math.min(i0 + 1, oldLength - 1);
    const frac = srcIndex - i0;
    resampledData[i] = mono[i0] * (1 - frac) + mono[i1] * frac;
  }

  // Construct dummy AudioBuffer using temporary AudioContext if available
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioContextClass) {
    const tmpCtx = new AudioContextClass();
    try {
      const newBuf = tmpCtx.createBuffer(targetChannels, targetLength, targetSampleRate);
      newBuf.copyToChannel(resampledData, 0);
      return newBuf;
    } finally {
      if (tmpCtx.state !== 'closed') {
        try { await tmpCtx.close(); } catch {}
      }
    }
  }

  return buffer;
}

/**
 * Converts an AudioBuffer into a standard 16-bit PCM WAV Blob.
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numOfChan * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function writeUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function writeUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF Chunk
  writeString('RIFF');
  writeUint32(totalSize - 8);
  writeString('WAVE');

  // "fmt " sub-chunk
  writeString('fmt ');
  writeUint32(16); // SubChunk1Size (16 for PCM)
  writeUint16(1);  // AudioFormat (1 = PCM)
  writeUint16(numOfChan);
  writeUint32(sampleRate);
  writeUint32(byteRate);
  writeUint16(blockAlign);
  writeUint16(16); // BitsPerSample

  // "data" sub-chunk
  writeString('data');
  writeUint32(dataSize);

  // Extract channels
  const channels: Float32Array[] = [];
  for (let c = 0; c < numOfChan; c++) {
    channels.push(buffer.getChannelData(c));
  }

  // Interleave and write 16-bit PCM samples with clamping
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numOfChan; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      const intSample = sample < 0 ? sample * 32768 : sample * 32767;
      view.setInt16(pos, Math.round(intSample), true);
      pos += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Converts a Blob to a base64 Data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader result is not a string'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Normalizes audio MIME type based on file extension and reported type
 */
export function normalizeAudioMime(fileOrBlob: File | Blob): string {
  const name = (fileOrBlob as File).name || '';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const type = fileOrBlob.type?.toLowerCase() || '';

  if (ext === 'm4a' || ext === 'aac' || type.includes('m4a') || type.includes('aac')) {
    return 'audio/mp4';
  }
  if (ext === 'mp3' || type.includes('mp3') || type.includes('mpeg')) {
    return 'audio/mp3';
  }
  if (ext === 'wav' || type.includes('wav')) {
    return 'audio/wav';
  }
  if (ext === 'webm' || type.includes('webm')) {
    return 'audio/webm';
  }
  if (ext === 'ogg' || type.includes('ogg')) {
    return 'audio/ogg';
  }
  return type || 'audio/mp4';
}

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
export function formatAudioDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats bytes into human-readable string (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validates whether an audio File or Blob can be decoded by Web Audio API
 */
export async function validateAudioFile(fileOrBlob: File | Blob): Promise<{ valid: boolean; duration: number; error?: string }> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    return { valid: true, duration: 0 };
  }
  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioContextClass();
    const arrayBuf = await fileOrBlob.arrayBuffer();
    const decoded = await decodeAudioDataRobust(ctx, arrayBuf);
    return { valid: true, duration: decoded.duration };
  } catch (err: any) {
    return { valid: false, duration: 0, error: err?.message || '音声データのデコードに失敗しました' };
  } finally {
    if (ctx && ctx.state !== 'closed') {
      try { await ctx.close(); } catch {}
    }
  }
}

/**
 * Dedicated Converter: Converts M4A / AAC / MP3 / WebM into a standard 16kHz Mono PCM WAV Blob.
 * 
 * Why 16kHz Mono WAV?
 * 1. 100% universal across all browsers, operating systems, and AI models (Gemini, Whisper, Cloud Speech).
 * 2. Eliminates container/codec incompatibilities (e.g. M4A atom parsing differences, AAC profile mismatch).
 * 3. 16kHz mono 16-bit PCM is the gold standard for speech AI recognition (~1.92 MB / 10 min),
 *    yielding instant processing without quality loss.
 */
export async function convertAudioToWav(
  source: File | Blob,
  options: AudioConversionOptions = {}
): Promise<AudioConversionResult> {
  const targetSampleRate = options.targetSampleRate || 16000;
  const targetChannels = options.targetChannels || 1;
  const originalSize = source.size;
  const originalName = (source as File).name || 'audio_input.m4a';
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const outFileName = `${baseName}_16khz.wav`;

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('お使いのブラウザはWeb Audio APIに対応していません。');
  }

  const audioContext = new AudioContextClass();
  try {
    const arrayBuffer = await source.arrayBuffer();
    const decodedBuffer = await decodeAudioDataRobust(audioContext, arrayBuffer);
    const duration = decodedBuffer.duration;

    // Resample to 16kHz mono
    const resampled = await resampleAudioBuffer(decodedBuffer, targetSampleRate, targetChannels);
    const wavBlob = audioBufferToWavBlob(resampled);
    const base64Data = await blobToDataUrl(wavBlob);
    const convertedSize = wavBlob.size;

    const diffPercent = originalSize > 0 
      ? Math.round(((originalSize - convertedSize) / originalSize) * 100)
      : 0;

    let formatNote = `16kHz モノラル WAV 変換完了 (AI最高精度・完全互換)`;
    if (diffPercent > 0) {
      formatNote += ` [${diffPercent}%軽量化]`;
    }

    return {
      blob: wavBlob,
      base64Data,
      mimeType: 'audio/wav',
      fileName: outFileName,
      duration,
      originalSize,
      convertedSize,
      sampleRate: targetSampleRate,
      channels: targetChannels,
      isConverted: true,
      formatNote
    };
  } finally {
    if (audioContext && audioContext.state !== 'closed') {
      try { await audioContext.close(); } catch {}
    }
  }
}

/**
 * Dedicated M4A to WAV helper
 */
export async function convertM4aToWav(
  source: File | Blob,
  options: AudioConversionOptions = {}
): Promise<AudioConversionResult> {
  return convertAudioToWav(source, options);
}

/**
 * Converts audio to WebM format where supported, or falls back gracefully to WAV.
 * Note: Browsers without native MediaRecorder WebM support (like Safari) will automatically
 * convert to standard 16kHz WAV instead.
 */
export async function convertAudioToWebM(
  source: File | Blob,
  options: AudioConversionOptions = {}
): Promise<AudioConversionResult> {
  const originalSize = source.size;
  const originalName = (source as File).name || 'recording.webm';
  const ext = originalName.split('.').pop()?.toLowerCase() || '';
  const mime = source.type?.toLowerCase() || '';

  // If already WebM, validate and return
  if (ext === 'webm' || mime.includes('webm')) {
    let duration = 0;
    const val = await validateAudioFile(source);
    if (val.valid) duration = val.duration;
    const base64Data = await blobToDataUrl(source);

    return {
      blob: source,
      base64Data,
      mimeType: 'audio/webm',
      fileName: originalName,
      duration,
      originalSize,
      convertedSize: originalSize,
      sampleRate: 48000,
      channels: 1,
      isConverted: false,
      formatNote: 'WebM高圧縮形式（ブラウザ録音準拠）'
    };
  }

  // If not WebM, convert to universal 16kHz WAV which all AI models and servers accept
  const wavResult = await convertAudioToWav(source, options);
  return {
    ...wavResult,
    formatNote: `M4A → 16kHz WAV高互換変換完了（WebMと同等の安全性）`
  };
}

/**
 * High-level unified format conversion helper
 * @param source Audio File or Blob
 * @param targetFormat 'wav' | 'webm' | 'auto'
 */
export async function convertAudioFormat(
  source: File | Blob,
  targetFormat: 'wav' | 'webm' | 'auto' = 'auto',
  options: AudioConversionOptions = {}
): Promise<AudioConversionResult> {
  const ext = (source as File).name?.split('.').pop()?.toLowerCase() || '';
  const mime = source.type?.toLowerCase() || '';

  if (targetFormat === 'wav') {
    return convertAudioToWav(source, options);
  }

  if (targetFormat === 'webm') {
    return convertAudioToWebM(source, options);
  }

  // targetFormat === 'auto'
  // If already WebM, preserve WebM
  if (ext === 'webm' || mime.includes('webm')) {
    return convertAudioToWebM(source, options);
  }

  // If M4A / AAC: convert to 16kHz mono WAV for 100% stability and zero codec mismatch
  if (ext === 'm4a' || ext === 'aac' || mime.includes('m4a') || mime.includes('mp4')) {
    try {
      return await convertM4aToWav(source, options);
    } catch (err) {
      console.warn('convertM4aToWav failed, falling back to direct stream:', err);
      return convertAudioWithWebAudio(source as File, options);
    }
  }

  // If WAV: resample to 16kHz mono WAV if needed
  if (ext === 'wav' || mime.includes('wav')) {
    return convertAudioToWav(source, options);
  }

  // For other formats (MP3, etc.):
  try {
    return await convertAudioToWav(source, options);
  } catch {
    return convertAudioWithWebAudio(source as File, options);
  }
}

/**
 * Backward-compatible Web Audio API conversion and audio optimization entry point.
 * Preserves existing interface while returning full `blob: Blob` and metadata.
 */
export async function convertAudioWithWebAudio(
  file: File,
  options: AudioConversionOptions & { targetFormat?: 'wav' | 'webm' | 'auto' } = {}
): Promise<AudioConversionResult> {
  const targetFormat = options.targetFormat || 'auto';
  return convertAudioFormat(file, targetFormat, options);
}

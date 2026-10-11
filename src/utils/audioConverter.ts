/**
 * Web Audio API based Audio Converter and Optimizer
 * 
 * Provides in-browser conversion and optimization for M4A, AAC, MP3, WAV, WebM, etc.
 * Resamples audio to 16kHz mono (speech-optimized), reducing file size significantly
 * and converting to AI-ready, universally accepted PCM WAV format or WebM.
 */

export interface AudioConversionResult {
  base64Data: string;
  mimeType: string;
  fileName: string;
  duration: number; // in seconds
  originalSize: number; // in bytes
  convertedSize: number; // in bytes
  sampleRate: number;
  channels: number;
  isConverted: boolean;
  formatNote: string;
}

export interface AudioConversionOptions {
  targetSampleRate?: number; // default: 16000 (speech AI optimal)
  targetChannels?: number;   // default: 1 (mono)
}

/**
 * Converts an AudioBuffer into a standard 16-bit PCM WAV Blob.
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bytesPerSample = 2; // 16-bit
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

  // RIFF Chunk Descriptor
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
function blobToDataUrl(blob: Blob): Promise<string> {
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
export function normalizeAudioMime(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const type = file.type?.toLowerCase() || '';

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
 * Main Web Audio API conversion and audio optimization entry point.
 * - For already-compressed formats (M4A, AAC, MP3, WebM, OGG):
 *   Preserves efficient compression (avoiding 10x bloat of uncompressed PCM WAV)
 *   while inspecting duration and validating audio via Web Audio API.
 * - For uncompressed WAV files:
 *   Resamples to 16kHz mono PCM WAV to reduce file size.
 * - Sets clean, normalized MIME types for direct Gemini API acceptance.
 */
export async function convertAudioWithWebAudio(
  file: File,
  options: AudioConversionOptions = {}
): Promise<AudioConversionResult> {
  const targetSampleRate = options.targetSampleRate || 16000;
  const targetChannels = options.targetChannels || 1;
  const originalSize = file.size;

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const normalizedMime = normalizeAudioMime(file);
  const isCompressed = ['m4a', 'aac', 'mp3', 'webm', 'ogg', 'mp4'].includes(ext) ||
                       normalizedMime.includes('mp4') || 
                       normalizedMime.includes('webm') || 
                       normalizedMime.includes('mp3');

  // Check if Web Audio API is supported
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  
  // If the file is already compressed (e.g. iPhone M4A voice memo, Android WebM/MP3)
  if (isCompressed) {
    let duration = 0;
    let sampleRate = 44100;
    let channels = 1;

    // Use Web Audio API to decode header and accurately inspect duration & validate file
    if (AudioContextClass) {
      let audioContext: AudioContext | null = null;
      try {
        audioContext = new AudioContextClass();
        const arrayBuffer = await file.arrayBuffer();
        const decodedBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
          const res = audioContext!.decodeAudioData(
            arrayBuffer.slice(0),
            (buf) => resolve(buf),
            (err) => reject(err || new Error('decodeAudioData failed'))
          );
          if (res && typeof (res as any).then === 'function') {
            (res as any).then(resolve).catch(reject);
          }
        });
        duration = decodedBuffer.duration;
        sampleRate = decodedBuffer.sampleRate;
        channels = decodedBuffer.numberOfChannels;
      } catch (e) {
        console.warn('Could not inspect audio duration via Web Audio API, using fallback:', e);
      } finally {
        if (audioContext && audioContext.state !== 'closed') {
          try { await audioContext.close(); } catch {}
        }
      }
    }

    const base64Data = await blobToDataUrl(file);
    const formatLabel = ext ? ext.toUpperCase() : 'M4A';

    return {
      base64Data,
      mimeType: normalizedMime,
      fileName: file.name,
      duration,
      originalSize,
      convertedSize: originalSize,
      sampleRate,
      channels,
      isConverted: true,
      formatNote: `${formatLabel}高音質圧縮形式（Gemini AI & サーバー直接対応）`
    };
  }

  // For uncompressed WAV files: downsample to 16kHz mono to significantly reduce file size
  if (!AudioContextClass) {
    const rawDataUrl = await blobToDataUrl(file);
    return {
      base64Data: rawDataUrl,
      mimeType: normalizedMime,
      fileName: file.name,
      duration: 0,
      originalSize,
      convertedSize: originalSize,
      sampleRate: 0,
      channels: 0,
      isConverted: false,
      formatNote: '元ファイル形式（Web Audio非対応環境）'
    };
  }

  let audioContext: AudioContext | null = null;
  try {
    audioContext = new AudioContextClass();
    const arrayBuffer = await file.arrayBuffer();

    const decodedBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
      const res = audioContext!.decodeAudioData(
        arrayBuffer.slice(0),
        (buf) => resolve(buf),
        (err) => reject(err || new Error('decodeAudioData failed'))
      );
      if (res && typeof (res as any).then === 'function') {
        (res as any).then(resolve).catch(reject);
      }
    });

    const duration = decodedBuffer.duration;
    const targetLength = Math.max(1, Math.ceil(duration * targetSampleRate));

    const OfflineAudioContextClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    let resampledBuffer: AudioBuffer = decodedBuffer;

    if (OfflineAudioContextClass) {
      const offlineCtx = new OfflineAudioContextClass(targetChannels, targetLength, targetSampleRate);
      const sourceNode = offlineCtx.createBufferSource();
      sourceNode.buffer = decodedBuffer;
      sourceNode.connect(offlineCtx.destination);
      sourceNode.start(0);

      resampledBuffer = await offlineCtx.startRendering();
    }

    const wavBlob = audioBufferToWavBlob(resampledBuffer);
    const base64Data = await blobToDataUrl(wavBlob);
    const convertedSize = wavBlob.size;

    const baseFileName = file.name.replace(/\.[^/.]+$/, '');
    const convertedFileName = `${baseFileName}_16khz.wav`;

    const reductionPercent = originalSize > 0 
      ? Math.max(0, Math.round(((originalSize - convertedSize) / originalSize) * 100))
      : 0;

    return {
      base64Data,
      mimeType: 'audio/wav',
      fileName: convertedFileName,
      duration,
      originalSize,
      convertedSize,
      sampleRate: targetSampleRate,
      channels: targetChannels,
      isConverted: true,
      formatNote: `16kHz モノラル WAV (${reductionPercent > 0 ? `${reductionPercent}%軽量化・` : ''}Gemini AI対応形式)`
    };
  } catch (decodeErr) {
    console.warn('Web Audio API decoding error, using raw file data:', decodeErr);
    const rawDataUrl = await blobToDataUrl(file);
    return {
      base64Data: rawDataUrl,
      mimeType: normalizedMime,
      fileName: file.name,
      duration: 0,
      originalSize,
      convertedSize: originalSize,
      sampleRate: 0,
      channels: 0,
      isConverted: false,
      formatNote: '元ファイル形式（サーバー側ffmpegで自動変換）'
    };
  } finally {
    if (audioContext && audioContext.state !== 'closed') {
      try {
        await audioContext.close();
      } catch {}
    }
  }
}

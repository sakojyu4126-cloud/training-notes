/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QuizQuestion {
  id: string;
  type: 'boolean' | 'choice';
  questionText: string;
  choices?: string[]; // e.g., ["A", "B", "C", "D"]
  correctAnswer: string; // "〇", "×", or the selected choice string
  explanation: string;
}

export interface TrainingSummary {
  content: string;      // 研修内容
  learned: string;      // 研修を通して学んだこと、気づいたこと
  challenges: string;   // 事業所内での課題・質疑応答
}

export interface TrainingReport {
  id: string;
  officeName: string; // ヘルパーステーション桃の郷 京都東山, デイサービス桃の郷 京都東山, サービス付高齢者向け住宅 桃の郷京都東山
  trainingDate: string;
  trainingTimeStart: string;
  trainingTimeEnd: string;
  location: string;
  lecturer: string;
  reportDate: string;
  reporter: string;
  attendees: string;      // 受講者（名前、手入力）
  attendeesCount: number; // 自動計算 or 手入力
  nonAttendees: string;   // 未受講者（名前、手入力）
  nonAttendeesCount: number; // 自動計算 or 手入力
  followUpRecord: string; // 未受講者フォロー記録
  theme: string;          // 議題・テーマ
  materials: string;      // 使用教材・資料
  summary: TrainingSummary;
  quizQuestions: QuizQuestion[];
  createdAt: string;
}

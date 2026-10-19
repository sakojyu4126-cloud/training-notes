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
  improvements?: string;// 改善点や実践で取り組むこと
  challenges: string;   // 事業所内での課題・質疑応答
}

export interface TrainingReport {
  id: string;
  officeName: string; // ヘルパーステーション桃の郷 京都東山, デイサービス桃の郷 京都東山, サービス付高齢者向け住宅 桃の郷京都東山
  jointOfficeName?: string; // 合同研修の事業所名（3事業所から選択、または「なし」）
  jointAttendees?: string;  // 受講者名（別事業所からの参加受講者）
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
  nextTrainingMonth?: string; // 次回の研修予定（●月）
  nextTrainingTheme?: string; // 次回の研修予定（テーマ）
  createdAt: string;
}

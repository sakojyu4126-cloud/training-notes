/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body parser with increased limit to support large audio base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "reports.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed reports to showcase a working application instantly (Priority Rule 1)
const SEED_REPORTS = [
  {
    id: "seed-1",
    officeName: "ヘルパーステーション桃の郷 京都東山",
    trainingDate: "2026-06-15",
    trainingTimeStart: "14:00",
    trainingTimeEnd: "15:00",
    location: "ヘルパーステーション桃の郷 事務所にて",
    lecturer: "山田 太郎（管理者）",
    reportDate: "2026-06-16",
    reporter: "山田 太郎",
    attendees: "鈴木 花子、佐藤 二郎、高橋 三郎、渡辺 四郎、伊藤 五郎",
    attendeesCount: 5,
    nonAttendees: "中村 六子",
    nonAttendeesCount: 1,
    followUpRecord: "未受講の中村氏には後日、研修資料を配布のうえ、理解度テストを実施し、補講を完了した（2026年6月18日実施）。",
    theme: "個人情報保護・情報セキュリティ対策研修",
    materials: "令和8年度 厚生労働省「介護サービス事業者における個人情報保護ガイドライン」、事業所内セキュリティマニュアル、確認用チェックシート",
    summary: {
      content: "・介護現場における個人情報保護の重要性と、業務上の守秘義務の遵守を再確認\n・スマートフォンの業務利用時に発生しやすい紛失や誤送信などのセキュリティリスク対策\n・写真や個人情報を含むチャットツール等を使用する際の厳格なログイン管理と宛先確認の徹底\n・車内での重要書類保管の禁止、および不要書類を処分する際の裁断（シュレッダー）処理の徹底",
      learned: "全員が「利用者の情報は最優先で守るべき信頼の基盤である」という認識を新たにした。特にスマートフォンの持ち出しや個人端末の業務利用リスクについて具体的な事案を知ることで、利便性と危険性のバランスを学ぶ。また、日常業務の中で何気なく行っているメモ書きや口頭での引き継ぎ時におけるプライバシー配慮の不徹底に気づくことができた。",
      challenges: "今後の課題として、全職員の業務用デバイスパスワードの定期更新およびログイン履歴の点検作業が挙げられた。\n【主な質疑応答】\nQ: 利用者宅の鍵や書類を持ち出す際、紛失時の即時報告手順はどうなっているか？\nA: 紛失発覚後15分以内に管理者に一報を入れ、速やかに警察への届け出、および事業所内事故対策マニュアルに則った手順を遵守する。"
    },
    quizQuestions: [
      {
        id: "q-1-1",
        type: "boolean",
        questionText: "利用者本人の同意を得ていれば、介護に関係のない他者に対しても、利用者の要介護度や病歴などの個人情報を自由に話してよい。",
        correctAnswer: "×",
        explanation: "利用者本人の同意があっても、介護提供や業務に関係のない他者に個人情報を漏洩することは、守秘義務違反およびプライバシー権の侵害にあたります。必要最小限の範囲内でのみ利用されるべきです。"
      },
      {
        id: "q-1-2",
        type: "boolean",
        questionText: "業務で使用するスマートフォンを紛失した場合、または紛失した疑いがある場合は、速やかに（マニュアルでは15分以内）管理者に報告する必要がある。",
        correctAnswer: "〇",
        explanation: "情報セキュリティインシデント（紛失や漏洩等）発生時は、早期の遠隔ロックや関係機関への対応が必要となるため、速やかな連絡が最重要です。"
      },
      {
        id: "q-1-3",
        type: "choice",
        questionText: "利用者の個人情報が含まれる不要になった書類（引き継ぎメモやケアプランのコピーなど）の適切な処分方法として、最も正しいものはどれか。",
        choices: [
          "1. そのまま事業所の一般ゴミ箱に捨てる",
          "2. シュレッダーで細断処理するか、溶解処理業者に回収を依頼する",
          "3. 裏面が白いので、メモ用紙として再利用する",
          "4. 自宅に持ち帰って家庭用ゴミとして処分する"
        ],
        correctAnswer: "2. シュレッダーで細断処理するか、溶解処理業者に回収を依頼する",
        explanation: "個人情報が記載された資料は第三者に解読されないようシュレッダーや溶解などの復元不可能な方法で処理する必要があります。再利用や一般廃棄は情報漏洩のリスクを極めて高くします。"
      },
      {
        id: "q-1-4",
        type: "boolean",
        questionText: "利用者の個人情報が記載された連絡ノートなどの書類は、他者の目に触れないよう、使用しないときは必ず指定の保管場所に片付ける必要がある。",
        correctAnswer: "〇",
        explanation: "個人情報が記載された書類を机の上や共有スペースに放置することは、第三者の目に触れる漏洩リスクを高めるため、不使用時は速やかに鍵付き書庫などの指定場所に保管するのが原則です。"
      },
      {
        id: "q-1-5",
        type: "choice",
        questionText: "スマートフォンの業務連絡用チャットツールで、誤って別の利用者の写真を他職員グループに誤送信してしまった場合の対応として、誤っているものはどれか。",
        choices: [
          "1. 誤送信に気づいた時点で、速やかに当該メッセージや写真を削除（送信取り消し）する",
          "2. グループの他メンバーに対し、誤送信である旨の謝罪と説明のメッセージを送る",
          "3. 発生した事象（いつ、誰に、何を誤送信したか）を直ちに管理者に報告する",
          "4. 送信ミスを他職員に知られたくないため、何事もなかったようにそのまま放置する"
        ],
        correctAnswer: "4. 送信ミスを他職員に知られたくないため、何事もなかったようにそのまま放置する",
        explanation: "セキュリティインシデント（誤送信）を放置することは被害を拡大させる危険があるため厳禁です。速やかにメッセージを削除・取り消し、関係者へ連絡のうえ、管理者に報告して指示を仰ぐのが正しい手順です。"
      }
    ],
    createdAt: new Date("2026-06-16T10:00:00.000Z").toISOString()
  },
  {
    id: "seed-2",
    officeName: "ヘルパーステーション桃の郷 京都東山",
    trainingDate: "2026-07-10",
    trainingTimeStart: "18:00",
    trainingTimeEnd: "19:00",
    location: "ヘルパーステーション桃の郷 事務所にて",
    lecturer: "鈴木 花子（看護師・研修担当）",
    reportDate: "2026-07-11",
    reporter: "鈴木 花子",
    attendees: "山田 太郎、佐藤 二郎、高橋 三郎、渡辺 四郎、伊藤 五郎、中村 六子",
    attendeesCount: 6,
    nonAttendees: "なし",
    nonAttendeesCount: 0,
    followUpRecord: "全員出席のため、補講対象者なし。",
    theme: "感染症対策・衛生管理研修（コロナ・インフルエンザ流行期対策）",
    materials: "厚生労働省「介護現場における感染対策マニュアル」、標準予防策（スタンダード・プリコーション）チェックリスト、手洗いチェッカー教材",
    summary: {
      content: "・インフルエンザや新型コロナウイルス等の呼吸器感染症、およびノロウイルス等による食中毒の予防策の再点検\n・手指衛生を実施する「5つのタイミング」の遵守状況、およびサージカルマスクの正しい装着・廃棄方法の指導\n・ガウンや手袋などのPPE（個人防護具）の適切な着脱手順のデモンストレーションと実習\n・送迎車両や共有備品（手すり、テーブル、ドアノブ等）の消毒ポイントの明確化と実施ルールの策定",
      learned: "「すべてのケア対象者の血液・体液・分泌物等は感染の可能性がある」というスタンダード・プリコーションの原則を徹底的に再認識した。特に、嘔吐物の正しい処理手順（次亜塩素酸ナトリウムの適切な濃度調整、風上からの拭き取り）の実演により、誤った手順が空気感染・飛沫感染の広がりを引き起こすリスクに気づくことができた。",
      challenges: "送迎時間帯や混雑時におけるアルコール手指消毒の形骸化（ワンプッシュに満たない少量での揉み込み等）が課題として指摘された。\n【主な質疑応答】\nQ: ノロウイルスを疑う利用者の嘔吐物処理の際、消毒用のアルコールは有効か？\nA: アルコールはノロウイルスに対して効果が薄いため、次亜塩素酸ナトリウム（約0.1% = 1000ppm）または環境に適合した次亜塩素酸水を用いるのが正しい手順です。"
    },
    quizQuestions: [
      {
        id: "q-2-1",
        type: "boolean",
        questionText: "手袋を着用していれば、おむつ交換を終えた直後であっても、手を洗わずにそのまま次の利用者の食事介助に入ってよい。",
        correctAnswer: "×",
        explanation: "手袋を着用していても、おむつ交換後の手袋の取り外し時に手袋表面の汚染物質が手に付着する危険があるため、おむつ交換後は直ちに手袋を破棄し、十分な流水と石鹸（またはアルコール）による手指衛生が必須です。"
      },
      {
        id: "q-2-2",
        type: "boolean",
        questionText: "ノロウイルスによる嘔吐物の処理時に使用する次亜塩素酸ナトリウム液の適切な濃度は、通常約0.1%（1000ppm）である。",
        correctAnswer: "〇",
        explanation: "ノロウイルスなどの強いウイルスにはアルコールが効きにくく、塩素系消毒薬である次亜塩素酸ナトリウム液（約0.1%濃度）で処理するのが標準的です。"
      },
      {
        id: "q-2-3",
        type: "choice",
        questionText: "ケアに入る前後に実施する「手指衛生」におけるアルコール擦式手指消毒剤の使用方法として、最も適切なものはどれか。",
        choices: [
          "1. 手がベタつくのを防ぐため、半プッシュ程度の少量で素早く両手を擦り合わせる",
          "2. アルコールを手に吹きかけた後、すぐにペーパータオルで拭き取る",
          "3. ポンプをしっかり下まで押し切って適量（約3ml）を手に取り、手の甲、指先、指の間、親指、手首まで15秒以上かけて擦り込む",
          "4. 目に見える汚れがある場合も、手洗いはせずアルコール消毒だけで済ませる"
        ],
        correctAnswer: "3. ポンプをしっかり下まで押し切って適量（約3ml）を手に取り、手の甲、指先、指の間、親指、手首まで15秒以上かけて擦り込む",
        explanation: "アルコール消毒の効果を十分に発揮させるためには、十分な量（通常ワンプッシュ、約3ml）を手に取り、乾燥するまで指先や親指、手首まで入念に擦り込む必要があります。また、目に見える汚れがある場合は流水と石鹸による手洗いが優先されます。"
      },
      {
        id: "q-2-4",
        type: "boolean",
        questionText: "使い捨てのサージカルマスクを外す際は、マスクの外側（前面）には触れず、耳掛けのゴム紐を持って外して廃棄するのが正しい手順である。",
        correctAnswer: "〇",
        explanation: "マスクの外側（前面）はウイルスや細菌などの汚染物質が付着している可能性が極めて高いため、直接手で触れないよう耳掛けゴムを持って外し、直ちにゴミ箱に廃棄して、その後に必ず手指衛生を行います。"
      },
      {
        id: "q-2-5",
        type: "choice",
        questionText: "標準予防策（スタンダード・プリコーション）の説明として、最も適切なものはどれか。",
        choices: [
          "1. 感染症の診断の有無にかかわらず、すべての利用者の血液、体液、分泌物、排泄物、傷のある皮膚、粘膜を「感染の危険性があるもの」として取り扱う予防策",
          "2. 感染症の診断がついている特定の利用者に対してのみ、ガウンや手袋を着用して対応する予防策",
          "3. 施設内や事業所内で感染者が発生した後に、初めて開始する緊急的な感染予防策",
          "4. インフルエンザや新型コロナウイルスなどの呼吸器感染症にのみ適用される特別なケア手順"
        ],
        correctAnswer: "1. 感染症の診断の有無にかかわらず、すべての利用者の血液、体液、分泌物、排泄物、傷のある皮膚、粘膜を「感染の危険性があるもの」として取り扱う予防策",
        explanation: "スタンダード・プリコーション（標準予防策）は、すべての利用者を対象に、感染症診断の有無を問わず、湿性生体物質（血液・体液・分泌物・排泄物など）をすべて感染源とみなして安全に取り扱うための最も基本かつ重要な予防策です。"
      }
    ],
    createdAt: new Date("2026-07-11T09:00:00.000Z").toISOString()
  }
];

// Helper to read database
function getReports(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading database file, using seed/fallback data:", error);
  }
  // Return seeds if no file exists
  return SEED_REPORTS;
}

// Helper to write database
function saveReports(reports: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to database file:", error);
  }
}

// Initialize file if not existing, or upgrade existing file to include 5 quiz questions and bullet points for seeds
if (!fs.existsSync(DATA_FILE)) {
  saveReports(SEED_REPORTS);
} else {
  try {
    const existingContent = fs.readFileSync(DATA_FILE, "utf-8");
    const existingReports = JSON.parse(existingContent);
    const s1 = existingReports.find((r: any) => r.id === "seed-1");
    const s2 = existingReports.find((r: any) => r.id === "seed-2");
    
    // Check if upgrade is needed (less than 5 questions or missing seed)
    if (!s1 || !s2 || !s1.quizQuestions || s1.quizQuestions.length < 5 || !s2.quizQuestions || s2.quizQuestions.length < 5) {
      console.log("Upgrading database file to include updated seed reports with 5 questions...");
      const updatedReports = existingReports.map((report: any) => {
        const seedMatch = SEED_REPORTS.find(seed => seed.id === report.id);
        if (seedMatch) {
          return {
            ...report,
            summary: seedMatch.summary, // Ensures bullets are updated too
            quizQuestions: seedMatch.quizQuestions
          };
        }
        return report;
      });
      
      // Ensure missing seeds are appended
      SEED_REPORTS.forEach(seed => {
        if (!updatedReports.some((r: any) => r.id === seed.id)) {
          updatedReports.push(seed);
        }
      });
      
      saveReports(updatedReports);
    }
  } catch (err) {
    console.error("Error upgrading database file, resetting with seed reports:", err);
    saveReports(SEED_REPORTS);
  }
}

// Helper to lazy-initialize Gemini
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please set up the secret in AI Studio Settings.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API: Get all reports
app.get("/api/reports", (req, res) => {
  try {
    const reports = getReports();
    res.json({ success: true, reports });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Save or update report
app.post("/api/reports", (req, res) => {
  try {
    const report = req.body;
    if (!report.id) {
      report.id = "report-" + Date.now();
    }
    if (!report.createdAt) {
      report.createdAt = new Date().toISOString();
    }

    const reports = getReports();
    const existingIndex = reports.findIndex((r) => r.id === report.id);

    if (existingIndex >= 0) {
      reports[existingIndex] = report;
    } else {
      reports.push(report);
    }

    saveReports(reports);
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Delete report
app.delete("/api/reports/:id", (req, res) => {
  try {
    const { id } = req.params;
    let reports = getReports();
    reports = reports.filter((r) => r.id !== id);
    saveReports(reports);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Summarize Audio or Text and Generate quiz
app.post("/api/summarize", async (req, res) => {
  try {
    const { audioData, mimeType, textData, theme, officeName } = req.body;

    if (!audioData && !textData) {
      return res.status(400).json({ success: false, error: "音声データまたはテキスト情報の少なくとも一方が必要です。" });
    }

    const ai = getGeminiClient();

    // Prepare multi-modal inputs for Gemini
    const contents: any[] = [];

    // Add audio inlineData if provided
    if (audioData) {
      // Remove possible data:audio/mp3;base64, header prefix if sent
      const base64Data = audioData.includes("base64,") ? audioData.split("base64,")[1] : audioData;
      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType || "audio/mp3",
        },
      });
    }

    // Prepare robust prompt for summarizing and generating Japanese audit-ready minutes & tests
    const systemInstruction = `
あなたは訪問介護事業所および高齢者介護施設の「管理者」または「指導主事」です。
行政監査（実地指導・運営指導）に完全に耐えうる、客観的で完璧な法定研修報告書および講習会議事録を作成するのが任務です。
介護保険法等の基準に準拠し、客観的な事実、専門用語、および実践的な指導内容を網羅した文章を日本語で作成してください。

【出力品質要件】
1. 研修内容 (content):
   - 行政監査に完璧に耐えうる客観的・専門的かつ具体的な要約。
   - 【最重要】必ず「・」から始まる短い文を改行で区切った【箇条書き形式】で出力してください。だらだらとした長い接続詞や複数行にわたる段落は避け、一目で要点が伝わるようにしてください。
   - 各箇条書きの文末は、「〜を指導」「〜について解説」「〜の重要性を再確認」などの簡潔な表現（体言止め・名詞止め、または簡潔なである調）を使用してください。
   - 誰が、何を、どのように説明したか、どの介護ガイドラインや法律を根拠にしているかを明確に反映すること。

2. 研修を通して学んだこと、気づいたこと (learned):
   - 研修参加者（ヘルパーやスタッフ）の視点から、どのような学び、意識改革、日常業務への気づきが得られたかを要約。
   - 単なる「勉強になった」ではなく、「〜の危険性に気づいた」「〜の配慮が必要だと実感した」といった具体的な行動・思考の変化。

3. 事業所内での課題・質疑応答 (challenges):
   - 事業所における日常的な運用課題や、研修を機に見えてきた弱点、今後の具体的な改善プランを記載。
   - 想定または実際に挙がった「質疑応答（Q&A形式、質問Qと回答Aを明確に分ける）」を必ず記述すること。

4. 理解度テスト (quiz):
   - 研修内容を正しく理解できているかを確認するための「〇×クイズ」または「選択肢問題（3〜4択）」を、3〜5問作成すること。
   - 各問題には、問題文（questionText）、形式（type）、正解（correctAnswer）、そして何より【解説 (explanation)】を非常に詳しく作成すること。
   - 正解は、〇×問題なら「〇」か「×」、多肢選択なら「1. 〜」などの完全な選択肢文字列を代入してください。
`;

    const userPrompt = `
以下の情報（インプット）に基づいて、法定研修の報告内容（①研修内容、②学んだこと・気づいたこと、③課題と質疑応答）の要約文と、受講者の理解度を確認するためのテスト問題（3〜5問、回答と詳細解説付き）を生成してください。

【研修の基本情報】
・研修テーマ/議題: ${theme || "未定"}
・事業所名: ${officeName || "ヘルパーステーション桃の郷 京都東山"}

【提供されたインプット資料】
${textData ? `【テキスト・教材資料 (コピー＆ペースト内容)】:\n${textData}\n` : ""}
${audioData ? `【研修音声/録音】: 音声ファイルが添付されています。音声の内容をテキストとして解析・統合し、対話内容や講義内容を要約に含めてください。\n` : ""}

これらを完全に統合し、①研修内容は【必ず「・」で始まる箇条書き（改行区切り）】に整形した上で、指定のJSONスキーマに従って出力してください。
`;

    contents.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: {
              type: Type.STRING,
              description: "研修内容の詳細な要約。必ず「・」で始まる簡潔な箇条書き（各項目は改行で区切る）形式で作成してください。監査対応用、客観的で専門的かつ直感的な見やすさを最優先。"
            },
            learned: {
              type: Type.STRING,
              description: "研修を通して学んだこと、気づいたことの要約（スタッフ目線、業務改善に直結する内容）。"
            },
            challenges: {
              type: Type.STRING,
              description: "事業所内での課題・質疑応答（Q:質問、A:回答の形式を含めて具体的に記述）。"
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    enum: ["boolean", "choice"],
                    description: "問題タイプ（boolean: 〇×、choice: 多肢選択）"
                  },
                  questionText: {
                    type: Type.STRING,
                    description: "問題の本文。研修の重要なコア知識を問う内容。"
                  },
                  choices: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "多肢選択肢。typeが'choice'の場合に必須（3〜4つ、例: '1. 〜', '2. 〜' などのプレフィックス付き）。booleanの場合は省略して可。"
                  },
                  correctAnswer: {
                    type: Type.STRING,
                    description: "正解。booleanなら '〇' または '×'。choiceなら正解 of 選択肢文字列そのもの。"
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "なぜそれが正解なのか、根拠となる法律やガイドライン、介護基準に言及した懇切丁寧な解説。"
                  }
                },
                required: ["type", "questionText", "correctAnswer", "explanation"]
              },
              description: "研修の理解を確認するための理解度テスト（3〜5問）"
            }
          },
          required: ["content", "learned", "challenges", "quiz"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini API から要約結果を生成できませんでした。");
    }

    const summaryResult = JSON.parse(resultText.trim());

    res.json({
      success: true,
      summary: {
        content: summaryResult.content,
        learned: summaryResult.learned,
        challenges: summaryResult.challenges,
      },
      quizQuestions: summaryResult.quiz.map((q: any, i: number) => ({
        id: `gen-${Date.now()}-${i}`,
        ...q
      }))
    });

  } catch (err: any) {
    console.error("Gemini summarizing error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Configure Vite or Serve Static build
const isProd = process.env.NODE_ENV === "production";
if (!isProd) {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development full-stack server running on http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production full-stack server running on port ${PORT}`);
  });
}

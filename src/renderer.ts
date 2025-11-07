// 時刻フォーマットの種類
type DateFormat = "slash" | "japanese" | "iso";

// 現在選択されているフォーマット(変数で切り替え可能)
let currentFormat: DateFormat = "slash";

// 前回の tick の秒数（Unix秒）を保存する変数
let lastTickSeconds: number | null = null;

// 前回表示した日付部分を保存（日付が変わった時のみDOM更新するため）
let lastDatePart: string | null = null;

// DOM要素のキャッシュ（初回のみ取得）
let clockDateElement: HTMLElement | null = null;
let clockTimeElement: HTMLElement | null = null;

// タイムゾーンオフセット文字列のキャッシュ（ISO形式用）
let cachedTimezoneOffset: string = "";

/**
 * 数値を2桁の文字列に変換するヘルパー関数
 * @param num 変換する数値
 * @returns 2桁の文字列（例: 1 -> "01", 12 -> "12"）
 */
function pad2(num: number): string {
  return num < 10 ? `0${num}` : String(num);
}

/**
 * タイムゾーンオフセット文字列を初期化
 */
function initTimezoneOffset(): void {
  const date = new Date();
  const offset = -date.getTimezoneOffset();
  const offsetHours = pad2(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad2(Math.abs(offset) % 60);
  const offsetSign = offset >= 0 ? "+" : "-";
  cachedTimezoneOffset = `${offsetSign}${offsetHours}:${offsetMinutes}`;
}

/**
 * 日付を指定されたフォーマットで文字列に変換
 * @param date 変換する日付
 * @param format フォーマット種類
 * @returns フォーマット済み文字列
 */
function formatDate(date: Date, format: DateFormat): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());

  switch (format) {
    case "slash":
      // 2025/09/10 15:17:25
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

    case "japanese":
      // 2025年09月10日 15時17分25秒
      return `${year}年${month}月${day}日 ${hours}時${minutes}分${seconds}秒`;

    case "iso":
      // 2025-09-10T15:17:25+09:00
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${cachedTimezoneOffset}`;

    default:
      return date.toLocaleString();
  }
}

/**
 * フォーマット済み文字列を日付部分と時刻部分に分割
 * @param formatted フォーマット済み文字列
 * @param format フォーマット種類
 * @returns [日付部分, 時刻部分]
 */
function splitDateTime(
  formatted: string,
  format: DateFormat
): [string, string] {
  switch (format) {
    case "slash":
    case "japanese":
      // 2025/09/10 15:17:25 -> 日付と時刻で分割
      // 2025年09月10日 15時17分25秒 -> 日付と時刻で分割
      const [datePart, timePart] = formatted.split(" ");
      return [datePart, timePart];

    case "iso":
      // 2025-09-10T15:17:25+09:00
      return ["", formatted];

    default:
      // 網羅性チェック: 新しいフォーマットが追加されたらコンパイルエラー
      throw new Error(`Unhandled case: ${format}`);
  }
}

/**
 * UIのクロック表示を更新
 * @param date 表示する日付・時刻
 */
function updateClock(date: Date): void {
  // DOM要素を初回のみ取得してキャッシュ
  if (!clockDateElement || !clockTimeElement) {
    clockDateElement = document.getElementById("clock-date");
    clockTimeElement = document.getElementById("clock-time");

    if (!clockDateElement || !clockTimeElement) {
      console.error("Clock elements not found");
      return;
    }
  }

  const formatted = formatDate(date, currentFormat);
  const [datePart, timePart] = splitDateTime(formatted, currentFormat);

  // 日付部分は変わった時のみ更新（1日に1回のみ）
  if (lastDatePart !== datePart) {
    clockDateElement.textContent = datePart;
    lastDatePart = datePart;
  }

  // 時刻部分は毎回更新
  clockTimeElement.textContent = timePart;
}

/**
 * 次の秒境界まで待機してからtickを実行する
 */
function scheduleTick(): void {
  const nowTimeStamp = Date.now();
  const delay = 1000 - (nowTimeStamp % 1000); // 次の秒境界までの遅延msを計算
  // console.log(`Scheduling next tick in ${delay} ms`);
  setTimeout(tick, delay);
}

/**
 * 時計の更新処理
 */
function tick(): void {
  // 現在timeStampと秒数を取得
  const nowTimeStamp = Date.now();
  const nowSeconds = Math.floor(nowTimeStamp / 1000);

  // 前回のtickと秒が変わっていなければ何もしない
  if (lastTickSeconds !== null && lastTickSeconds === nowSeconds) {
    // console.log("Tick called but second unchanged, skipping update.");
    scheduleTick();
    return;
  }
  lastTickSeconds = nowSeconds;

  // UIを更新
  const now = new Date(nowTimeStamp);
  updateClock(now);
  // console.log(`Updated clock: ${formatDate(now, currentFormat)}`);

  scheduleTick();
}

// 初期化処理
initTimezoneOffset();
scheduleTick();

// 閉じるボタンのイベントリスナーを追加
const closeButton = document.getElementById("close-button");
if (closeButton) {
  closeButton.addEventListener("click", () => {
    (window as any).appAPI.closeApp();
  });
}

// 最小化ボタン
const minimizeButton = document.getElementById("minimize-button");
if (minimizeButton) {
  minimizeButton.addEventListener("click", () => {
    (window as any).appAPI.minimize();
  });
}

// 最大化ボタン（最大化されていれば最大化解除）
const maximizeButton = document.getElementById("toggle-maximize-button");
if (maximizeButton) {
  maximizeButton.addEventListener("click", async () => {
    try {
      const res = await (window as any).appAPI.toggleMaximize();
      if (res && typeof res.maximized !== "undefined") {
        // 状態をボタンに反映（アクセシビリティ用途）
        maximizeButton.setAttribute("aria-pressed", String(res.maximized));
      }
    } catch (e) {
      console.error("Failed to maximize/unmaximize:", e);
    }
  });
}

// フルスクリーン切替ボタン
const fullscreenButton = document.getElementById("toggle-fullscreen-button");
if (fullscreenButton) {
  fullscreenButton.addEventListener("click", async () => {
    try {
      const res = await (window as any).appAPI.toggleFullScreen();
      if (res && typeof res.isFullScreen !== "undefined") {
        fullscreenButton.setAttribute("aria-pressed", String(res.isFullScreen));
      }
    } catch (e) {
      console.error("Failed to toggle full screen:", e);
    }
  });
}

// フルスクリーン状態の変更を監視してボタンの表示/非表示を切り替え
(window as any).appAPI.onFullScreenChange((isFullScreen: boolean) => {
  // フルスクリーン時は最小化、最大化、閉じるボタンを非表示
  const minimizeBtn = document.getElementById("minimize-button");
  const maximizeBtn = document.getElementById("toggle-maximize-button");
  const closeBtn = document.getElementById("close-button");

  if (isFullScreen) {
    minimizeBtn?.classList.add("hidden");
    maximizeBtn?.classList.add("hidden");
    closeBtn?.classList.add("hidden");
  } else {
    minimizeBtn?.classList.remove("hidden");
    maximizeBtn?.classList.remove("hidden");
    closeBtn?.classList.remove("hidden");
  }
});

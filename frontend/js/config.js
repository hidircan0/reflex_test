export const MIN_WAIT_MS = 2000;
export const MAX_WAIT_MS = 6000;
export const LAMP_COUNT = 5;
export const LIGHT_INTERVAL_MS = 750;
export const NICKNAME_KEY = "refleks.nickname";
export const NICKNAME_MAX = 24;

export const GameState = Object.freeze({
  IDLE: "idle",
  LIGHTING: "lighting",
  ARMED: "armed",
  GO: "go",
  RESULT: "result",
  FALSE_START: "false_start",
});

export const STATUS_TEXT = Object.freeze({
  idle: "Hazır olduğunda Başla'ya bas.",
  lighting: "Kırmızılar yükseliyor. Yeşili bekle…",
  armed: "Kırmızı yandı. Yeşili bekle…",
  go: "YEŞİL! Şimdi tetikle.",
  false_start: "Hatalı Çıkış! Çok erken bastınız",
});

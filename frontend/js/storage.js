import { NICKNAME_KEY } from "./config.js";

export function loadNickname() {
  try {
    return normalizeNickname(localStorage.getItem(NICKNAME_KEY) ?? "");
  } catch {
    return "";
  }
}

export function saveNickname(value) {
  const nickname = normalizeNickname(value);
  try {
    if (nickname) {
      localStorage.setItem(NICKNAME_KEY, nickname);
    } else {
      localStorage.removeItem(NICKNAME_KEY);
    }
  } catch {
    // Private mode can block storage; the in-memory value still works this session.
  }
  return nickname;
}

export function normalizeNickname(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export function isValidNickname(value) {
  const nickname = normalizeNickname(value);
  return (
    nickname.length >= 2 &&
    nickname.length <= 24 &&
    /^[A-Za-z0-9ÇĞİÖŞÜçğıöşü_-]+(?: [A-Za-z0-9ÇĞİÖŞÜçğıöşü_-]+)*$/.test(
      nickname,
    )
  );
}

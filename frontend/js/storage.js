import { NICKNAME_KEY } from "./config.js";

export function loadNickname() {
  try {
    return (localStorage.getItem(NICKNAME_KEY) ?? "").trim();
  } catch {
    return "";
  }
}

export function saveNickname(value) {
  const nickname = value.trim();
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

export function isValidNickname(value) {
  const nickname = value.trim();
  return /^[A-Za-z0-9ÇĞİÖŞÜçğıöşü_-]{2,24}$/.test(nickname);
}

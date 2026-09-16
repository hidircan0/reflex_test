import { GameState, LAMP_COUNT, NICKNAME_MAX, STATUS_TEXT } from "./config.js";

export class ReflexView {
  constructor(root) {
    this._lights = root.querySelector("#lights");
    this._readout = root.querySelector(".readout");
    this._status = root.querySelector("#status");
    this._result = root.querySelector("#result");
    this._startBtn = root.querySelector("#start-btn");
    this._triggerBtn = root.querySelector("#trigger-btn");
    this._nickname = root.querySelector("#nickname");
    this._buildLamps();
    this._nickname.maxLength = NICKNAME_MAX;
  }

  bind({ onStart, onTrigger, onNickname }) {
    this._startBtn.addEventListener("click", onStart);
    this._triggerBtn.addEventListener("click", onTrigger);
    this._nickname.addEventListener("input", () => {
      onNickname(this._nickname.value);
    });

    window.addEventListener("keydown", (event) => {
      if (event.target === this._nickname) {
        if (event.code === "Enter") {
          event.preventDefault();
          this._nickname.blur();
        }
        return;
      }
      if (event.repeat) {
        return;
      }
      if (event.code === "Space") {
        // Space is the trigger shortcut; block the browser's scroll default.
        event.preventDefault();
        onTrigger();
        return;
      }
      if (event.code === "Enter") {
        event.preventDefault();
        onStart();
      }
    });
  }

  setNickname(value) {
    this._nickname.value = value;
  }

  render({ state, reactionMs, litCount }, { canStart }) {
    this._lights.dataset.state = state;
    this._readout.dataset.state = state;
    this._startBtn.disabled =
      !canStart ||
      state === GameState.LIGHTING ||
      state === GameState.ARMED ||
      state === GameState.GO;

    this._columns.forEach((column, index) => {
      column.classList.toggle("is-lit", index < litCount);
    });

    if (state === GameState.RESULT) {
      this._status.textContent = "";
      this._result.hidden = false;
      this._result.textContent = `Tepki süreniz: ${reactionMs} ms`;
      return;
    }

    this._result.hidden = true;
    this._result.textContent = "";
    this._status.textContent = canStart
      ? STATUS_TEXT[state]
      : "Başlamak için bir takma ad yaz.";
  }

  _buildLamps() {
    const fragment = document.createDocumentFragment();
    this._columns = [];
    for (let i = 0; i < LAMP_COUNT; i += 1) {
      const column = document.createElement("div");
      column.className = "lamp-column";
      column.innerHTML = '<span class="lamp"></span><span class="lamp"></span>';
      this._columns.push(column);
      fragment.appendChild(column);
    }
    this._lights.appendChild(fragment);
  }
}

import {
  GameState,
  LAMP_COUNT,
  LIGHT_INTERVAL_MS,
  MAX_WAIT_MS,
  MIN_WAIT_MS,
} from "./config.js";

/**
 * Reflex test state machine. Timing uses an injectable clock so the
 * reaction measurement is independent of UI rendering delay.
 */
export class ReflexGame {
  constructor({
    minWaitMs = MIN_WAIT_MS,
    maxWaitMs = MAX_WAIT_MS,
    lampCount = LAMP_COUNT,
    lightIntervalMs = LIGHT_INTERVAL_MS,
    now = () => performance.now(),
    random = Math.random,
    schedule = (fn, ms) => setTimeout(fn, ms),
    cancel = (id) => clearTimeout(id),
  } = {}) {
    this._minWaitMs = minWaitMs;
    this._maxWaitMs = maxWaitMs;
    this._lampCount = lampCount;
    this._lightIntervalMs = lightIntervalMs;
    this._now = now;
    this._random = random;
    this._schedule = schedule;
    this._cancel = cancel;
    this._listeners = new Set();
    this._timerId = null;
    this.state = GameState.IDLE;
    this.reactionMs = null;
    this.litCount = 0;
    this._greenAt = null;
  }

  onChange(listener) {
    this._listeners.add(listener);
    listener(this.snapshot());
    return () => this._listeners.delete(listener);
  }

  snapshot() {
    return {
      state: this.state,
      reactionMs: this.reactionMs,
      litCount: this.litCount,
    };
  }

  start() {
    if (
      this.state === GameState.LIGHTING ||
      this.state === GameState.ARMED ||
      this.state === GameState.GO
    ) {
      return;
    }

    this._clearTimer();
    this.reactionMs = null;
    this._greenAt = null;
    this.litCount = 1;
    this.state = GameState.LIGHTING;
    this._emit();
    this._timerId = this._schedule(
      () => this._advanceLights(),
      this._lightIntervalMs,
    );
  }

  trigger() {
    if (this.state === GameState.LIGHTING || this.state === GameState.ARMED) {
      // Drop the pending green timeout; otherwise a late tick would still score.
      this._clearTimer();
      this.state = GameState.FALSE_START;
      this.reactionMs = null;
      this._emit();
      return;
    }

    if (this.state === GameState.GO) {
      this.reactionMs = Math.max(0, Math.round(this._now() - this._greenAt));
      this.state = GameState.RESULT;
      this._emit();
    }
  }

  _advanceLights() {
    this._timerId = null;
    if (this.state !== GameState.LIGHTING) {
      return;
    }

    if (this.litCount < this._lampCount) {
      this.litCount += 1;
      this._emit();
      this._timerId = this._schedule(
        () => this._advanceLights(),
        this._lightIntervalMs,
      );
      return;
    }

    this.litCount = this._lampCount;
    this.state = GameState.ARMED;
    this._emit();
    const span = this._maxWaitMs - this._minWaitMs;
    const delay = this._minWaitMs + this._random() * span;
    this._timerId = this._schedule(() => this._turnGreen(), delay);
  }

  _turnGreen() {
    this._timerId = null;
    if (this.state !== GameState.ARMED) {
      return;
    }

    this._greenAt = this._now();
    this.state = GameState.GO;
    this._emit();
  }

  _clearTimer() {
    if (this._timerId != null) {
      this._cancel(this._timerId);
      this._timerId = null;
    }
  }

  _emit() {
    const snap = this.snapshot();
    for (const listener of this._listeners) {
      listener(snap);
    }
  }
}

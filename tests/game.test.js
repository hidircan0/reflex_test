import { GameState } from "../frontend/js/config.js";
import { ReflexGame } from "../frontend/js/game.js";

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function createHarness() {
  const timers = [];
  let nextId = 0;
  let clock = 0;
  const game = new ReflexGame({
    minWaitMs: 5,
    maxWaitMs: 5,
    lampCount: 5,
    lightIntervalMs: 10,
    now: () => clock,
    random: () => 0,
    schedule: (fn) => {
      const id = nextId;
      nextId += 1;
      timers[id] = fn;
      return id;
    },
    cancel: (id) => {
      timers[id] = null;
    },
  });
  return {
    game,
    flush() {
      const fn = timers.find((item) => typeof item === "function");
      const id = timers.indexOf(fn);
      if (fn == null) {
        throw new Error("no timer to flush");
      }
      timers[id] = null;
      fn();
    },
    setClock(value) {
      clock = value;
    },
  };
}

const early = createHarness();
early.game.start();
assertEqual(early.game.state, GameState.LIGHTING, "start begins lighting");
assertEqual(early.game.litCount, 1, "first column lights immediately");
early.game.trigger();
assertEqual(early.game.state, GameState.FALSE_START, "early trigger during lighting");

const rising = createHarness();
rising.game.start();
rising.flush();
rising.flush();
rising.flush();
rising.flush();
rising.flush();
assertEqual(rising.game.litCount, 5, "all columns lit");
assertEqual(rising.game.state, GameState.ARMED, "wait for green after the rise");
rising.game.trigger();
assertEqual(rising.game.state, GameState.FALSE_START, "early trigger while armed");

const fair = createHarness();
fair.game.start();
for (let i = 0; i < 6; i += 1) {
  fair.flush();
}
assertEqual(fair.game.state, GameState.GO, "green after the wait");
fair.setClock(245);
fair.game.trigger();
assertEqual(fair.game.state, GameState.RESULT, "trigger stops the clock");
assertEqual(fair.game.reactionMs, 245, "reaction is rounded milliseconds");

console.log("game tests passed");

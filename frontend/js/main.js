import { GameState } from "./config.js";
import { ReflexGame } from "./game.js";
import { ReflexView } from "./ui.js";
import { NicknameExistsError, ScoreApi } from "./api.js";
import { ScoreUpdateDialog } from "./score-dialog.js";
import { ScoreboardView } from "./scoreboard.js";
import { isValidNickname, loadNickname, saveNickname } from "./storage.js";

const game = new ReflexGame();
const view = new ReflexView(document);
const scoreboard = new ScoreboardView(document);
const scoreDialog = new ScoreUpdateDialog(document);
const api = new ScoreApi();

let nickname = loadNickname();
let lastSnapshot = game.snapshot();

view.setNickname(nickname);
view.bind({
  onStart: () => {
    if (!isValidNickname(nickname)) {
      view.render(lastSnapshot, { canStart: false });
      return;
    }
    game.start();
  },
  onTrigger: () => game.trigger(),
  onNickname: (value) => {
    nickname = saveNickname(value);
    view.render(lastSnapshot, { canStart: isValidNickname(nickname) });
  },
});

game.onChange((snapshot) => {
  lastSnapshot = snapshot;
  view.render(snapshot, { canStart: isValidNickname(nickname) });
  if (snapshot.state === GameState.RESULT) {
    submitScore(snapshot.reactionMs);
  }
});

async function refreshScoreboard() {
  try {
    const scores = await api.list();
    scoreboard.render(scores, nickname);
  } catch {
    scoreboard.showError();
  }
}

async function submitScore(reactionMs) {
  if (!isValidNickname(nickname)) {
    return;
  }
  try {
    await api.submit(nickname, reactionMs);
    await refreshScoreboard();
  } catch (error) {
    if (error instanceof NicknameExistsError) {
      const shouldUpdate = await scoreDialog.confirm({
        nickname: error.existingScore.nickname,
        currentMs: error.existingScore.reaction_ms,
        newMs: reactionMs,
      });
      if (shouldUpdate) {
        try {
          await api.update(nickname, reactionMs);
          await refreshScoreboard();
        } catch {
          scoreboard.showError();
        }
      }
      return;
    }
    scoreboard.showError();
  }
}

refreshScoreboard();

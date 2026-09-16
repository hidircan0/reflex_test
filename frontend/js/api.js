export class NicknameExistsError extends Error {
  constructor(existingScore) {
    super("nickname already exists");
    this.name = "NicknameExistsError";
    this.existingScore = existingScore;
  }
}

export class ScoreApi {
  constructor(baseUrl = "/api") {
    this._baseUrl = baseUrl;
  }

  async list() {
    const response = await fetch(`${this._baseUrl}/scores`);
    if (!response.ok) {
      throw new Error("scoreboard fetch failed");
    }
    return response.json();
  }

  async submit(nickname, reactionMs) {
    const response = await fetch(`${this._baseUrl}/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, reaction_ms: reactionMs }),
    });
    if (response.status === 409) {
      const payload = await response.json();
      if (payload.detail?.code === "nickname_exists") {
        throw new NicknameExistsError(payload.detail.score);
      }
    }
    if (!response.ok) {
      throw new Error("score submit failed");
    }
    return response.json();
  }

  async update(nickname, reactionMs) {
    const response = await fetch(
      `${this._baseUrl}/scores/${encodeURIComponent(nickname)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction_ms: reactionMs }),
      },
    );
    if (!response.ok) {
      throw new Error("score update failed");
    }
    return response.json();
  }
}

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def ensure_unique_nicknames(connection: AsyncConnection) -> None:
    # Existing installations may contain repeated names. Keep each driver's
    # fastest result before enforcing the one-score-per-nickname rule.
    await connection.execute(
        text(
            """
            DELETE FROM scores AS duplicate
            USING scores AS keeper
            WHERE LOWER(duplicate.nickname) = LOWER(keeper.nickname)
              AND (
                duplicate.reaction_ms > keeper.reaction_ms
                OR (
                  duplicate.reaction_ms = keeper.reaction_ms
                  AND duplicate.id > keeper.id
                )
              )
            """
        )
    )
    await connection.execute(
        text(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS scores_nickname_lower_uidx
            ON scores (LOWER(nickname))
            """
        )
    )

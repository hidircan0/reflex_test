from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import Score
from app.schemas import ScoreCreate, ScoreRead, ScoreUpdate, normalize_nickname

router = APIRouter(prefix="/api/scores", tags=["scores"])


@router.get("", response_model=list[ScoreRead])
async def list_scores(
    session: AsyncSession = Depends(get_session),
) -> list[Score]:
    result = await session.execute(
        select(Score).order_by(Score.reaction_ms.asc(), Score.created_at.asc())
    )
    return list(result.scalars().all())


@router.post("", response_model=ScoreRead, status_code=201)
async def create_score(
    payload: ScoreCreate,
    session: AsyncSession = Depends(get_session),
) -> Score:
    score = Score(nickname=payload.nickname, reaction_ms=payload.reaction_ms)
    session.add(score)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        existing = await _find_score(session, payload.nickname)
        if existing is None:
            raise
        raise HTTPException(
            status_code=409,
            detail={
                "code": "nickname_exists",
                "score": ScoreRead.model_validate(existing).model_dump(mode="json"),
            },
        ) from exc
    await session.refresh(score)
    return score


@router.put("/{nickname}", response_model=ScoreRead)
async def update_score(
    nickname: str,
    payload: ScoreUpdate,
    session: AsyncSession = Depends(get_session),
) -> Score:
    try:
        normalized_nickname = normalize_nickname(nickname)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="invalid nickname") from exc

    score = await _find_score(session, normalized_nickname)
    if score is None:
        raise HTTPException(status_code=404, detail="score not found")

    score.reaction_ms = payload.reaction_ms
    score.created_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(score)
    return score


async def _find_score(session: AsyncSession, nickname: str) -> Score | None:
    result = await session.execute(
        select(Score).where(func.lower(Score.nickname) == nickname.lower())
    )
    return result.scalar_one_or_none()

"""
SMRITI+ — Health Worker API Router

GET /health-worker/{id}/group-stats — aggregated multi-elder view, scoped to assigned group
"""

import csv
import io
from uuid import UUID
from datetime import datetime, timezone, date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db
from app.db.models import User, ElderlyProfile, GameSession, Reminder, ReminderLog
from app.core.auth import get_current_user, CurrentUser, require_role
from app.api.schemas import HealthWorkerGroupStats, ElderSummary

router = APIRouter(tags=["Health Worker"])


@router.get("/health-worker/{worker_id}/group-stats", response_model=HealthWorkerGroupStats)
def get_group_stats(
    worker_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("health_worker")),
):
    """
    Aggregated stats for the health worker's assigned elder group.
    Server-enforced scoping — worker only sees their group.
    """
    if current_user.user_id != worker_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Find all elders in this worker's group
    profiles = db.query(ElderlyProfile).filter(
        ElderlyProfile.health_worker_group_id == worker_id,
    ).all()

    elder_summaries = []
    total_engagement = 0.0
    total_adherence = 0.0

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)

    for profile in profiles:
        elder = db.query(User).filter(User.id == profile.user_id).first()
        if not elder:
            continue

        # Engagement: sessions this week
        sessions = db.query(GameSession).filter(
            GameSession.elderly_id == elder.id,
            GameSession.created_at >= week_ago,
        ).all()

        engagement_score = len(sessions)

        # Adherence
        reminders = db.query(Reminder).filter(
            Reminder.elderly_id == elder.id,
            Reminder.is_active == True,
        ).all()

        total_slots = 0
        done = 0
        for r in reminders:
            logs = db.query(ReminderLog).filter(
                ReminderLog.reminder_id == r.id,
                ReminderLog.responded_at >= week_ago,
            ).all()
            expected = 7 if r.recurrence_rule == "daily" else 1
            total_slots += expected
            done += sum(1 for l in logs if l.status == "done")

        adherence_pct = (done / total_slots * 100) if total_slots > 0 else 0.0

        # Last active
        last_session = db.query(GameSession).filter(
            GameSession.elderly_id == elder.id,
        ).order_by(desc(GameSession.created_at)).first()

        # Streak
        streak = 0
        today = date.today()
        for i in range(60):
            check_date = today - timedelta(days=i)
            day_start = datetime.combine(check_date, datetime.min.time()).replace(tzinfo=timezone.utc)
            day_end = datetime.combine(check_date, datetime.max.time()).replace(tzinfo=timezone.utc)
            has = db.query(GameSession).filter(
                GameSession.elderly_id == elder.id,
                GameSession.created_at >= day_start,
                GameSession.created_at <= day_end,
            ).first()
            if has:
                streak += 1
            else:
                if i == 0:
                    continue
                break

        elder_summaries.append(ElderSummary(
            elder_id=elder.id,
            name=elder.name,
            engagement_score=engagement_score,
            adherence_pct=round(adherence_pct, 1),
            last_active=last_session.created_at if last_session else None,
            current_streak=streak,
        ))

        total_engagement += engagement_score
        total_adherence += adherence_pct

    n = len(elder_summaries)
    avg_engagement = total_engagement / n if n > 0 else 0.0
    avg_adherence = total_adherence / n if n > 0 else 0.0

    return HealthWorkerGroupStats(
        group_id=worker_id,
        total_elders=n,
        avg_engagement=round(avg_engagement, 1),
        avg_adherence=round(avg_adherence, 1),
        elders=elder_summaries,
    )


@router.get("/health-worker/{worker_id}/export-csv")
def export_group_csv(
    worker_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("health_worker")),
):
    """
    Export anonymized group cohort metrics in standard CSV format.
    Server-side RBAC: health worker can only export their authorized group.
    """
    if current_user.user_id != worker_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    stats = get_group_stats(worker_id=worker_id, db=db, current_user=current_user)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "elder_id",
        "name",
        "engagement_score_7d",
        "reminder_adherence_pct",
        "current_streak_days",
        "last_active_utc",
    ])

    for elder in stats.elders:
        writer.writerow([
            str(elder.elder_id),
            elder.name,
            elder.engagement_score,
            elder.adherence_pct,
            elder.current_streak,
            elder.last_active.isoformat() if elder.last_active else "N/A",
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=smriti_cohort_{worker_id}.csv"
        },
    )

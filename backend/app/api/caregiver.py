"""
SMRITI+ — Caregiver Dashboard API Router

GET /caregiver/{id}/dashboard — engagement stats, adherence, alerts, trends
"""

from uuid import UUID
from datetime import datetime, timezone, date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.db.database import get_db
from app.db.models import (
    User, ElderlyProfile, GameSession, Reminder, ReminderLog, DifficultyState, Game,
)
from app.core.auth import get_current_user, CurrentUser, require_role
from app.api.schemas import (
    CaregiverDashboardResponse, DashboardStats, DashboardTrendPoint,
    DashboardAlert, UserResponse, GameSessionResponse, ReminderResponse,
    CareStageUpdateRequest,
)
from app.ai.assistance_engine import AssistanceEngine, AssistanceInputMetrics

assistance_engine = AssistanceEngine()

router = APIRouter(tags=["Caregiver"])


@router.get("/caregiver/{caregiver_id}/dashboard", response_model=CaregiverDashboardResponse)
def get_caregiver_dashboard(
    caregiver_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("caregiver")),
):
    """
    Caregiver dashboard with computed stats, trends, and alerts.
    All values are derived from database state — never hardcoded.
    """
    # RBAC: caregiver can only see their own dashboard
    if current_user.user_id != caregiver_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Find linked elder(s) — for MVP, one caregiver : one elder is typical
    profiles = db.query(ElderlyProfile).filter(
        ElderlyProfile.caregiver_id == caregiver_id
    ).all()

    if not profiles:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No linked elders found")

    # Use first linked elder for dashboard (MVP)
    elder_profile = profiles[0]
    elder = db.query(User).filter(User.id == elder_profile.user_id).first()
    if not elder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elder not found")

    elder_id = elder.id

    # ── Stats ──
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)

    sessions_this_week = db.query(GameSession).filter(
        GameSession.elderly_id == elder_id,
        GameSession.created_at >= week_ago,
    ).all()

    engagement_count = len(sessions_this_week)

    # Reminder adherence
    reminders = db.query(Reminder).filter(
        Reminder.elderly_id == elder_id,
        Reminder.is_active == True,
    ).all()

    total_reminder_slots = 0
    done_count = 0
    missed_count = 0

    for r in reminders:
        # Check last 7 days of logs
        logs = db.query(ReminderLog).filter(
            ReminderLog.reminder_id == r.id,
            ReminderLog.responded_at >= week_ago,
        ).all()
        # For daily reminders, expect 7 opportunities
        expected = 7 if r.recurrence_rule == "daily" else 1
        total_reminder_slots += expected
        day_done = sum(1 for l in logs if l.status == "done")
        day_missed = sum(1 for l in logs if l.status == "missed")
        done_count += day_done
        missed_count += day_missed

    adherence_pct = (done_count / total_reminder_slots * 100) if total_reminder_slots > 0 else 0.0

    # Streak
    streak = _calculate_streak(db, elder_id)

    stats = DashboardStats(
        engagement_this_week=engagement_count,
        reminder_adherence_pct=round(adherence_pct, 1),
        missed_activities=missed_count,
        current_streak=streak,
    )

    # ── Trends (14 days) ──
    trends = []
    for i in range(14):
        check_date = date.today() - timedelta(days=13 - i)
        day_start = datetime.combine(check_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        day_end = datetime.combine(check_date, datetime.max.time()).replace(tzinfo=timezone.utc)

        day_sessions = db.query(GameSession).filter(
            GameSession.elderly_id == elder_id,
            GameSession.created_at >= day_start,
            GameSession.created_at <= day_end,
        ).all()

        avg_acc = None
        completion_rate = None
        if day_sessions:
            avg_acc = round(sum(s.accuracy for s in day_sessions) / len(day_sessions), 3)
            completion_rate = round(sum(1 for s in day_sessions if s.completed) / len(day_sessions), 3)

        trends.append(DashboardTrendPoint(
            date=check_date.isoformat(),
            accuracy=avg_acc,
            completion_rate=completion_rate,
            sessions_count=len(day_sessions),
        ))

    # ── Alerts (computed from real data) ──
    alerts = _compute_alerts(db, elder_id, sessions_this_week, missed_count, streak)

    # ── Recent sessions ──
    recent = db.query(GameSession).filter(
        GameSession.elderly_id == elder_id,
    ).order_by(desc(GameSession.created_at)).limit(10).all()

    # ── Reminders ──
    reminder_responses = [ReminderResponse.model_validate(r) for r in reminders]

    # ── Adaptive Assistance Recommendation (Non-Diagnostic) ──
    avg_accuracy = (sum(s.accuracy for s in recent[:5]) / len(recent[:5])) if recent else 0.85
    avg_response = int(sum(s.response_time_ms for s in recent[:5]) / len(recent[:5])) if recent else 10000
    consecutive_low = sum(1 for s in recent[:3] if s.accuracy < 0.5)

    rec_result = assistance_engine.evaluate(AssistanceInputMetrics(
        accuracy=avg_accuracy,
        response_time_ms=avg_response,
        target_time_ms=15000,
        attempts=1,
        consecutive_low_scores=consecutive_low,
        user_override_assistance=None,
    ))

    care_stage = getattr(elder_profile, "care_stage", 1) or 1
    current_asst = getattr(elder_profile, "current_assistance_level", 1) or 1

    return CaregiverDashboardResponse(
        elder=UserResponse.model_validate(elder),
        stats=stats,
        trends=trends,
        alerts=alerts,
        recent_sessions=[GameSessionResponse.model_validate(s) for s in recent],
        reminders=reminder_responses,
        care_stage=care_stage,
        assistance_level=current_asst,
        assistance_recommendation=rec_result.caregiver_recommendation,
    )


@router.put("/caregiver/{caregiver_id}/elders/{elder_id}/stage")
def update_elder_care_stage(
    caregiver_id: UUID,
    elder_id: UUID,
    req: CareStageUpdateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("caregiver")),
):
    """
    Authorized caregiver controls the patient's care stage (1, 2, or 3).
    AI provides assistance recommendations; human caregiver holds authority.
    """
    if current_user.user_id != caregiver_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    profile = db.query(ElderlyProfile).filter(
        ElderlyProfile.user_id == elder_id,
        ElderlyProfile.caregiver_id == caregiver_id,
    ).first()

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elder not linked to this caregiver")

    profile.care_stage = req.care_stage
    if req.temporary_assistance_level is not None:
        profile.current_assistance_level = req.temporary_assistance_level
    else:
        profile.current_assistance_level = req.care_stage

    db.commit()
    db.refresh(profile)

    stage_names = {
        1: "Stage 1 — Assistant (Independence)",
        2: "Stage 2 — Anchor (Reduced Cognitive Load)",
        3: "Stage 3 — Window (Comfort & Orientation)",
    }

    return {
        "status": "success",
        "elder_id": str(elder_id),
        "care_stage": profile.care_stage,
        "current_assistance_level": profile.current_assistance_level,
        "stage_label": stage_names.get(profile.care_stage, f"Stage {profile.care_stage}"),
        "message": f"Care configuration updated to {stage_names.get(profile.care_stage)}. Authorized caregiver in control.",
    }


def _calculate_streak(db: Session, elder_id: UUID) -> int:
    """Count consecutive days with at least one game session."""
    today = date.today()
    streak = 0
    for i in range(60):
        check_date = today - timedelta(days=i)
        day_start = datetime.combine(check_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        day_end = datetime.combine(check_date, datetime.max.time()).replace(tzinfo=timezone.utc)
        has_session = db.query(GameSession).filter(
            GameSession.elderly_id == elder_id,
            GameSession.created_at >= day_start,
            GameSession.created_at <= day_end,
        ).first()
        if has_session:
            streak += 1
        else:
            if i == 0:
                continue
            break
    return streak


def _compute_alerts(
    db: Session,
    elder_id: UUID,
    sessions_this_week: list,
    missed_count: int,
    streak: int,
) -> list[DashboardAlert]:
    """Generate alerts from real data — never hardcoded."""
    alerts = []

    # No activity in 2+ days
    if sessions_this_week:
        def get_ts(s):
            dt = s.created_at
            if dt is None:
                return 0.0
            if isinstance(dt, str):
                dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.timestamp()

        last_session = max(sessions_this_week, key=get_ts)
        now_ts = datetime.now(timezone.utc).timestamp()
        last_ts = get_ts(last_session)
        days_since = int((now_ts - last_ts) / 86400)
        if days_since >= 2:
            alerts.append(DashboardAlert(
                type="warning",
                message=f"No activity in {days_since} days",
                timestamp=last_session.created_at,
            ))
    else:
        alerts.append(DashboardAlert(
            type="warning",
            message="No game activity this week",
        ))

    # Missed medicine reminders
    if missed_count >= 3:
        alerts.append(DashboardAlert(
            type="warning",
            message=f"{missed_count} missed reminders this week",
        ))

    # Positive alerts
    if streak >= 3:
        alerts.append(DashboardAlert(
            type="success",
            message=f"Great engagement — {streak} day streak!",
        ))

    if sessions_this_week:
        avg_accuracy = sum(s.accuracy for s in sessions_this_week) / len(sessions_this_week)
        if avg_accuracy >= 0.8:
            alerts.append(DashboardAlert(
                type="success",
                message=f"Average accuracy this week: {avg_accuracy:.0%} — excellent!",
            ))

    return alerts

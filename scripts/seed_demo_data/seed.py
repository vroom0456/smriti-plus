"""
SMRITI+ — Seed Demo Data Script

Creates realistic demo data per Section 18:
- 3 elderly profiles, 2 caregivers, 1 health worker
- 4 games
- A week of game session history with varying performance
- Reminders with mixed adherence
- Demo accounts with known credentials

Run: python -m scripts.seed_demo_data.seed
"""

import uuid
import random
import hashlib
from datetime import datetime, timedelta, timezone, date

import sys
import os
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT_DIR, "backend"))

from sqlalchemy.orm import Session
from app.db.database import engine, SessionLocal, Base
from app.db.models import (
    User, ElderlyProfile, Game, GameSession, Reminder, ReminderLog,
    DifficultyState, ConsentLog,
    FamilyContact, MemoryItem, FamilyVoiceMessage, PersonalizationPreference,
)
from app.core.auth import hash_password


def seed():
    """Seed deterministic demo data."""
    db = SessionLocal()

    try:
        print("🌱 Seeding SMRITI+ demo data...")

        # ── Fixed UUIDs for reproducibility ──
        ELDER_1_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
        ELDER_2_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
        ELDER_3_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")
        CAREGIVER_1_ID = uuid.UUID("44444444-4444-4444-4444-444444444444")
        CAREGIVER_2_ID = uuid.UUID("55555555-5555-5555-5555-555555555555")
        HEALTH_WORKER_ID = uuid.UUID("66666666-6666-6666-6666-666666666666")

        GAME_RECALL_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
        GAME_MATCHING_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
        GAME_ATTENTION_ID = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
        GAME_PATTERN_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")

        # ── Users ──
        users = [
            User(id=ELDER_1_ID, role="elderly", name="Amit Borah",
                 email="elder.demo@smriti.local", password_hash=hash_password("1234"),
                 phone="9876543210", language="en"),
            User(id=ELDER_2_ID, role="elderly", name="Kamala Devi",
                 email="elder2@smriti.local", password_hash=hash_password("1234"),
                 phone="9876543211", language="as"),
            User(id=ELDER_3_ID, role="elderly", name="Ranjit Singh",
                 email="elder3@smriti.local", password_hash=hash_password("1234"),
                 phone="9876543212", language="en"),
            User(id=CAREGIVER_1_ID, role="caregiver", name="Priya Borah",
                 email="caregiver.demo@smriti.local", password_hash=hash_password("caregiver123"),
                 phone="9876543220", language="en"),
            User(id=CAREGIVER_2_ID, role="caregiver", name="Ritu Sharma",
                 email="caregiver2@smriti.local", password_hash=hash_password("caregiver123"),
                 phone="9876543221", language="en"),
            User(id=HEALTH_WORKER_ID, role="health_worker", name="Dr. Anjali Hazarika",
                 email="worker.demo@smriti.local", password_hash=hash_password("worker123"),
                 phone="9876543230", language="en"),
        ]
        for u in users:
            db.merge(u)
        db.flush()
        print("  ✓ Users created")

        # ── Elderly Profiles ──
        profiles = [
            ElderlyProfile(user_id=ELDER_1_ID, caregiver_id=CAREGIVER_1_ID,
                           health_worker_group_id=HEALTH_WORKER_ID, text_size="large"),
            ElderlyProfile(user_id=ELDER_2_ID, caregiver_id=CAREGIVER_1_ID,
                           health_worker_group_id=HEALTH_WORKER_ID, text_size="extra_large"),
            ElderlyProfile(user_id=ELDER_3_ID, caregiver_id=CAREGIVER_2_ID,
                           health_worker_group_id=HEALTH_WORKER_ID, text_size="large"),
        ]
        for p in profiles:
            db.merge(p)
        db.flush()
        print("  ✓ Elderly profiles created")

        # ── Games ──
        games = [
            Game(id=GAME_RECALL_ID, name="Memory Recall", category="memory_recall",
                 base_difficulty=1, description="Remember and recall objects shown to you",
                 icon="brain", target_time_ms=45000, min_difficulty=1, max_difficulty=5),
            Game(id=GAME_MATCHING_ID, name="Memory Matching", category="memory_matching",
                 base_difficulty=1, description="Find matching pairs of cards",
                 icon="cards", target_time_ms=60000, min_difficulty=1, max_difficulty=5),
            Game(id=GAME_ATTENTION_ID, name="Spot the Difference", category="attention",
                 base_difficulty=1, description="Find what's different in each set",
                 icon="eye", target_time_ms=30000, min_difficulty=1, max_difficulty=5),
            Game(id=GAME_PATTERN_ID, name="Pattern Complete", category="pattern_recognition",
                 base_difficulty=1, description="Complete the pattern sequence",
                 icon="puzzle", target_time_ms=40000, min_difficulty=1, max_difficulty=5),
        ]
        for g in games:
            db.merge(g)
        db.flush()
        print("  ✓ Games created")

        # ── Game Sessions (1 week of history for elder 1) ──
        random.seed(42)  # deterministic
        now = datetime.now(timezone.utc)
        game_ids = [GAME_RECALL_ID, GAME_MATCHING_ID, GAME_ATTENTION_ID, GAME_PATTERN_ID]

        session_count = 0
        for day_offset in range(7, 0, -1):
            day = now - timedelta(days=day_offset)
            # 1-3 sessions per day
            num_sessions = random.randint(1, 3)
            for _ in range(num_sessions):
                game_id = random.choice(game_ids)
                # Gradually improving accuracy over the week
                base_accuracy = 0.4 + (7 - day_offset) * 0.07
                accuracy = min(1.0, max(0.0, base_accuracy + random.uniform(-0.15, 0.15)))
                response_time = random.randint(15000, 55000)
                difficulty = min(5, max(1, 1 + int(base_accuracy * 4)))

                session = GameSession(
                    id=uuid.uuid4(),
                    elderly_id=ELDER_1_ID,
                    game_id=game_id,
                    accuracy=round(accuracy, 3),
                    response_time_ms=response_time,
                    completed=random.random() > 0.1,  # 90% completion rate
                    attempts=random.randint(1, 3),
                    difficulty_level=difficulty,
                    streak_at_time=day_offset,
                    device_id="demo-device-001",
                    created_at=day + timedelta(hours=random.randint(8, 18), minutes=random.randint(0, 59)),
                    synced_at=day + timedelta(hours=random.randint(8, 18), minutes=random.randint(0, 59)),
                )
                db.add(session)
                session_count += 1

        # Also add some sessions for elder 2
        for day_offset in range(5, 0, -1):
            day = now - timedelta(days=day_offset)
            game_id = random.choice(game_ids)
            accuracy = round(random.uniform(0.5, 0.9), 3)
            session = GameSession(
                id=uuid.uuid4(),
                elderly_id=ELDER_2_ID,
                game_id=game_id,
                accuracy=accuracy,
                response_time_ms=random.randint(20000, 50000),
                completed=True,
                attempts=1,
                difficulty_level=min(5, max(1, int(accuracy * 5))),
                streak_at_time=day_offset,
                device_id="demo-device-002",
                created_at=day + timedelta(hours=10),
                synced_at=day + timedelta(hours=10),
            )
            db.add(session)
            session_count += 1

        db.flush()
        print(f"  ✓ {session_count} game sessions created")

        # ── Difficulty State ──
        for elder_id in [ELDER_1_ID, ELDER_2_ID]:
            for game_id in game_ids:
                db.merge(DifficultyState(
                    elderly_id=elder_id,
                    game_id=game_id,
                    current_level=random.randint(1, 3),
                    consecutive_failures=0,
                ))
        db.flush()
        print("  ✓ Difficulty states created")

        # ── Reminders ──
        reminder_data = [
            # Elder 1 reminders
            (ELDER_1_ID, "medicine", "Morning Medicine", "08:00", "daily", CAREGIVER_1_ID),
            (ELDER_1_ID, "hydration", "Drink Water", "10:00", "daily", CAREGIVER_1_ID),
            (ELDER_1_ID, "meal", "Lunch Time", "12:30", "daily", CAREGIVER_1_ID),
            (ELDER_1_ID, "medicine", "Evening Medicine", "18:00", "daily", CAREGIVER_1_ID),
            (ELDER_1_ID, "activity", "Evening Walk", "17:00", "daily", CAREGIVER_1_ID),
            # Elder 2 reminders
            (ELDER_2_ID, "medicine", "Blood Pressure Medicine", "09:00", "daily", CAREGIVER_1_ID),
            (ELDER_2_ID, "hydration", "Tea Time", "15:00", "daily", CAREGIVER_1_ID),
            (ELDER_2_ID, "meal", "Dinner", "19:30", "daily", CAREGIVER_1_ID),
            # Elder 3 reminders
            (ELDER_3_ID, "medicine", "Vitamins", "08:30", "daily", CAREGIVER_2_ID),
            (ELDER_3_ID, "appointment", "Doctor Visit", "10:00", None, CAREGIVER_2_ID),
        ]

        reminder_objects = []
        for eid, cat, title, time, recurrence, creator in reminder_data:
            r = Reminder(
                id=uuid.uuid4(),
                elderly_id=eid,
                category=cat,
                title=title,
                scheduled_time=time,
                recurrence_rule=recurrence,
                created_by=creator,
            )
            db.add(r)
            reminder_objects.append(r)

        db.flush()
        print(f"  ✓ {len(reminder_objects)} reminders created")

        # ── Reminder Logs (mixed adherence for last 7 days) ──
        log_count = 0
        for r in reminder_objects:
            if r.recurrence_rule != "daily":
                continue
            for day_offset in range(7, 0, -1):
                day = now - timedelta(days=day_offset)
                # 70-85% adherence rate
                if random.random() < 0.78:
                    log_status = "done"
                    responded = "touch" if random.random() < 0.7 else "voice"
                else:
                    log_status = "missed"
                    responded = "auto"

                log = ReminderLog(
                    id=uuid.uuid4(),
                    reminder_id=r.id,
                    status=log_status,
                    responded_via=responded,
                    device_id="demo-device-001",
                    responded_at=day + timedelta(
                        hours=int(r.scheduled_time.split(":")[0]),
                        minutes=int(r.scheduled_time.split(":")[1]) + random.randint(0, 30),
                    ),
                )
                db.add(log)
                log_count += 1

        db.flush()
        print(f"  ✓ {log_count} reminder logs created")

        # ── Consent Logs ──
        for uid in [ELDER_1_ID, ELDER_2_ID, ELDER_3_ID, CAREGIVER_1_ID, CAREGIVER_2_ID, HEALTH_WORKER_ID]:
            db.merge(ConsentLog(
                id=uuid.uuid4(),
                user_id=uid,
                consent_version="1.0",
                accepted_at=now - timedelta(days=14),
            ))
        db.flush()
        print("  ✓ Consent logs created")

        # ── Phase 2: Family Contacts ──
        family_contacts = [
            FamilyContact(
                id=uuid.uuid4(),
                elderly_id=ELDER_1_ID,
                name="Priya Borah",
                relationship_label="Daughter (Primary Caregiver)",
                phone="9876543220",
                photo_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
                is_primary=True,
            ),
            FamilyContact(
                id=uuid.uuid4(),
                elderly_id=ELDER_1_ID,
                name="Rahul Borah",
                relationship_label="Son",
                phone="9876543225",
                photo_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
                is_primary=False,
            ),
            FamilyContact(
                id=uuid.uuid4(),
                elderly_id=ELDER_1_ID,
                name="Meena Borah",
                relationship_label="Granddaughter",
                phone="9876543226",
                photo_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
                is_primary=False,
            ),
            FamilyContact(
                id=uuid.uuid4(),
                elderly_id=ELDER_2_ID,
                name="Ritu Sharma",
                relationship_label="Daughter",
                phone="9876543221",
                photo_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
                is_primary=True,
            ),
        ]
        for fc in family_contacts:
            db.add(fc)
        db.flush()
        print(f"  ✓ {len(family_contacts)} family contacts created")

        # ── Phase 2: Cultural Memory Box Items (NER Themes) ──
        memory_items = [
            MemoryItem(
                id=uuid.uuid4(),
                elderly_id=ELDER_1_ID,
                type="photo",
                title="Rongali Bihu Festival, Majuli",
                description="Our family celebration at the village courtyard with dhol and pepa. Priya was wearing her first Muga riha.",
                media_url="bihu_celebration_majuli",
                thumbnail_url="bihu_thumb",
                category="Celebrations",
                created_by=CAREGIVER_1_ID,
            ),
            MemoryItem(
                id=uuid.uuid4(),
                elderly_id=ELDER_1_ID,
                type="story",
                title="Morning Walks at Jorhat Tea Gardens",
                description="Every November morning, Amit-da would walk through the Cinnamara tea estate smelling the fresh dew on tea leaves.",
                media_url="jorhat_tea_garden",
                thumbnail_url="tea_thumb",
                category="Places",
                created_by=CAREGIVER_1_ID,
            ),
            MemoryItem(
                id=uuid.uuid4(),
                elderly_id=ELDER_1_ID,
                type="photo",
                title="Sunset Boat Ride on Brahmaputra",
                description="Crossing over from Nimati Ghat to Kamalabari with Rahul and Meena. The golden sky reflected peacefully on the water.",
                media_url="brahmaputra_sunset",
                thumbnail_url="river_thumb",
                category="Memories",
                created_by=CAREGIVER_1_ID,
            ),
            MemoryItem(
                id=uuid.uuid4(),
                elderly_id=ELDER_1_ID,
                type="story",
                title="Mother's Golden Muga Handloom",
                description="The heirloom mekhela sador hand-woven with kingkhap motifs, preserved carefully in the wooden chest.",
                media_url="muga_silk_loom",
                thumbnail_url="loom_thumb",
                category="Family",
                created_by=CAREGIVER_1_ID,
            ),
            MemoryItem(
                id=uuid.uuid4(),
                elderly_id=ELDER_1_ID,
                type="audio",
                title="Calming Bihu Flute Melody",
                description="Traditional bamboo flute tune played during spring afternoons in Upper Assam.",
                media_url="bihu_flute_calm_melody",
                thumbnail_url="music_thumb",
                category="Music",
                created_by=CAREGIVER_1_ID,
            ),
        ]
        for mi in memory_items:
            db.add(mi)
        db.flush()
        print(f"  ✓ {len(memory_items)} cultural memory box items created")

        # ── Phase 2: Family Voice Messages ──
        voice_messages = [
            FamilyVoiceMessage(
                id=uuid.uuid4(),
                elderly_id=ELDER_1_ID,
                caregiver_id=CAREGIVER_1_ID,
                title="Morning Reminder from Priya",
                audio_url="Deuta, remember to have your warm water and medicine after breakfast. I will call you in the afternoon! ❤️",
                message_type="reminder",
            ),
            FamilyVoiceMessage(
                id=uuid.uuid4(),
                elderly_id=ELDER_1_ID,
                caregiver_id=CAREGIVER_1_ID,
                title="Message from Granddaughter Meena",
                audio_url="Dadu, I practiced the Bihu dance today! I am coming to see you on Sunday with hot pitha!",
                message_type="greeting",
            ),
        ]
        for vm in voice_messages:
            db.add(vm)
        db.flush()
        print(f"  ✓ {len(voice_messages)} family voice messages created")

        # ── Phase 2: Personalization Preferences ──
        preferences = [
            PersonalizationPreference(
                elderly_id=ELDER_1_ID,
                preferred_game="memory_matching",
                preferred_session_length=10,
                preferred_language="en",
                preferred_voice="female",
                assistance_level="standard",
                animation_level="calm",
                text_size="large",
                difficulty_preference=1,
            ),
            PersonalizationPreference(
                elderly_id=ELDER_2_ID,
                preferred_game="memory_recall",
                preferred_session_length=5,
                preferred_language="as",
                preferred_voice="female",
                assistance_level="high",
                animation_level="calm",
                text_size="extra_large",
                difficulty_preference=1,
            ),
        ]
        for pref in preferences:
            db.merge(pref)
        db.flush()
        print(f"  ✓ {len(preferences)} personalization preference profiles created")

        db.commit()
        print("\n✅ Demo data seeded successfully!")
        print("\n📋 Demo Accounts:")
        print("  Elder:       elder.demo@smriti.local / 1234")
        print("  Caregiver:   caregiver.demo@smriti.local / caregiver123")
        print("  Health Worker: worker.demo@smriti.local / worker123")
        print("  OTP (all):   123456")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

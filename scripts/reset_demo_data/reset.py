"""
SMRITI+ — Reset Demo Data Script

Clears demo-generated state, re-seeds deterministic demo data.
Development-only — never expose in production.

Run: python -m scripts.reset_demo_data.reset
"""

import sys
import os
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT_DIR, "backend"))

from sqlalchemy import text
from app.db.database import engine, SessionLocal
from scripts.seed_demo_data.seed import seed


def reset():
    """Clear all data and re-seed."""
    db = SessionLocal()
    try:
        print("🔄 Resetting SMRITI+ demo data...")

        # Clear all tables in dependency order
        tables = [
            "personalization_preferences", "family_voice_messages", "memory_items", "family_contacts",
            "audit_logs", "consent_logs", "sync_queue",
            "difficulty_state", "reminder_logs", "reminders",
            "game_sessions", "games", "elderly_profiles", "users",
        ]
        for table in tables:
            db.execute(text(f"DELETE FROM {table}"))
            print(f"  ✓ Cleared {table}")

        db.commit()
        print("\n🗑️  All data cleared.")

    except Exception as e:
        db.rollback()
        print(f"❌ Reset failed: {e}")
        raise
    finally:
        db.close()

    # Re-seed
    seed()


if __name__ == "__main__":
    reset()

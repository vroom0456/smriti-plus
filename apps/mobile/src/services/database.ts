/**
 * SMRITI+ — Local SQLite Database Service
 *
 * Implements Section 7 (Offline-First Architecture).
 * Local mirror of syncable server entities:
 * - game_sessions
 * - reminders
 * - reminder_logs
 * - difficulty_state
 * - sync_queue (outbox pattern)
 */

import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync('smriti_plus.db');
  await initTables(db);
  dbInstance = db;
  return db;
}

async function initTables(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      elder_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      difficulty_level INTEGER NOT NULL,
      score INTEGER NOT NULL,
      max_score INTEGER NOT NULL,
      accuracy_percentage REAL NOT NULL,
      response_time_ms INTEGER,
      completed_at TEXT NOT NULL,
      metrics_payload TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      elder_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      recurrence_pattern TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reminder_logs (
      id TEXT PRIMARY KEY,
      reminder_id TEXT NOT NULL,
      elder_id TEXT NOT NULL,
      scheduled_for TEXT NOT NULL,
      action TEXT NOT NULL,
      response_time_seconds INTEGER,
      confirmed_via TEXT NOT NULL,
      logged_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS difficulty_state (
      elder_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      current_difficulty INTEGER NOT NULL,
      consecutive_successes INTEGER NOT NULL DEFAULT 0,
      consecutive_failures INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (elder_id, game_id)
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      last_attempted_at TEXT,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS family_contacts (
      id TEXT PRIMARY KEY,
      elder_id TEXT NOT NULL,
      name TEXT NOT NULL,
      relationship_label TEXT NOT NULL,
      phone TEXT NOT NULL,
      photo_url TEXT,
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memory_items (
      id TEXT PRIMARY KEY,
      elder_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      media_url TEXT NOT NULL,
      thumbnail_url TEXT,
      category TEXT NOT NULL DEFAULT 'Family',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS family_voice_messages (
      id TEXT PRIMARY KEY,
      elder_id TEXT NOT NULL,
      caregiver_id TEXT,
      title TEXT NOT NULL,
      audio_url TEXT NOT NULL,
      message_type TEXT NOT NULL DEFAULT 'reminder',
      created_at TEXT NOT NULL,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS personalization_preferences (
      elder_id TEXT PRIMARY KEY,
      preferred_game TEXT NOT NULL DEFAULT 'matching',
      preferred_session_length INTEGER NOT NULL DEFAULT 10,
      preferred_language TEXT NOT NULL DEFAULT 'en',
      preferred_voice TEXT NOT NULL DEFAULT 'default',
      assistance_level TEXT NOT NULL DEFAULT 'standard',
      animation_level TEXT NOT NULL DEFAULT 'calm',
      text_size TEXT NOT NULL DEFAULT 'large',
      difficulty_preference INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patient_identity_story (
      id TEXT PRIMARY KEY,
      elderly_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      preferred_name TEXT,
      birth_place TEXT,
      schooling_location TEXT,
      college TEXT,
      study_details TEXT,
      childhood_friends TEXT,
      parents_names TEXT,
      spouse_name TEXT,
      kids TEXT,
      profession TEXT,
      home_town TEXT,
      comfort_message TEXT,
      updated_at TEXT NOT NULL
    );
  `);
}

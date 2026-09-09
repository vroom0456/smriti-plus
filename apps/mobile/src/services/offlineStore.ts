/**
 * SMRITI+ — Offline Store (Local-First Read/Write Layer)
 *
 * All user actions write directly to local SQLite first and enqueue
 * an event in sync_queue. Network never blocks the elderly user interface.
 */

import { v4 as uuidv4 } from '../utils/uuid';
import { getDatabase } from './database';

export interface LocalGameSession {
  id: string;
  elder_id: string;
  game_id: string;
  difficulty_level: number;
  score: number;
  max_score: number;
  accuracy_percentage: number;
  response_time_ms: number;
  completed_at: string;
  metrics_payload?: Record<string, any>;
}

export interface LocalReminder {
  id: string;
  elder_id: string;
  title: string;
  category: string;
  scheduled_time: string;
  recurrence_pattern?: string;
  active: number;
  created_by: string;
  created_at: string;
}

export interface LocalReminderLog {
  id: string;
  reminder_id: string;
  elder_id: string;
  scheduled_for: string;
  action: 'completed' | 'dismissed' | 'snoozed';
  response_time_seconds?: number;
  confirmed_via: 'touch' | 'voice' | 'auto';
  logged_at: string;
}

export const offlineStore = {
  /**
   * Save game session locally and queue for server sync
   */
  async recordGameSession(session: Omit<LocalGameSession, 'id' | 'completed_at'>): Promise<{ id: string; newDifficulty: number; previousDifficulty: number }> {
    const db = await getDatabase();
    const id = uuidv4();
    const completed_at = new Date().toISOString();
    const metrics_str = session.metrics_payload ? JSON.stringify(session.metrics_payload) : '{}';

    // Insert into local game_sessions
    await db.runAsync(
      `INSERT OR REPLACE INTO game_sessions 
       (id, elder_id, game_id, difficulty_level, score, max_score, accuracy_percentage, response_time_ms, completed_at, metrics_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        session.elder_id,
        session.game_id,
        session.difficulty_level,
        session.score,
        session.max_score,
        session.accuracy_percentage,
        session.response_time_ms,
        completed_at,
        metrics_str,
      ]
    );

    // Enqueue to sync_queue
    const syncEventId = uuidv4();
    const normalizedAccuracy = session.accuracy_percentage > 1 
      ? Math.round((session.accuracy_percentage / 100) * 1000) / 1000 
      : Math.round(session.accuracy_percentage * 1000) / 1000;

    const payload = JSON.stringify({
      id,
      elder_id: session.elder_id,
      game_id: session.game_id,
      difficulty_level: session.difficulty_level,
      score: session.score,
      max_score: session.max_score,
      accuracy: normalizedAccuracy,
      accuracy_percentage: session.accuracy_percentage,
      response_time_ms: session.response_time_ms,
      completed: true,
      attempts: 1,
      completed_at,
      metrics_payload: session.metrics_payload || {},
    });

    await db.runAsync(
      `INSERT INTO sync_queue (id, event_type, payload, status, retry_count, created_at)
       VALUES (?, 'game_session', ?, 'pending', 0, ?)`,
      [syncEventId, payload, completed_at]
    );

    // Update local difficulty estimation
    const previousDifficulty = session.difficulty_level;
    const newDifficulty = await this.updateLocalDifficulty(session.elder_id, session.game_id, session.accuracy_percentage);

    return { id, newDifficulty, previousDifficulty };
  },

  /**
   * Local rule-based difficulty adjustment
   */
  async updateLocalDifficulty(elder_id: string, game_id: string, accuracy: number): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      current_difficulty: number;
      consecutive_successes: number;
      consecutive_failures: number;
    }>(
      `SELECT current_difficulty, consecutive_successes, consecutive_failures 
       FROM difficulty_state WHERE elder_id = ? AND game_id = ?`,
      [elder_id, game_id]
    );

    let diff = row?.current_difficulty ?? 1;
    let succ = row?.consecutive_successes ?? 0;
    let fail = row?.consecutive_failures ?? 0;

    if (accuracy >= 80) {
      succ += 1;
      fail = 0;
      if (diff < 5) {
        diff += 1;
      }
    } else if (accuracy < 50) {
      fail += 1;
      succ = 0;
      if (diff > 1) {
        diff -= 1;
      }
    } else {
      succ = 0;
      fail = 0;
    }

    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO difficulty_state (elder_id, game_id, current_difficulty, consecutive_successes, consecutive_failures, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [elder_id, game_id, diff, succ, fail, now]
    );

    return diff;
  },

  /**
   * Get current difficulty for elder + game
   */
  async getDifficulty(elder_id: string, game_id: string): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ current_difficulty: number }>(
      `SELECT current_difficulty FROM difficulty_state WHERE elder_id = ? AND game_id = ?`,
      [elder_id, game_id]
    );
    return row?.current_difficulty ?? 1;
  },

  /**
   * Set explicit difficulty level for elder + game
   */
  async setDifficulty(elder_id: string, game_id: string, difficulty: number): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const clamped = Math.max(1, Math.min(5, difficulty));
    await db.runAsync(
      `INSERT OR REPLACE INTO difficulty_state (elder_id, game_id, current_difficulty, consecutive_successes, consecutive_failures, updated_at)
       VALUES (?, ?, ?, 0, 0, ?)`,
      [elder_id, game_id, clamped, now]
    );
    return clamped;
  },

  /**
   * Record reminder confirmation/dismissal locally and enqueue sync
   */
  async recordReminderAction(action: Omit<LocalReminderLog, 'id' | 'logged_at'>): Promise<string> {
    const db = await getDatabase();
    const id = uuidv4();
    const logged_at = new Date().toISOString();

    await db.runAsync(
      `INSERT OR REPLACE INTO reminder_logs
       (id, reminder_id, elder_id, scheduled_for, action, response_time_seconds, confirmed_via, logged_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        action.reminder_id,
        action.elder_id,
        action.scheduled_for,
        action.action,
        action.response_time_seconds ?? 0,
        action.confirmed_via,
        logged_at,
      ]
    );

    const syncEventId = uuidv4();
    const normalizedStatus = action.action === 'completed' ? 'done' : action.action === 'dismissed' ? 'missed' : action.action;
    const normalizedRespondedVia = action.confirmed_via || 'touch';

    const payload = JSON.stringify({
      id,
      reminder_id: action.reminder_id,
      elder_id: action.elder_id,
      scheduled_for: action.scheduled_for,
      status: normalizedStatus,
      responded_via: normalizedRespondedVia,
      action: action.action,
      response_time_seconds: action.response_time_seconds ?? 0,
      confirmed_via: normalizedRespondedVia,
      logged_at,
    });

    await db.runAsync(
      `INSERT INTO sync_queue (id, event_type, payload, status, retry_count, created_at)
       VALUES (?, 'reminder_log', ?, 'pending', 0, ?)`,
      [syncEventId, payload, logged_at]
    );

    return id;
  },

  /**
   * Toggle completed status of a reminder and record log
   */
  async toggleReminderTaken(reminderId: string, isTaken: boolean): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const id = uuidv4();
    const action = isTaken ? 'completed' : 'pending';
    await db.runAsync(
      `INSERT OR REPLACE INTO reminder_logs
       (id, reminder_id, elder_id, scheduled_for, action, response_time_seconds, confirmed_via, logged_at)
       VALUES (?, ?, 'elder_1', ?, ?, 0, 'touch', ?)`,
      [id, reminderId, now, action, now]
    );

    const syncEventId = uuidv4();
    const payload = JSON.stringify({
      id,
      reminder_id: reminderId,
      status: isTaken ? 'done' : 'pending',
      responded_via: 'touch',
      action,
      logged_at: now,
    });

    await db.runAsync(
      `INSERT INTO sync_queue (id, event_type, payload, status, retry_count, created_at)
       VALUES (?, 'reminder_log', ?, 'pending', 0, ?)`,
      [syncEventId, payload, now]
    );
  },

  /**
   * Cache reminders from server into local SQLite
   */
  async cacheReminders(reminders: LocalReminder[]): Promise<void> {
    const db = await getDatabase();
    for (const r of reminders) {
      await db.runAsync(
        `INSERT OR REPLACE INTO reminders (id, elder_id, title, category, scheduled_time, recurrence_pattern, active, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.elder_id, r.title, r.category, r.scheduled_time, r.recurrence_pattern || null, r.active, r.created_by, r.created_at]
      );
    }
  },

  /**
   * Read cached reminders for an elder (optionally including inactive/paused ones)
   */
  async getCachedReminders(elder_id: string, includeInactive: boolean = false): Promise<LocalReminder[]> {
    const db = await getDatabase();
    const query = includeInactive
      ? `SELECT * FROM reminders WHERE elder_id = ? ORDER BY scheduled_time ASC`
      : `SELECT * FROM reminders WHERE elder_id = ? AND active = 1 ORDER BY scheduled_time ASC`;
    const rows = await db.getAllAsync<LocalReminder>(query, [elder_id]);
    return rows;
  },

  /**
   * Toggle active status of a local reminder and enqueue update event
   */
  async toggleReminderActive(id: string, active: boolean): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE reminders SET active = ? WHERE id = ?`,
      [active ? 1 : 0, id]
    );

    const syncEventId = uuidv4();
    const now = new Date().toISOString();
    const payload = JSON.stringify({
      id,
      is_active: active,
      updated_at: now,
    });

    await db.runAsync(
      `INSERT INTO sync_queue (id, event_type, payload, status, retry_count, created_at)
       VALUES (?, 'update_reminder', ?, 'pending', 0, ?)`,
      [syncEventId, payload, now]
    );
  },

  /**
   * Delete a local reminder and enqueue delete event
   */
  async deleteReminder(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM reminders WHERE id = ?`, [id]);

    const syncEventId = uuidv4();
    const now = new Date().toISOString();
    const payload = JSON.stringify({
      id,
      deleted_at: now,
    });

    await db.runAsync(
      `INSERT INTO sync_queue (id, event_type, payload, status, retry_count, created_at)
       VALUES (?, 'delete_reminder', ?, 'pending', 0, ?)`,
      [syncEventId, payload, now]
    );
  },

  /**
   * Calculate local reminder adherence metrics for the day
   */
  async getReminderAdherence(elder_id: string): Promise<{
    totalToday: number;
    completedToday: number;
    adherencePct: number;
  }> {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];
    const reminders = await this.getCachedReminders(elder_id, true);
    const logs = await db.getAllAsync<{ action: string }>(
      `SELECT action FROM reminder_logs WHERE elder_id = ? AND scheduled_for LIKE ?`,
      [elder_id, `${today}%`]
    );
    const completed = logs.filter((l) => l.action === 'completed').length;
    const total = Math.max(reminders.length, logs.length, 1);
    const adherencePct = Math.min(100, Math.round((completed / total) * 100));
    return {
      totalToday: reminders.length,
      completedToday: completed,
      adherencePct: reminders.length > 0 ? adherencePct : 100,
    };
  },

  /**
   * Create a new reminder locally and enqueue to sync_queue
   */
  async createLocalReminder(reminder: {
    elder_id: string;
    title: string;
    category: string;
    scheduled_time: string;
    recurrence_pattern?: string;
  }): Promise<string> {
    const db = await getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO reminders (id, elder_id, title, category, scheduled_time, recurrence_pattern, active, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        reminder.elder_id,
        reminder.title,
        reminder.category,
        reminder.scheduled_time,
        reminder.recurrence_pattern || 'daily',
        reminder.elder_id,
        now,
      ]
    );

    const syncEventId = uuidv4();
    const payload = JSON.stringify({
      id,
      elder_id: reminder.elder_id,
      title: reminder.title,
      category: reminder.category,
      scheduled_time: reminder.scheduled_time,
      recurrence_pattern: reminder.recurrence_pattern || 'daily',
      created_at: now,
    });

    await db.runAsync(
      `INSERT INTO sync_queue (id, event_type, payload, status, retry_count, created_at)
       VALUES (?, 'create_reminder', ?, 'pending', 0, ?)`,
      [syncEventId, payload, now]
    );

    return id;
  },

  /**
   * Get pending sync items count
   */
  async getPendingSyncCount(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`
    );
    return result?.count ?? 0;
  },

  // ──────────────────────────────────────────────
  // PHASE 2: FAMILY CONTACTS
  // ──────────────────────────────────────────────

  async getCachedFamilyContacts(elder_id: string): Promise<any[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `SELECT * FROM family_contacts WHERE elder_id = ? ORDER BY is_primary DESC, created_at ASC`,
      [elder_id]
    );
    return rows;
  },

  async cacheFamilyContacts(contacts: any[]): Promise<void> {
    const db = await getDatabase();
    for (const c of contacts) {
      await db.runAsync(
        `INSERT OR REPLACE INTO family_contacts (id, elder_id, name, relationship_label, phone, photo_url, is_primary, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.elderly_id || c.elder_id, c.name, c.relationship_label, c.phone, c.photo_url || null, c.is_primary ? 1 : 0, c.created_at || new Date().toISOString()]
      );
    }
  },

  async recordFamilyContact(contact: any): Promise<string> {
    const db = await getDatabase();
    const id = contact.id || uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT OR REPLACE INTO family_contacts (id, elder_id, name, relationship_label, phone, photo_url, is_primary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, contact.elderly_id, contact.name, contact.relationship_label, contact.phone, contact.photo_url || null, contact.is_primary ? 1 : 0, now]
    );

    const syncEventId = uuidv4();
    await db.runAsync(
      `INSERT INTO sync_queue (id, event_type, payload, status, retry_count, created_at)
       VALUES (?, 'family_contact', ?, 'pending', 0, ?)`,
      [syncEventId, JSON.stringify({ ...contact, id }), now]
    );
    return id;
  },

  // ──────────────────────────────────────────────
  // PHASE 2: DIGITAL MEMORY BOX
  // ──────────────────────────────────────────────

  async getCachedMemories(elder_id: string, category?: string): Promise<any[]> {
    const db = await getDatabase();
    if (category && category !== 'All') {
      return await db.getAllAsync(
        `SELECT * FROM memory_items WHERE elder_id = ? AND category = ? ORDER BY created_at DESC`,
        [elder_id, category]
      );
    }
    return await db.getAllAsync(
      `SELECT * FROM memory_items WHERE elder_id = ? ORDER BY created_at DESC`,
      [elder_id]
    );
  },

  async cacheMemories(items: any[]): Promise<void> {
    const db = await getDatabase();
    for (const m of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO memory_items (id, elder_id, type, title, description, media_url, thumbnail_url, category, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.elderly_id || m.elder_id, m.type, m.title, m.description || null, m.media_url, m.thumbnail_url || null, m.category || 'Family', m.created_at || new Date().toISOString()]
      );
    }
  },

  async recordMemoryItem(item: any): Promise<string> {
    const db = await getDatabase();
    const id = item.id || uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT OR REPLACE INTO memory_items (id, elder_id, type, title, description, media_url, thumbnail_url, category, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, item.elderly_id, item.type, item.title, item.description || null, item.media_url, item.thumbnail_url || null, item.category || 'Family', now]
    );

    const syncEventId = uuidv4();
    await db.runAsync(
      `INSERT INTO sync_queue (id, event_type, payload, status, retry_count, created_at)
       VALUES (?, 'memory_item', ?, 'pending', 0, ?)`,
      [syncEventId, JSON.stringify({ ...item, id }), now]
    );
    return id;
  },

  // ──────────────────────────────────────────────
  // PHASE 2: FAMILY VOICE MESSAGES
  // ──────────────────────────────────────────────

  async getCachedVoiceMessages(elder_id: string): Promise<any[]> {
    const db = await getDatabase();
    return await db.getAllAsync(
      `SELECT * FROM family_voice_messages WHERE elder_id = ? ORDER BY created_at DESC`,
      [elder_id]
    );
  },

  async cacheVoiceMessages(messages: any[]): Promise<void> {
    const db = await getDatabase();
    for (const v of messages) {
      await db.runAsync(
        `INSERT OR REPLACE INTO family_voice_messages (id, elder_id, caregiver_id, title, audio_url, message_type, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.id, v.elderly_id || v.elder_id, v.caregiver_id || null, v.title, v.audio_url, v.message_type || 'reminder', v.created_at || new Date().toISOString(), v.expires_at || null]
      );
    }
  },

  async recordVoiceMessage(msg: any): Promise<string> {
    const db = await getDatabase();
    const id = msg.id || uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT OR REPLACE INTO family_voice_messages (id, elder_id, caregiver_id, title, audio_url, message_type, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, msg.elderly_id, msg.caregiver_id || null, msg.title, msg.audio_url, msg.message_type || 'reminder', now, msg.expires_at || null]
    );

    const syncEventId = uuidv4();
    await db.runAsync(
      `INSERT INTO sync_queue (id, event_type, payload, status, retry_count, created_at)
       VALUES (?, 'family_voice_message', ?, 'pending', 0, ?)`,
      [syncEventId, JSON.stringify({ ...msg, id }), now]
    );
    return id;
  },

  // ──────────────────────────────────────────────
  // PHASE 2: PERSONALIZATION PREFERENCES
  // ──────────────────────────────────────────────

  async getCachedPersonalization(elder_id: string): Promise<any> {
    const db = await getDatabase();
    return await db.getFirstAsync(
      `SELECT * FROM personalization_preferences WHERE elder_id = ?`,
      [elder_id]
    );
  },

  async savePersonalization(prefs: any): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO personalization_preferences (elder_id, preferred_game, preferred_session_length, preferred_language, preferred_voice, assistance_level, animation_level, text_size, difficulty_preference, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prefs.elder_id || prefs.elderly_id,
        prefs.preferred_game || 'matching',
        prefs.preferred_session_length || 10,
        prefs.preferred_language || 'en',
        prefs.preferred_voice || 'default',
        prefs.assistance_level || 'standard',
        prefs.animation_level || 'calm',
        prefs.text_size || 'large',
        prefs.difficulty_preference || 1,
        now,
      ]
    );
  },

  // ──────────────────────────────────────────────
  // CORE GAMES & OFFLINE SUMMARY HELPERS
  // ──────────────────────────────────────────────

  async getCachedOrDefaultGames(): Promise<any[]> {
    return DEFAULT_GAMES;
  },

  async getOfflineHomeSummary(elder_id: string): Promise<any> {
    const db = await getDatabase();
    // 1. Reminders
    const reminders = await this.getCachedReminders(elder_id);
    const pending = reminders.filter((r) => r.active === 1);
    
    // 2. Next reminder
    const nextReminder = pending.length > 0 ? {
      id: pending[0].id,
      title: pending[0].title,
      category: pending[0].category,
      scheduled_time: pending[0].scheduled_time,
    } : null;

    // 3. Today games count
    const today = new Date().toISOString().split('T')[0];
    const gamesRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM game_sessions WHERE elder_id = ? AND completed_at LIKE ?`,
      [elder_id, `${today}%`]
    );

    return {
      greeting: 'Welcome to SMRITI+',
      next_action: {
        message: nextReminder 
          ? `You have a ${nextReminder.category} reminder: ${nextReminder.title}`
          : 'Take a gentle moment to exercise your mind or talk to SMRITI+.',
        game_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        game_name: 'Memory Matching',
        difficulty: 1,
        reason: 'Recommended for daily cognitive engagement',
      },
      next_reminder: nextReminder,
      reminders_today_count: reminders.length,
      reminders_pending_count: pending.length,
      games_played_today: gamesRow?.count || 0,
      current_streak: 1,
      care_stage: 1,
      assistance_level: 1,
      effective_level: 1,
      stage_label: 'Independent Assistance',
    };
  },

  /**
   * Get cached patient identity & life story
   */
  async getCachedIdentityStory(elder_id: string): Promise<any | null> {
    const db = await getDatabase();
    return db.getFirstAsync<any>(
      `SELECT * FROM patient_identity_story WHERE elderly_id = ?`,
      [elder_id]
    );
  },

  /**
   * Cache patient identity & life story locally
   */
  async cacheIdentityStory(story: any): Promise<void> {
    const db = await getDatabase();
    const id = story.id || uuidv4();
    const updated_at = story.updated_at || new Date().toISOString();
    const kids_str = typeof story.kids === 'string' ? story.kids : JSON.stringify(story.kids || []);

    await db.runAsync(
      `INSERT OR REPLACE INTO patient_identity_story
       (id, elderly_id, full_name, preferred_name, birth_place, schooling_location, college, study_details, childhood_friends, parents_names, spouse_name, kids, profession, home_town, comfort_message, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        story.elderly_id,
        story.full_name,
        story.preferred_name || null,
        story.birth_place || null,
        story.schooling_location || null,
        story.college || null,
        story.study_details || null,
        story.childhood_friends || null,
        story.parents_names || null,
        story.spouse_name || null,
        kids_str,
        story.profession || null,
        story.home_town || null,
        story.comfort_message || null,
        updated_at,
      ]
    );
  },
};

export const DEFAULT_GAMES = [
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Memory Matching',
    category: 'memory_matching',
    description: 'Find matching pairs of cards with North East cultural themes',
    icon: '🃏',
    target_time_ms: 60000,
    min_difficulty: 1,
    max_difficulty: 5,
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Memory Recall',
    category: 'memory_recall',
    description: 'Remember and recall everyday objects and regional motifs',
    icon: '🧠',
    target_time_ms: 45000,
    min_difficulty: 1,
    max_difficulty: 5,
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'Attention Focus',
    category: 'attention',
    description: 'Find the different item in a set of familiar symbols',
    icon: '👁️',
    target_time_ms: 30000,
    min_difficulty: 1,
    max_difficulty: 5,
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    name: 'Pattern Recognition',
    category: 'pattern_recognition',
    description: 'Complete the sequence of traditional patterns and shapes',
    icon: '🧩',
    target_time_ms: 40000,
    min_difficulty: 1,
    max_difficulty: 5,
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    name: 'Brahmaputra Serenity',
    category: 'relaxation',
    description: '2-minute deep breathing & gentle mindfulness rhythm from the Serene Heritage collection',
    icon: '🌊',
    target_time_ms: 120000,
    min_difficulty: 1,
    max_difficulty: 3,
  },
  {
    id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    name: 'Cultural Heritage Recall',
    category: 'heritage_trivia',
    description: 'Celebrate familiar Indian crafts, handloom weaves, and regional folk traditions',
    icon: '🌸',
    target_time_ms: 50000,
    min_difficulty: 1,
    max_difficulty: 5,
  },
];

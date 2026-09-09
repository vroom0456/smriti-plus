/**
 * SMRITI+ — Local Database Web Fallback with Persistence
 *
 * Provides web-compatible persistent storage (in-memory + localStorage)
 * matching expo-sqlite's async API:
 * - execAsync
 * - runAsync
 * - getAllAsync
 * - getFirstAsync
 */

const STORAGE_PREFIX = 'smriti_sqlite_web_';

class WebDatabase {
  private tables: Record<string, any[]> = {
    game_sessions: [],
    difficulty_state: [],
    reminders: [],
    reminder_logs: [],
    sync_queue: [],
    personalization_preferences: [],
    family_contacts: [],
    memory_items: [],
    patient_identity_story: [],
  };

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      Object.keys(this.tables).forEach((table) => {
        const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${table}`);
        if (raw) {
          try {
            this.tables[table] = JSON.parse(raw);
          } catch {}
        }
      });
    } catch {}
  }

  private persistTable(table: string) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(
        `${STORAGE_PREFIX}${table}`,
        JSON.stringify(this.tables[table] || [])
      );
    } catch {}
  }

  async execAsync(sql: string): Promise<void> {
    return Promise.resolve();
  }

  async runAsync(sql: string, ...params: any[]): Promise<{ lastInsertRowId: number; changes: number }> {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const cleanSql = sql.trim().toLowerCase();

    // 1. Difficulty State INSERT OR REPLACE
    if (cleanSql.includes('into difficulty_state')) {
      // [elder_id, game_id, current_difficulty, consecutive_successes, consecutive_failures, updated_at]
      const [elder_id, game_id, current_difficulty, consecutive_successes, consecutive_failures, updated_at] = flatParams;
      this.tables.difficulty_state = this.tables.difficulty_state.filter(
        (r) => !(r.elder_id === elder_id && r.game_id === game_id)
      );
      this.tables.difficulty_state.push({
        elder_id,
        game_id,
        current_difficulty: Number(current_difficulty),
        consecutive_successes: Number(consecutive_successes || 0),
        consecutive_failures: Number(consecutive_failures || 0),
        updated_at: updated_at || new Date().toISOString(),
      });
      this.persistTable('difficulty_state');
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 2. Game Sessions INSERT OR REPLACE
    if (cleanSql.includes('into game_sessions')) {
      // [id, elder_id, game_id, difficulty_level, score, max_score, accuracy_percentage, response_time_ms, completed_at, metrics_payload]
      const [id, elder_id, game_id, difficulty_level, score, max_score, accuracy_percentage, response_time_ms, completed_at, metrics_payload] = flatParams;
      this.tables.game_sessions = this.tables.game_sessions.filter((r) => r.id !== id);
      this.tables.game_sessions.unshift({
        id,
        elder_id,
        game_id,
        difficulty_level: Number(difficulty_level),
        score: Number(score),
        max_score: Number(max_score),
        accuracy_percentage: Number(accuracy_percentage),
        response_time_ms: Number(response_time_ms || 0),
        completed_at: completed_at || new Date().toISOString(),
        metrics_payload: typeof metrics_payload === 'string' ? metrics_payload : JSON.stringify(metrics_payload || {}),
      });
      this.persistTable('game_sessions');
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 3. Sync Queue INSERT
    if (cleanSql.includes('into sync_queue')) {
      const [id, event_type, payload, status, retry_count, created_at] = flatParams;
      this.tables.sync_queue.unshift({
        id,
        event_type,
        payload,
        status: status || 'pending',
        retry_count: retry_count || 0,
        created_at: created_at || new Date().toISOString(),
      });
      this.persistTable('sync_queue');
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 4. Reminders INSERT OR REPLACE
    if (cleanSql.includes('into reminders')) {
      const [id, elder_id, title, category, scheduled_time, recurrence_pattern, active, created_by, created_at] = flatParams;
      this.tables.reminders = this.tables.reminders.filter((r) => r.id !== id);
      this.tables.reminders.push({
        id,
        elder_id,
        title,
        category,
        scheduled_time,
        recurrence_pattern,
        active: active !== undefined ? Number(active) : 1,
        created_by,
        created_at: created_at || new Date().toISOString(),
      });
      this.persistTable('reminders');
      return { lastInsertRowId: 1, changes: 1 };
    }

    return { lastInsertRowId: 1, changes: 1 };
  }

  async getAllAsync<T = any>(sql: string, ...params: any[]): Promise<T[]> {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const cleanSql = sql.trim().toLowerCase();

    if (cleanSql.includes('from game_sessions')) {
      const elderId = flatParams[0];
      let rows = this.tables.game_sessions;
      if (elderId) {
        rows = rows.filter((r) => r.elder_id === elderId);
      }
      return rows as T[];
    }

    if (cleanSql.includes('from difficulty_state')) {
      return this.tables.difficulty_state as T[];
    }

    if (cleanSql.includes('from reminders')) {
      const elderId = flatParams[0];
      let rows = this.tables.reminders;
      if (elderId) {
        rows = rows.filter((r) => r.elder_id === elderId);
      }
      return rows as T[];
    }

    if (cleanSql.includes('from sync_queue')) {
      return this.tables.sync_queue as T[];
    }

    return [] as T[];
  }

  async getFirstAsync<T = any>(sql: string, ...params: any[]): Promise<T | null> {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const cleanSql = sql.trim().toLowerCase();

    // 1. Difficulty state query
    if (cleanSql.includes('from difficulty_state')) {
      const [elder_id, game_id] = flatParams;
      const found = this.tables.difficulty_state.find(
        (r) => r.elder_id === elder_id && r.game_id === game_id
      );
      return (found || null) as T | null;
    }

    // 2. Count game sessions today
    if (cleanSql.includes('count(*)') && cleanSql.includes('from game_sessions')) {
      const elderId = flatParams[0];
      const count = this.tables.game_sessions.filter((r) => !elderId || r.elder_id === elderId).length;
      return { count } as any;
    }

    // 3. First game session
    if (cleanSql.includes('from game_sessions')) {
      const elderId = flatParams[0];
      const found = this.tables.game_sessions.find((r) => !elderId || r.elder_id === elderId);
      return (found || null) as T | null;
    }

    return null;
  }
}

const webDb = new WebDatabase();

export async function getDatabase(): Promise<any> {
  return Promise.resolve(webDb);
}

export async function closeDatabase(): Promise<void> {
  return Promise.resolve();
}

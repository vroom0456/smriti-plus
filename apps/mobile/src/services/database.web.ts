/**
 * SMRITI+ — Local Database Web Fallback
 *
 * Provides web-compatible in-memory storage for browser preview/testing
 * matching expo-sqlite's async API:
 * - execAsync
 * - runAsync
 * - getAllAsync
 * - getFirstAsync
 */

class WebDatabase {
  private memoryStore: Map<string, any[]> = new Map();

  async execAsync(sql: string): Promise<void> {
    // In-memory web mock for table creations
    return Promise.resolve();
  }

  async runAsync(sql: string, ...params: any[]): Promise<{ lastInsertRowId: number; changes: number }> {
    return Promise.resolve({ lastInsertRowId: 1, changes: 1 });
  }

  async getAllAsync<T = any>(sql: string, ...params: any[]): Promise<T[]> {
    return Promise.resolve([] as T[]);
  }

  async getFirstAsync<T = any>(sql: string, ...params: any[]): Promise<T | null> {
    return Promise.resolve(null);
  }
}

const webDb = new WebDatabase();

export async function getDatabase(): Promise<any> {
  return Promise.resolve(webDb);
}

export async function closeDatabase(): Promise<void> {
  return Promise.resolve();
}

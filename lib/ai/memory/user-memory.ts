import { UserMemory } from "./memory-types";

/**
 * Handles in-memory storage, retrieval, and updates of user preferences.
 *
 * Remembers preferred coding patterns, LLM response formatting, and active workspace parameters per user.
 *
 * // TODO: Replace Map with MongoDB
 * // TODO: Add Redis caching
 * // TODO: Add Pinecone Vector Search
 * // TODO: Add semantic embedding search
 */
export class UserMemoryStore {
  private store = new Map<string, UserMemory>();

  /**
   * Saves a user memory record.
   *
   * @param userId MongoDB ID of the user.
   * @param memory The UserMemory record containing configurations.
   */
  async saveUserMemory(userId: string, memory: UserMemory): Promise<void> {
    this.store.set(userId, memory);
  }

  /**
   * Retrieves a user's memory preferences.
   *
   * @param userId MongoDB ID of the user.
   * @returns UserMemory if found, else null.
   */
  async getUserMemory(userId: string): Promise<UserMemory | null> {
    return this.store.get(userId) || null;
  }

  /**
   * Updates/merges changes into user memory preferences.
   *
   * @param userId MongoDB ID of the user.
   * @param preferences Sub-properties of preferences to merge.
   */
  async updateUserMemory(
    userId: string,
    preferences: Partial<UserMemory["preferences"]>,
  ): Promise<void> {
    const existing = this.store.get(userId) || {
      userId,
      preferences: {},
      frequentlyUsedCommands: [],
      lastUpdated: new Date().toISOString(),
    };

    existing.preferences = {
      ...existing.preferences,
      ...preferences,
    };
    existing.lastUpdated = new Date().toISOString();

    this.store.set(userId, existing);
  }

  /**
   * Deletes a user memory profile.
   *
   * @param userId MongoDB ID of the user.
   */
  async deleteUserMemory(userId: string): Promise<void> {
    this.store.delete(userId);
  }
}
export const userMemory = new UserMemoryStore();

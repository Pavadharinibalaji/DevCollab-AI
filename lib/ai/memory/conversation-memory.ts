import { ConversationMemory, MemoryEntry, MemorySearchOptions } from "./memory-types";

/**
 * Handles in-memory storage, retrieval, and searching of conversation-level memories.
 *
 * Prevents redundant LLM processing of long user dialogue histories by retaining past dialogue summaries.
 *
 * // TODO: Replace Map with MongoDB
 * // TODO: Add Redis caching
 * // TODO: Add Pinecone Vector Search
 * // TODO: Add semantic embedding search
 */
export class ConversationMemoryStore {
  private store = new Map<string, ConversationMemory>();

  /**
   * Appends a new conversation entry to dialogue history memory.
   *
   * @param conversationId Unique identifier for the conversation (e.g., Slack thread, direct message room).
   * @param entry The new MemoryEntry summarizing the latest turn.
   */
  async saveConversation(conversationId: string, entry: MemoryEntry): Promise<void> {
    const existing = this.store.get(conversationId) || {
      conversationId,
      entries: [],
      lastUpdated: new Date().toISOString(),
    };

    existing.entries.push(entry);
    existing.lastUpdated = new Date().toISOString();
    this.store.set(conversationId, existing);
  }

  /**
   * Retrieves the full conversation history object.
   *
   * @param conversationId Unique identifier for the conversation.
   * @returns ConversationMemory if found, else null.
   */
  async getConversation(conversationId: string): Promise<ConversationMemory | null> {
    return this.store.get(conversationId) || null;
  }

  /**
   * Filters and retrieves specific conversation memory entries based on query options.
   *
   * @param conversationId Unique identifier for the conversation.
   * @param options Search parameters (text queries, result limit limits, etc.).
   * @returns Array of matching MemoryEntry items.
   */
  async searchConversation(
    conversationId: string,
    options: MemorySearchOptions,
  ): Promise<MemoryEntry[]> {
    const memory = this.store.get(conversationId);
    if (!memory) {
      return [];
    }

    let entries = [...memory.entries];

    if (options.query) {
      const queryLower = options.query.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.summary.toLowerCase().includes(queryLower) ||
          (e.metadata &&
            JSON.stringify(e.metadata).toLowerCase().includes(queryLower)),
      );
    }

    if (options.limit !== undefined) {
      entries = entries.slice(-options.limit);
    }

    return entries;
  }

  /**
   * Purges dialogue history memory.
   *
   * @param conversationId Unique identifier for the conversation.
   */
  async clearConversation(conversationId: string): Promise<void> {
    this.store.delete(conversationId);
  }
}
export const conversationMemory = new ConversationMemoryStore();

import { WorkspaceMemory, MemoryEntry } from "./memory-types";

/**
 * Handles in-memory storage, retrieval, and updates of workspace-level memories.
 *
 * Retains high-level workspace goals, sprint rules, team conventions, and general configuration settings.
 *
 * // TODO: Replace Map with MongoDB
 * // TODO: Add Redis caching
 * // TODO: Add Pinecone Vector Search
 * // TODO: Add semantic embedding search
 */
export class WorkspaceMemoryStore {
  private store = new Map<string, WorkspaceMemory>();

  /**
   * Appends an entry to workspace memory.
   *
   * @param workspaceId MongoDB ID of the workspace.
   * @param entry The new MemoryEntry item.
   */
  async saveWorkspaceMemory(workspaceId: string, entry: MemoryEntry): Promise<void> {
    const existing = this.store.get(workspaceId) || {
      workspaceId,
      entries: [],
      lastUpdated: new Date().toISOString(),
    };

    existing.entries.push(entry);
    existing.lastUpdated = new Date().toISOString();
    this.store.set(workspaceId, existing);
  }

  /**
   * Retrieves workspace memory.
   *
   * @param workspaceId MongoDB ID of the workspace.
   * @returns WorkspaceMemory if found, else null.
   */
  async getWorkspaceMemory(workspaceId: string): Promise<WorkspaceMemory | null> {
    return this.store.get(workspaceId) || null;
  }

  /**
   * Updates/replaces workspace memory.
   *
   * @param workspaceId MongoDB ID of the workspace.
   * @param entry The new/replacement memory entry (e.g., revised team conventions).
   */
  async updateWorkspaceMemory(workspaceId: string, entry: MemoryEntry): Promise<void> {
    // If it exists, we can replace or append. We will append to preserve history,
    // or replace if custom rules dictate. Here, we append to maintain history.
    await this.saveWorkspaceMemory(workspaceId, entry);
  }

  /**
   * Clears the memory entries for a workspace.
   *
   * @param workspaceId MongoDB ID of the workspace.
   */
  async clearWorkspaceMemory(workspaceId: string): Promise<void> {
    this.store.delete(workspaceId);
  }
}
export const workspaceMemory = new WorkspaceMemoryStore();

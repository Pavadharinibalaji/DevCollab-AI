import { ProjectMemory, MemoryEntry, MemorySearchOptions } from "./memory-types";

/**
 * Handles in-memory storage, retrieval, and searching of project-level memory entries.
 *
 * Preserves details concerning previous sprints, architecture changes,
 * completed features, and critical engineering decisions.
 *
 * // TODO: Replace Map with MongoDB
 * // TODO: Add Redis caching
 * // TODO: Add Pinecone Vector Search
 * // TODO: Add semantic embedding search
 */
export class ProjectMemoryStore {
  private store = new Map<string, ProjectMemory>();

  /**
   * Appends an entry to project memory.
   *
   * @param projectId MongoDB ID of the project.
   * @param entry The MemoryEntry representing a decision, sprint update, or action.
   */
  async saveProjectMemory(projectId: string, entry: MemoryEntry): Promise<void> {
    const existing = this.store.get(projectId) || {
      projectId,
      entries: [],
      lastUpdated: new Date().toISOString(),
    };

    existing.entries.push(entry);
    existing.lastUpdated = new Date().toISOString();
    this.store.set(projectId, existing);
  }

  /**
   * Retrieves the full project memory object.
   *
   * @param projectId MongoDB ID of the project.
   * @returns ProjectMemory if found, else null.
   */
  async getProjectMemory(projectId: string): Promise<ProjectMemory | null> {
    return this.store.get(projectId) || null;
  }

  /**
   * Searches project memory entries.
   *
   * @param projectId MongoDB ID of the project.
   * @param options Search query filtering and counts.
   * @returns Array of matching MemoryEntry items.
   */
  async searchProjectMemory(
    projectId: string,
    options: MemorySearchOptions,
  ): Promise<MemoryEntry[]> {
    const memory = this.store.get(projectId);
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
   * Deletes all cached memory for a specific project.
   *
   * @param projectId MongoDB ID of the project.
   */
  async deleteProjectMemory(projectId: string): Promise<void> {
    this.store.delete(projectId);
  }
}
export const projectMemory = new ProjectMemoryStore();

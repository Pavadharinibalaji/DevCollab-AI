import { conversationMemory } from "./conversation-memory";
import { projectMemory } from "./project-memory";
import { workspaceMemory } from "./workspace-memory";
import { userMemory } from "./user-memory";
import {
  ConversationMemory,
  ProjectMemory,
  WorkspaceMemory,
  UserMemory,
  MemoryEntry,
  MemorySearchOptions,
} from "./memory-types";

/**
 * Unified entry point (Facade) for all AI Memory Layer operations.
 *
 * Coordinates delegating memory commands to the appropriate store modules.
 * This class abstracts the details of storage implementations so that switching from in-memory maps
 * to databases, Redis, or vector search indices does not impact the AICoordinator.
 *
 * // TODO: Replace Map with MongoDB
 * // TODO: Add Redis caching
 * // TODO: Add Pinecone Vector Search
 * // TODO: Add semantic embedding search
 */
export class MemoryManager {
  // Conversation Memory Delegation
  async saveConversation(
    conversationId: string,
    entry: MemoryEntry,
  ): Promise<void> {
    return conversationMemory.saveConversation(conversationId, entry);
  }

  async getConversation(
    conversationId: string,
  ): Promise<ConversationMemory | null> {
    return conversationMemory.getConversation(conversationId);
  }

  async searchConversation(
    conversationId: string,
    options: MemorySearchOptions,
  ): Promise<MemoryEntry[]> {
    return conversationMemory.searchConversation(conversationId, options);
  }

  async clearConversation(conversationId: string): Promise<void> {
    return conversationMemory.clearConversation(conversationId);
  }

  // Project Memory Delegation
  async saveProject(projectId: string, entry: MemoryEntry): Promise<void> {
    return projectMemory.saveProjectMemory(projectId, entry);
  }

  async getProject(projectId: string): Promise<ProjectMemory | null> {
    return projectMemory.getProjectMemory(projectId);
  }

  async searchProject(
    projectId: string,
    options: MemorySearchOptions,
  ): Promise<MemoryEntry[]> {
    return projectMemory.searchProjectMemory(projectId, options);
  }

  async deleteProject(projectId: string): Promise<void> {
    return projectMemory.deleteProjectMemory(projectId);
  }

  // Workspace Memory Delegation
  async saveWorkspace(workspaceId: string, entry: MemoryEntry): Promise<void> {
    return workspaceMemory.saveWorkspaceMemory(workspaceId, entry);
  }

  async getWorkspace(workspaceId: string): Promise<WorkspaceMemory | null> {
    return workspaceMemory.getWorkspaceMemory(workspaceId);
  }

  async updateWorkspace(
    workspaceId: string,
    entry: MemoryEntry,
  ): Promise<void> {
    return workspaceMemory.updateWorkspaceMemory(workspaceId, entry);
  }

  async clearWorkspace(workspaceId: string): Promise<void> {
    return workspaceMemory.clearWorkspaceMemory(workspaceId);
  }

  // User Memory Delegation
  async saveUser(userId: string, memory: UserMemory): Promise<void> {
    return userMemory.saveUserMemory(userId, memory);
  }

  async getUser(userId: string): Promise<UserMemory | null> {
    return userMemory.getUserMemory(userId);
  }

  async updateUser(
    userId: string,
    preferences: Partial<UserMemory["preferences"]>,
  ): Promise<void> {
    return userMemory.updateUserMemory(userId, preferences);
  }

  async deleteUser(userId: string): Promise<void> {
    return userMemory.deleteUserMemory(userId);
  }
}

// Export a singleton instance of the memory manager
export const memoryManager = new MemoryManager();

export type MemoryType = "conversation" | "project" | "workspace" | "user";

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  timestamp: string;
  source: string; // e.g. "api", "slack", "github", "mcp"
  summary: string;
  metadata?: Record<string, any>;
}

export interface ConversationMemory {
  conversationId: string;
  entries: MemoryEntry[];
  lastUpdated: string;
}

export interface ProjectMemory {
  projectId: string;
  entries: MemoryEntry[];
  lastUpdated: string;
}

export interface WorkspaceMemory {
  workspaceId: string;
  entries: MemoryEntry[];
  lastUpdated: string;
}

export interface UserMemory {
  userId: string;
  preferences: {
    preferredProvider?: string;
    preferredCodingStyle?: string;
    preferredLanguage?: string;
    preferredResponseStyle?: string;
    recentlyOpenedProject?: string;
    [key: string]: any;
  };
  frequentlyUsedCommands?: string[];
  lastUpdated: string;
}

export interface MemorySearchOptions {
  query?: string;
  limit?: number;
  metadataFilters?: Record<string, any>;
}

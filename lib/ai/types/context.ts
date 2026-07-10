import { WorkspaceMemory, ProjectMemory, UserMemory, ConversationMemory } from "../memory/memory-types";

export interface WorkspaceContext {
  workspaceId?: string;
  name?: string;
  slug?: string;
  membersCount?: number;
  createdAt?: string;
}

export interface ProjectContext {
  projectId?: string;
  name?: string;
  slug?: string;
  status?: string;
  tasksCount?: number;
  recentActivities?: Array<{
    id: string;
    action: string;
    target: string;
    timestamp: string;
    user?: string;
  }>;
}

export interface RepositoryContext {
  repositoryUrl?: string;
  branch?: string;
  recentCommits?: Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
  }>;
  fileTree?: string[];
}

export interface SlackContext {
  channelId?: string;
  teamId?: string;
  recentMessages?: Array<{
    ts: string;
    user: string;
    text: string;
  }>;
}

export interface AIContext {
  workspace: WorkspaceContext;
  project: ProjectContext;
  repository: RepositoryContext;
  slack: SlackContext;
  timestamp: string;
  memory?: {
    workspace?: WorkspaceMemory | null;
    project?: ProjectMemory | null;
    user?: UserMemory | null;
    conversation?: ConversationMemory | null;
  };
}


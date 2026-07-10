import { AIAgent } from "../types/agent";
import { AIRequest } from "../types/request";
import { AIResponse } from "../types/response";
import { AIProvider } from "../providers/provider";
import { AIContext } from "../types/context";
import { connectMongoose } from "../../db/mongoose";

/**
 * AI Planning Agent handles sprint plans,Roadmaps, milestone breakdowns, task sequencing,
 * resource load leveling, and task priorities estimation.
 */
export class PlanningAgent implements AIAgent {
  
  /**
   * Generates a workspace summary string.
   */
  private buildWorkspaceSummary(aiContext: AIContext): string {
    const ws = aiContext.workspace;
    if (!ws || !ws.workspaceId) return "Workspace: N/A\n";
    return `Workspace: ${ws.name || "N/A"} (Slug: ${ws.slug || "N/A"}, Members: ${ws.membersCount ?? 0})\n`;
  }

  /**
   * Generates task statistics and list breakdown.
   */
  private buildTaskSummary(tasks: any[]): string {
    if (!tasks || tasks.length === 0) return "No tasks registered in this project.\n";

    const completed = tasks.filter(t => t.status === "done");
    const pending = tasks.filter(t => t.status !== "done");

    let text = `Task Stats: Total: ${tasks.length}, Completed: ${completed.length}, Pending: ${pending.length}\n\n`;

    text += "### Completed Tasks:\n";
    if (completed.length > 0) {
      completed.forEach(t => {
        text += `- [x] ${t.title} (Priority: ${t.priority || "medium"})\n`;
      });
    } else {
      text += "- None\n";
    }

    text += "\n### Pending Tasks:\n";
    if (pending.length > 0) {
      pending.forEach(t => {
        const assigneeName = t.assigneeId && typeof t.assigneeId === "object"
          ? t.assigneeId.name
          : "Unassigned";
        text += `- [ ] ${t.title} [Status: ${t.status || "todo"}, Priority: ${t.priority || "medium"}, Assignee: ${assigneeName}]\n`;
      });
    } else {
      text += "- None\n";
    }

    return text;
  }

  /**
   * Identifies upcoming deadlines and resource overloading metrics.
   */
  private buildTimelineSummary(tasks: any[]): string {
    if (!tasks || tasks.length === 0) return "Timeline Summary: N/A\n";

    const withDueDate = tasks
      .filter(t => t.dueDate && t.status !== "done")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    let text = "### Upcoming Deadlines:\n";
    if (withDueDate.length > 0) {
      withDueDate.forEach(t => {
        const formattedDate = new Date(t.dueDate).toISOString().split("T")[0];
        text += `- ${t.title} is due on ${formattedDate}\n`;
      });
    } else {
      text += "- No upcoming deadlines for pending tasks.\n";
    }

    const assigneeCounts: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.status !== "done" && t.assigneeId) {
        const name = typeof t.assigneeId === "object" ? t.assigneeId.name : "Teammate";
        if (name) {
          assigneeCounts[name] = (assigneeCounts[name] || 0) + 1;
        }
      }
    });

    const overloaded = Object.entries(assigneeCounts)
      .filter(([, count]) => count >= 3)
      .map(([name, count]) => `${name} (${count} pending tasks)`);

    text += "\n### Resource Allocation / Overloaded Members:\n";
    if (overloaded.length > 0) {
      text += `The following members have high workload (3 or more pending tasks):\n`;
      overloaded.forEach(m => {
        text += `- ${m}\n`;
      });
    } else {
      text += "- Resource allocation is balanced. No team member has more than 2 pending tasks.\n";
    }

    return text;
  }

  /**
   * Generates a summary log from historical memory context.
   */
  private buildMemorySummary(aiContext: AIContext): string {
    const memory = aiContext.memory;
    if (!memory) return "Previous Sprint Memory: None available\n";

    let text = "";
    
    const projEntries = memory.project?.entries || [];
    if (projEntries.length > 0) {
      text += "### Project Historical Memory Log:\n";
      projEntries.slice(0, 5).forEach((entry: any) => {
        text += `- [${entry.timestamp.split("T")[0]}] ${entry.summary}\n`;
      });
    }

    const wsEntries = memory.workspace?.entries || [];
    if (wsEntries.length > 0) {
      text += "\n### Workspace Historical Memory Log:\n";
      wsEntries.slice(0, 5).forEach((entry: any) => {
        text += `- [${entry.timestamp.split("T")[0]}] ${entry.summary}\n`;
      });
    }

    return text || "Previous Sprint Memory: None available\n";
  }

  /**
   * Builds the comprehensive Planning Agent prompt.
   */
  private buildPlanningPrompt(input: AIRequest, tasks: any[]): string {
    const aiContext = input.aiContext;
    if (!aiContext) return input.prompt;

    const workspaceInfo = this.buildWorkspaceSummary(aiContext);
    const currentProject = `Current Project: ${aiContext.project?.name || "N/A"} (Slug: ${aiContext.project?.slug || "N/A"}, Status: ${aiContext.project?.status || "N/A"})\n`;
    const taskSummary = this.buildTaskSummary(tasks);
    const timelineSummary = this.buildTimelineSummary(tasks);
    const memorySummary = this.buildMemorySummary(aiContext);

    const recentActivitiesList = aiContext.project?.recentActivities || [];
    let activitiesText = "### Recent Project Activities:\n";
    if (recentActivitiesList.length > 0) {
      recentActivitiesList.forEach((act: any) => {
        activitiesText += `- [${act.timestamp.split("T")[0]}] ${act.user} ${act.action} ${act.target}\n`;
      });
    } else {
      activitiesText += "- No recent activities logged.\n";
    }

    return `You are the DevCollab AI Planning Agent. Your goal is to generate professional project planning assistance.

## CONTEXTUAL INFORMATION

### Workspace Details
${workspaceInfo}

### Project Details
${currentProject}

${taskSummary}

${timelineSummary}

${activitiesText}

${memorySummary}

## USER REQUEST
The user has requested the following:
"${input.prompt}"

## INSTRUCTIONS
Based on the request and the contextual information provided above, generate a professional planning response.
Your response MUST contain the following sections formatted in clean, structured Markdown:
1. **Summary** (High-level overview of the plan or timeline)
2. **Recommendations** (Sprint goals, task sequencing, or general recommendations)
3. **Timeline** (Sprint/work milestones or sequence schedule)
4. **Priorities** (Task priorities and sequencing breakdown)
5. **Risks** (Potential bottlenecks, overload risks, or upcoming timeline risks)
6. **Next Steps** (Clear actionable list of immediate tasks to perform)
`;
  }

  /**
   * Executes the planning assistant agent model call.
   */
  async execute(input: AIRequest, provider: AIProvider): Promise<AIResponse> {
    const startTime = performance.now();

    // Read provider identity from the provider instance — single source of truth
    const pName = (provider as any).providerName || "Unknown";
    const mName = (provider as any).modelName || "Unknown";

    // 1. Graceful check for missing project context
    const projectId = input.aiContext?.project?.projectId;
    if (!projectId) {
      const promptSize = input.prompt.length;
      const contextSize = input.aiContext ? JSON.stringify(input.aiContext).length : 0;
      const executionTimeMs = Math.round(performance.now() - startTime);

      console.log(`[PlanningAgent] Prompt Size: ${promptSize} chars`);
      console.log(`[PlanningAgent] Context Size: ${contextSize} chars`);
      console.log(`[PlanningAgent] Provider: ${pName}`);
      console.log(`[PlanningAgent] Model: ${mName}`);
      console.log(`[PlanningAgent] Execution Time: ${executionTimeMs}ms`);

      return {
        id: "planning_" + Math.random().toString(36).substring(2, 15),
        requestId: input.id,
        success: true,
        agentType: "planning",
        content: "I need a project to generate a planning strategy.",
        executionTimeMs,
        confidence: 1.0,
        provider: `${pName} / ${mName}`,
        agentName: "planning",
        metadata: {
          promptSize,
          contextSize,
        }
      };
    }

    let tasks: any[] = [];
    try {
      await connectMongoose();
      const { TaskModel } = await import("../../db/models/task.model");
      tasks = await TaskModel.find({ projectId }).populate("assigneeId").exec();
    } catch (err) {
      console.error("[PlanningAgent] Failed to retrieve tasks from database:", err);
    }

    // 2. Build planning prompt and calculate metrics sizes
    const prompt = this.buildPlanningPrompt(input, tasks);
    const contextSize = input.aiContext ? JSON.stringify(input.aiContext).length : 0;
    const promptSize = prompt.length;

    let responseContent = "";
    let success = false;

    try {
      responseContent = await provider.generate(prompt, { temperature: 0.2 });
      success = true;
    } catch (err: any) {
      console.error("[PlanningAgent] Provider generation failed:", err);
      responseContent = `Error generating planning response: ${err.message || String(err)}`;
    }

    const executionTimeMs = Math.round(performance.now() - startTime);
    console.log(`[PlanningAgent] Prompt Size: ${promptSize} chars`);
    console.log(`[PlanningAgent] Context Size: ${contextSize} chars`);
    console.log(`[PlanningAgent] Provider: ${pName}`);
    console.log(`[PlanningAgent] Model: ${mName}`);
    console.log(`[PlanningAgent] Execution Time: ${executionTimeMs}ms`);

    return {
      id: "planning_" + Math.random().toString(36).substring(2, 15),
      requestId: input.id,
      success,
      agentType: "planning",
      content: responseContent,
      executionTimeMs,
      confidence: input.metadata?.classification?.confidence ?? 1.0,
      provider: `${pName} / ${mName}`,
      agentName: "planning",
      metadata: {
        promptSize,
        contextSize,
      }
    };
  }
}

import { WorkflowDefinition, WorkflowStep } from "./workflow-types";
import { AgentType } from "../types/agent";

/**
 * WorkflowBuilder provides a fluent API to define sequential multi-agent execution pipelines.
 */
export class WorkflowBuilder {
  private steps: WorkflowStep[] = [];
  private id: string;
  private name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  /**
   * Appends an agent execution step to the pipeline.
   */
  addStep(agentType: AgentType, description?: string): this {
    const id = `step_${this.steps.length + 1}_${agentType}`;
    this.steps.push({
      id,
      agentType,
      description,
    });
    return this;
  }

  /**
   * Finalizes and builds the WorkflowDefinition.
   */
  build(): WorkflowDefinition {
    return {
      id: this.id,
      name: this.name,
      steps: [...this.steps],
    };
  }

  /**
   * Generates the standard default audit workflow containing:
   * Repository Agent -> Planning Agent -> Risk Agent -> Knowledge Agent
   */
  static buildDefaultAuditWorkflow(): WorkflowDefinition {
    return new WorkflowBuilder("dev-audit", "Development Audit Workflow")
      .addStep("repository", "Analyze codebase structure and commits context")
      .addStep("planning", "Generate roadmaps and breakdown milestones")
      .addStep("risk", "Analyze timelines and classify bottleneck risks")
      .addStep("knowledge", "Fetch documentation references and coordinate answers")
      .build();
  }
}

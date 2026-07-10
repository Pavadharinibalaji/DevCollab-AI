import { WorkflowDefinition, WorkflowResult, WorkflowStepResult } from "./workflow-types";
import { AIRequest } from "../types/request";
import { AICoordinator } from "../coordinator/coordinator";

/**
 * WorkflowEngine manages sequential execution of multi-agent workflows.
 * It passes outputs of previous agents as context to subsequent agents.
 */
export class WorkflowEngine {
  constructor(private coordinator: AICoordinator) {}

  /**
   * Executes the sequence of steps defined in the workflow definition.
   * Bypasses execution if any intermediate step fails (fail-fast behavior).
   *
   * @param workflow The workflow definition mapping steps.
   * @param input The original AIRequest.
   * @returns Promise resolving to WorkflowResult.
   */
  async execute(workflow: WorkflowDefinition, input: AIRequest): Promise<WorkflowResult> {
    const startTime = Date.now();
    const stepResults: WorkflowStepResult[] = [];
    const previousOutputs: Array<{ agentType: string; content: string }> = [];

    let success = true;

    for (const step of workflow.steps) {
      const stepStartTime = Date.now();

      // Formulate shared context in the prompt for LLMs
      let stepPrompt = input.prompt;
      if (previousOutputs.length > 0) {
        stepPrompt += "\n\n=== Context from previous agent executions ===\n";
        for (const out of previousOutputs) {
          stepPrompt += `[Agent: ${out.agentType} output]:\n${out.content}\n\n`;
        }
      }

      // Construct request options passing previous outputs as shared context
      const stepRequest: AIRequest = {
        ...input,
        id: `${input.id}_${step.id}`,
        agentType: step.agentType,
        prompt: stepPrompt,
        context: {
          ...input.context,
          additionalContext: {
            ...input.context?.additionalContext,
            workflowId: workflow.id,
            stepId: step.id,
            previousStepResults: [...stepResults], // Shared context
          },
        },
      };

      try {
        const stepResponse = await this.coordinator.execute(stepRequest);

        const duration = Date.now() - stepStartTime;
        const stepResult: WorkflowStepResult = {
          stepId: step.id,
          agentType: step.agentType,
          success: stepResponse.success,
          content: stepResponse.content,
          data: stepResponse.data,
          error: stepResponse.error,
          executionTimeMs: duration,
        };

        stepResults.push(stepResult);

        if (!stepResponse.success) {
          success = false;
          break; // Halt workflow execution on failure
        }

        previousOutputs.push({
          agentType: step.agentType,
          content: stepResponse.content,
        });

      } catch (err: any) {
        success = false;
        const duration = Date.now() - stepStartTime;
        stepResults.push({
          stepId: step.id,
          agentType: step.agentType,
          success: false,
          content: "",
          error: err.message || String(err),
          executionTimeMs: duration,
        });
        break; // Halt workflow execution on exception
      }
    }

    const durationMs = Date.now() - startTime;
    const summary = this.buildSummary(workflow, stepResults, durationMs);

    return {
      workflowId: workflow.id,
      success,
      results: stepResults,
      summary,
      executionTimeMs: durationMs,
    };
  }

  /**
   * Helper to format human-readable execution digest.
   */
  private buildSummary(
    workflow: WorkflowDefinition,
    results: WorkflowStepResult[],
    totalDurationMs: number
  ): string {
    let summary = `Workflow "${workflow.name}" (${workflow.id}) completed in ${totalDurationMs}ms.\n`;
    summary += `Steps executed: ${results.length}/${workflow.steps.length}\n\n`;

    for (const r of results) {
      const status = r.success ? "SUCCESS" : "FAILED";
      summary += `- Step [${r.stepId}] (${r.agentType}): ${status} (${r.executionTimeMs}ms)\n`;
      if (r.error) {
        summary += `  Error: ${r.error}\n`;
      }
    }

    return summary;
  }
}

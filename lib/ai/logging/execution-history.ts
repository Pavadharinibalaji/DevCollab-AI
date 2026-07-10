import { ExecutionMetrics } from "./execution-metrics";

/**
 * ExecutionHistory manages past execution log entries.
 * For now, this class maintains logs in-memory.
 *
 * TODO (Future integration):
 * - Define a Mongoose/MongoDB schema for execution logs (e.g. `ExecutionLogModel`) to persist logs.
 * - Build analytics dashboards in the web client to visualize:
 *   - Total API cost over time.
 *   - Cache hit ratios and cost savings.
 *   - Success vs. failure rates.
 *   - Distribution of intent classifications and average execution times per agent.
 */
export class ExecutionHistory {
  private logs: ExecutionMetrics[] = [];
  private maxLogs = 1000; // Avoid unbounded memory growth in-memory

  /**
   * Adds a new execution log entry to history.
   */
  add(entry: ExecutionMetrics): void {
    this.logs.push(entry);

    // Keep memory clean
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Retrieves all logs stored in memory.
   */
  getEntries(): ExecutionMetrics[] {
    return [...this.logs];
  }

  /**
   * Clears the in-memory log history.
   */
  clear(): void {
    this.logs = [];
  }
}

export const executionHistory = new ExecutionHistory();

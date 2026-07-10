export type ProviderHealthStatus = "Healthy" | "Degraded" | "Unavailable";

export interface ProviderHealthState {
  status: ProviderHealthStatus;
  lastFailure?: Date;
  lastSuccess?: Date;
  consecutiveFailures: number;
  availability: boolean;
  lastResponseTime?: number;
}

/**
 * Tracks and determines provider availability and status (Healthy, Degraded, Unavailable)
 * based on consecutive execution results.
 */
export class ProviderHealthManager {
  private static states = new Map<string, ProviderHealthState>();

  /**
   * Returns the current health tracking state for a provider.
   */
  static getHealth(providerName: string): ProviderHealthState {
    const name = providerName.toLowerCase();
    let state = this.states.get(name);
    if (!state) {
      state = {
        status: "Healthy",
        consecutiveFailures: 0,
        availability: true,
      };
      this.states.set(name, state);
    }
    return state;
  }

  /**
   * Records a successful execution. Resets failure count and marks status as healthy.
   */
  static recordSuccess(providerName: string, responseTimeMs: number): void {
    const name = providerName.toLowerCase();
    const state = this.getHealth(name);
    state.lastSuccess = new Date();
    state.consecutiveFailures = 0;
    state.lastResponseTime = responseTimeMs;
    state.status = "Healthy";
    state.availability = true;
  }

  /**
   * Records an execution failure. Updates status to degraded or unavailable if threshold is hit.
   */
  static recordFailure(providerName: string): void {
    const name = providerName.toLowerCase();
    const state = this.getHealth(name);
    state.lastFailure = new Date();
    state.consecutiveFailures++;

    if (state.consecutiveFailures >= 5) {
      state.status = "Unavailable";
      state.availability = false;
    } else if (state.consecutiveFailures >= 2) {
      state.status = "Degraded";
      state.availability = true;
    }
  }

  /**
   * Forces a provider's state back to healthy (recovery check).
   */
  static resetHealth(providerName: string): void {
    const name = providerName.toLowerCase();
    this.states.delete(name);
  }
}
export const providerHealthManager = ProviderHealthManager;

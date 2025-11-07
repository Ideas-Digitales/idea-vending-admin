// Mecanismo de emergencia para prevenir loops infinitos
class LoopPrevention {
  private static instance: LoopPrevention;
  private callCounts: Map<string, number> = new Map();
  private lastCallTimes: Map<string, number> = new Map();
  private readonly MAX_CALLS_PER_SECOND = 5;
  private readonly RESET_INTERVAL = 1000; // 1 segundo

  static getInstance(): LoopPrevention {
    if (!LoopPrevention.instance) {
      LoopPrevention.instance = new LoopPrevention();
    }
    return LoopPrevention.instance;
  }

  shouldPreventCall(actionName: string): boolean {
    const now = Date.now();
    const lastCall = this.lastCallTimes.get(actionName) || 0;
    const callCount = this.callCounts.get(actionName) || 0;

    // Si ha pasado más de 1 segundo, resetear contador
    if (now - lastCall > this.RESET_INTERVAL) {
      this.callCounts.set(actionName, 1);
      this.lastCallTimes.set(actionName, now);
      return false;
    }

    // Si se han hecho demasiadas llamadas en poco tiempo, prevenir
    if (callCount >= this.MAX_CALLS_PER_SECOND) {
      console.error(`🚨 LOOP PREVENTION: Bloqueando ${actionName} - ${callCount} llamadas en ${now - lastCall}ms`);
      return true;
    }

    // Incrementar contador
    this.callCounts.set(actionName, callCount + 1);
    this.lastCallTimes.set(actionName, now);
    return false;
  }

  reset(actionName?: string) {
    if (actionName) {
      this.callCounts.delete(actionName);
      this.lastCallTimes.delete(actionName);
    } else {
      this.callCounts.clear();
      this.lastCallTimes.clear();
    }
  }
}

export const loopPrevention = LoopPrevention.getInstance();

export type Mode = 'permissive' | 'protected';
export type BrowserKind = 'local' | 'browserbase';
export type RunStatus = 'queued' | 'running' | 'completed' | 'error' | 'cancelled';
export type Outcome = 'compromised' | 'contained' | 'unaffected' | 'incomplete';
export interface RunEvent {
  id: number; type: string; title: string; detail: string; at: string;
  action?: string; ticketId?: number | null; allowed?: boolean;
}
export interface Run {
  id: string; source: 'live' | 'fixture'; note: string; noteHash: string; mode: Mode;
  browser: BrowserKind; model: string; status: RunStatus; createdAt: string;
  completedAt: string | null; task: string; tickets: Record<number, string>;
  noteRead: boolean; events: RunEvent[]; tokens: { input: number; output: number };
  browserSessionId: string | null; screenshotVersion: number; actionSeq: number;
  outcome: Outcome | null; error: string | null;
}
export interface Readiness {
  model: string; modelReady: boolean; modelMessage: string; modelProvider: string;
  localBrowserReady: boolean; browserbaseReady: boolean; browserbaseKeyPresent: boolean;
  publicUrlPresent: boolean; sentryConfigured: boolean; protectedApi: boolean;
}

/**
 * @file preflight/types.ts
 * @description Core types for the preflight enforcement system
 */

export type Severity = 'error' | 'warning' | 'info';
export type CheckStatus = 'pass' | 'fail' | 'skip';

export interface CheckResult {
  checkId: string;
  status: CheckStatus;
  severity: Severity;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
  autoFixable?: boolean;
}

export interface CheckContext {
  /** Root path of the target (e.g., interfaces/desktop/src) */
  targetRoot: string;
  /** Platform root path */
  platformRoot: string;
  /** Files to check (glob-matched) */
  files: string[];
  /** Current check configuration */
  config: CheckConfig;
  /** Dry run mode - don't modify files */
  dryRun: boolean;
}

export interface CheckConfig {
  description: string;
  tier: 1 | 2 | 3;
  scope: string[];
  enforcement: Severity;
  autofix: boolean;
  allowedImports?: string[];
  allowlist?: string[];
  patterns?: Record<string, string>;
}

export interface Check {
  id: string;
  name: string;
  description: string;
  run(ctx: CheckContext): Promise<CheckResult[]>;
}

export interface FixResult {
  fixId: string;
  file: string;
  applied: boolean;
  description: string;
  diff?: string;
}

export interface Fixer {
  id: string;
  name: string;
  description: string;
  /** Check if fix is applicable */
  canFix(result: CheckResult): boolean;
  /** Preview what would be fixed */
  preview(result: CheckResult, ctx: CheckContext): Promise<FixResult>;
  /** Apply the fix */
  apply(result: CheckResult, ctx: CheckContext): Promise<FixResult>;
}

export interface PreflightReport {
  timestamp: string;
  mode: 'check' | 'fix' | 'dry-run';
  targetRoot: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
  };
  byTier: {
    [tier: number]: {
      total: number;
      passed: number;
      failed: number;
    };
  };
  results: CheckResult[];
  fixes?: FixResult[];
}

export interface PolicyConfig {
  version: string;
  description?: string;
  targetPath: string;
  rules: Record<string, CheckConfig>;
  kindMatrix: Record<string, KindConfig>;
}

export interface KindConfig {
  lifecycle: string[];
  requiredDocs?: string[];
  requiredExports?: string[];
  forbiddenPatterns?: string[];
  patterns?: string[] | Record<string, string>;
}

export interface DryRunState {
  generated: boolean;
  timestamp: string;
  hash: string;
  fixes: FixResult[];
}

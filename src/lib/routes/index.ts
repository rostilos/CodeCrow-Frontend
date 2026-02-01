/**
 * Centralized route utilities for the CodeCrow application.
 * Routes are organized by category for better maintainability.
 */

export * from './static.routes';
export * from './dashboard.routes';
export * from './docs.routes';

// Re-export utilities
export { extractWorkspaceFromPath, isDashboardPath } from './utils';

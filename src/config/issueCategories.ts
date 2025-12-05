/**
 * Issue category constants and utilities
 */

export const ISSUE_CATEGORIES = {
  SECURITY: 'SECURITY',
  PERFORMANCE: 'PERFORMANCE',
  CODE_QUALITY: 'CODE_QUALITY',
  BUG_RISK: 'BUG_RISK',
  STYLE: 'STYLE',
  DOCUMENTATION: 'DOCUMENTATION',
  BEST_PRACTICES: 'BEST_PRACTICES',
  ERROR_HANDLING: 'ERROR_HANDLING',
  TESTING: 'TESTING',
  ARCHITECTURE: 'ARCHITECTURE',
} as const;

export type IssueCategory = typeof ISSUE_CATEGORIES[keyof typeof ISSUE_CATEGORIES];

export interface IssueCategoryInfo {
  key: IssueCategory;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const ISSUE_CATEGORY_INFO: Record<IssueCategory, IssueCategoryInfo> = {
  [ISSUE_CATEGORIES.SECURITY]: {
    key: ISSUE_CATEGORIES.SECURITY,
    label: 'Security',
    description: 'Security vulnerabilities, injection risks, authentication issues',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  [ISSUE_CATEGORIES.PERFORMANCE]: {
    key: ISSUE_CATEGORIES.PERFORMANCE,
    label: 'Performance',
    description: 'Performance bottlenecks, inefficient algorithms, resource leaks',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  [ISSUE_CATEGORIES.CODE_QUALITY]: {
    key: ISSUE_CATEGORIES.CODE_QUALITY,
    label: 'Code Quality',
    description: 'Code smells, maintainability issues, complexity problems',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  [ISSUE_CATEGORIES.BUG_RISK]: {
    key: ISSUE_CATEGORIES.BUG_RISK,
    label: 'Bug Risk',
    description: 'Potential bugs, edge cases, null pointer risks',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  [ISSUE_CATEGORIES.STYLE]: {
    key: ISSUE_CATEGORIES.STYLE,
    label: 'Style',
    description: 'Code style, formatting, naming conventions',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
  },
  [ISSUE_CATEGORIES.DOCUMENTATION]: {
    key: ISSUE_CATEGORIES.DOCUMENTATION,
    label: 'Documentation',
    description: 'Missing or inadequate documentation',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-950',
    borderColor: 'border-slate-200 dark:border-slate-800',
  },
  [ISSUE_CATEGORIES.BEST_PRACTICES]: {
    key: ISSUE_CATEGORIES.BEST_PRACTICES,
    label: 'Best Practices',
    description: 'Violations of language/framework best practices',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  [ISSUE_CATEGORIES.ERROR_HANDLING]: {
    key: ISSUE_CATEGORIES.ERROR_HANDLING,
    label: 'Error Handling',
    description: 'Improper exception handling, missing error checks',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  [ISSUE_CATEGORIES.TESTING]: {
    key: ISSUE_CATEGORIES.TESTING,
    label: 'Testing',
    description: 'Test coverage issues, untestable code',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950',
    borderColor: 'border-teal-200 dark:border-teal-800',
  },
  [ISSUE_CATEGORIES.ARCHITECTURE]: {
    key: ISSUE_CATEGORIES.ARCHITECTURE,
    label: 'Architecture',
    description: 'Design issues, coupling problems, SOLID violations',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
  },
};

export function getCategoryInfo(category: string | undefined | null): IssueCategoryInfo {
  if (!category) {
    return ISSUE_CATEGORY_INFO[ISSUE_CATEGORIES.CODE_QUALITY];
  }
  const normalized = category.toUpperCase().replace(/[- ]/g, '_');
  return ISSUE_CATEGORY_INFO[normalized as IssueCategory] || ISSUE_CATEGORY_INFO[ISSUE_CATEGORIES.CODE_QUALITY];
}

export function getCategoryLabel(category: string | undefined | null): string {
  return getCategoryInfo(category).label;
}

export function getCategoryColor(category: string | undefined | null): string {
  return getCategoryInfo(category).color;
}

export function getCategoryBgColor(category: string | undefined | null): string {
  return getCategoryInfo(category).bgColor;
}

export function getAllCategories(): IssueCategoryInfo[] {
  return Object.values(ISSUE_CATEGORY_INFO);
}

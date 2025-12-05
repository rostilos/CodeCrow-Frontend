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
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100/80 dark:bg-red-950',
    borderColor: 'border-red-300 dark:border-red-800',
  },
  [ISSUE_CATEGORIES.PERFORMANCE]: {
    key: ISSUE_CATEGORIES.PERFORMANCE,
    label: 'Performance',
    description: 'Performance bottlenecks, inefficient algorithms, resource leaks',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100/80 dark:bg-orange-950',
    borderColor: 'border-orange-300 dark:border-orange-800',
  },
  [ISSUE_CATEGORIES.CODE_QUALITY]: {
    key: ISSUE_CATEGORIES.CODE_QUALITY,
    label: 'Code Quality',
    description: 'Code smells, maintainability issues, complexity problems',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100/80 dark:bg-blue-950',
    borderColor: 'border-blue-300 dark:border-blue-800',
  },
  [ISSUE_CATEGORIES.BUG_RISK]: {
    key: ISSUE_CATEGORIES.BUG_RISK,
    label: 'Bug Risk',
    description: 'Potential bugs, edge cases, null pointer risks',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100/80 dark:bg-purple-950',
    borderColor: 'border-purple-300 dark:border-purple-800',
  },
  [ISSUE_CATEGORIES.STYLE]: {
    key: ISSUE_CATEGORIES.STYLE,
    label: 'Style',
    description: 'Code style, formatting, naming conventions',
    color: 'text-cyan-700 dark:text-cyan-400',
    bgColor: 'bg-cyan-100/80 dark:bg-cyan-950',
    borderColor: 'border-cyan-300 dark:border-cyan-800',
  },
  [ISSUE_CATEGORIES.DOCUMENTATION]: {
    key: ISSUE_CATEGORIES.DOCUMENTATION,
    label: 'Documentation',
    description: 'Missing or inadequate documentation',
    color: 'text-slate-700 dark:text-slate-400',
    bgColor: 'bg-slate-100/80 dark:bg-slate-950',
    borderColor: 'border-slate-300 dark:border-slate-800',
  },
  [ISSUE_CATEGORIES.BEST_PRACTICES]: {
    key: ISSUE_CATEGORIES.BEST_PRACTICES,
    label: 'Best Practices',
    description: 'Violations of language/framework best practices',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100/80 dark:bg-emerald-950',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
  },
  [ISSUE_CATEGORIES.ERROR_HANDLING]: {
    key: ISSUE_CATEGORIES.ERROR_HANDLING,
    label: 'Error Handling',
    description: 'Improper exception handling, missing error checks',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100/80 dark:bg-amber-950',
    borderColor: 'border-amber-300 dark:border-amber-800',
  },
  [ISSUE_CATEGORIES.TESTING]: {
    key: ISSUE_CATEGORIES.TESTING,
    label: 'Testing',
    description: 'Test coverage issues, untestable code',
    color: 'text-teal-700 dark:text-teal-400',
    bgColor: 'bg-teal-100/80 dark:bg-teal-950',
    borderColor: 'border-teal-300 dark:border-teal-800',
  },
  [ISSUE_CATEGORIES.ARCHITECTURE]: {
    key: ISSUE_CATEGORIES.ARCHITECTURE,
    label: 'Architecture',
    description: 'Design issues, coupling problems, SOLID violations',
    color: 'text-indigo-700 dark:text-indigo-400',
    bgColor: 'bg-indigo-100/80 dark:bg-indigo-950',
    borderColor: 'border-indigo-300 dark:border-indigo-800',
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

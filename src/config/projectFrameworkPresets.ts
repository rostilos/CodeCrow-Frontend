export interface ProjectFrameworkPreset {
  id: string;
  label: string;
  description: string;
  includePatterns: string[];
  excludePatterns: string[];
}

export const PROJECT_FRAMEWORK_PRESETS: ProjectFrameworkPreset[] = [
  {
    id: "generic",
    label: "Generic / custom",
    description: "Start without framework-specific path exclusions.",
    includePatterns: [],
    excludePatterns: [],
  },
  {
    id: "magento2",
    label: "Magento 2",
    description:
      "Focus on application code and omit Magento runtime, dependency, and generated trees.",
    includePatterns: [],
    excludePatterns: [
      "bin/**",
      "dev/**",
      "generated/**",
      "lib/**",
      "pub/**",
      "setup/**",
      "var/**",
      "vendor/**",
      "composer.lock",
    ],
  },
  {
    id: "hyva",
    label: "Magento 2 + Hyva",
    description:
      "Use the Magento application-code scope for Hyva storefront projects.",
    includePatterns: [],
    excludePatterns: [
      "bin/**",
      "dev/**",
      "generated/**",
      "lib/**",
      "pub/**",
      "setup/**",
      "var/**",
      "vendor/**",
      "composer.lock",
    ],
  },
  {
    id: "spring",
    label: "Spring / Java",
    description: "Omit dependency caches and compiled Java build output.",
    includePatterns: [],
    excludePatterns: [
      ".gradle/**",
      ".mvn/wrapper/**",
      "build/**",
      "target/**",
      "*.class",
    ],
  },
  {
    id: "fastapi",
    label: "FastAPI / Python",
    description: "Omit Python environments, bytecode, and local test caches.",
    includePatterns: [],
    excludePatterns: [
      ".mypy_cache/**",
      ".pytest_cache/**",
      ".ruff_cache/**",
      ".venv/**",
      "venv/**",
      "**/__pycache__/**",
      "*.pyc",
    ],
  },
  {
    id: "node",
    label: "Node.js / frontend",
    description: "Omit installed dependencies, generated bundles, and caches.",
    includePatterns: [],
    excludePatterns: [
      ".next/**",
      ".nuxt/**",
      ".turbo/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
    ],
  },
];

export const DEFAULT_PROJECT_FRAMEWORK_PRESET_ID = "generic";

export function getProjectFrameworkPreset(id: string) {
  return (
    PROJECT_FRAMEWORK_PRESETS.find((preset) => preset.id === id) ??
    PROJECT_FRAMEWORK_PRESETS[0]
  );
}

export function inferProjectFrameworkPreset(
  includePatterns: string[] | null | undefined,
  excludePatterns: string[] | null | undefined,
) {
  const includes = includePatterns ?? [];
  const excludes = excludePatterns ?? [];
  return (
    PROJECT_FRAMEWORK_PRESETS.find(
      (preset) =>
        arraysEqual(preset.includePatterns, includes) &&
        arraysEqual(preset.excludePatterns, excludes),
    )?.id ?? DEFAULT_PROJECT_FRAMEWORK_PRESET_ID
  );
}

function arraysEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

import { Bot, Layers3 } from "lucide-react";

import type { ReviewApproach } from "@/api_service/project/projectService";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface ReviewApproachSelectorProps {
  value: ReviewApproach;
  onValueChange: (value: ReviewApproach) => void;
  disabled?: boolean;
}

const approaches: Array<{
  value: ReviewApproach;
  title: string;
  description: string;
  icon: typeof Layers3;
}> = [
  {
    value: "CLASSIC",
    title: "Classic review",
    description:
      "Use the current staged review flow with orchestrator-managed RAG context.",
    icon: Layers3,
  },
  {
    value: "AGENTIC",
    title: "Agentic review",
    description:
      "Explore an exact repository snapshot with bounded, read-only source tools.",
    icon: Bot,
  },
];

export default function ReviewApproachSelector({
  value,
  onValueChange,
  disabled = false,
}: ReviewApproachSelectorProps) {
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 font-medium">Review approach</legend>
      <p className="text-sm text-muted-foreground">
        Choose the engine used for pull request analysis.
      </p>

      <RadioGroup
        value={value}
        onValueChange={(nextValue) =>
          onValueChange(nextValue as ReviewApproach)
        }
        disabled={disabled}
        className="grid gap-3 md:grid-cols-2"
        aria-label="Review approach"
      >
        {approaches.map((approach) => {
          const Icon = approach.icon;
          const selected = value === approach.value;

          return (
            <Label
              key={approach.value}
              htmlFor={`review-approach-${approach.value.toLowerCase()}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors",
                "hover:border-primary/60",
                selected && "border-primary bg-primary/5",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <RadioGroupItem
                id={`review-approach-${approach.value.toLowerCase()}`}
                value={approach.value}
                className="mt-1 shrink-0"
              />
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="space-y-1">
                <span className="block font-medium">{approach.title}</span>
                <span className="block text-sm font-normal text-muted-foreground">
                  {approach.description}
                </span>
              </span>
            </Label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}

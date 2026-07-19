import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ReviewApproachSelector from "@/components/ReviewApproachSelector";

describe("ReviewApproachSelector", () => {
  it("shows the current engine and reports an explicit engine change", () => {
    const onValueChange = vi.fn();

    const { rerender } = render(
      <ReviewApproachSelector
        value="CLASSIC"
        onValueChange={onValueChange}
      />,
    );

    expect(
      screen.getByRole("radio", { name: /classic review/i }),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(/current staged review flow/i)).toBeVisible();
    expect(screen.getByText(/exact repository snapshot/i)).toBeVisible();

    fireEvent.click(screen.getByRole("radio", { name: /agentic review/i }));
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith("AGENTIC");

    rerender(
      <ReviewApproachSelector
        value="AGENTIC"
        onValueChange={onValueChange}
      />,
    );
    expect(
      screen.getByRole("radio", { name: /agentic review/i }),
    ).toHaveAttribute("aria-checked", "true");
  });
});

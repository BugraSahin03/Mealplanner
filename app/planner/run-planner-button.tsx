"use client";

import { useFormStatus } from "react-dom";

type RunPlannerButtonProps = {
  disabled: boolean;
  label: string;
};

export function RunPlannerButton({ disabled, label }: RunPlannerButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className="secondary-button" type="submit" disabled={disabled || pending}>
      {pending ? "Planner laeuft..." : label}
    </button>
  );
}

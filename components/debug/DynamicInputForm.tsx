"use client";

import type { WorkflowInputSchema } from "@/lib/workflow/schema";
import { StringInput } from "./inputs/StringInput";
import { StringArrayInput } from "./inputs/StringArrayInput";
import { NumberInput } from "./inputs/NumberInput";
import { ImageInput } from "./inputs/ImageInput";

interface DynamicInputFormProps {
  inputs: WorkflowInputSchema[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  onSubmit: () => void;
  isRunning: boolean;
}

export function DynamicInputForm({
  inputs,
  values,
  onChange,
  onSubmit,
  isRunning,
}: DynamicInputFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {inputs.map((input) => {
        const commonProps = {
          name: input.name,
          required: input.required,
          description: input.description,
        };

        switch (input.type) {
          case "string":
            return (
              <StringInput
                key={input.name}
                {...commonProps}
                value={(values[input.name] ?? "") as string}
                onChange={(v) => onChange(input.name, v)}
              />
            );
          case "string[]":
            return (
              <StringArrayInput
                key={input.name}
                {...commonProps}
                value={(values[input.name] ?? []) as string[]}
                onChange={(v) => onChange(input.name, v)}
              />
            );
          case "number":
            return (
              <NumberInput
                key={input.name}
                {...commonProps}
                value={values[input.name] as number | undefined}
                onChange={(v) => onChange(input.name, v)}
              />
            );
          case "image":
            return (
              <ImageInput
                key={input.name}
                {...commonProps}
                value={(values[input.name] ?? "") as string}
                onChange={(v) => onChange(input.name, v)}
              />
            );
          default:
            return null;
        }
      })}
      <button
        type="submit"
        disabled={isRunning}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRunning ? "Running..." : "Run Workflow"}
      </button>
    </form>
  );
}

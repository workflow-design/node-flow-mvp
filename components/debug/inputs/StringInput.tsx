"use client";

interface StringInputProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  required: boolean;
  description?: string;
}

export function StringInput({
  name,
  value,
  onChange,
  required,
  description,
}: StringInputProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {name}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {description && (
        <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
      />
    </div>
  );
}

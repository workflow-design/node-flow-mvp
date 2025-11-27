"use client";

interface NumberInputProps {
  name: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  required: boolean;
  description?: string;
}

export function NumberInput({
  name,
  value,
  onChange,
  required,
  description,
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      onChange(undefined);
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

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
        type="number"
        value={value ?? ""}
        onChange={handleChange}
        required={required}
        step="any"
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
      />
    </div>
  );
}

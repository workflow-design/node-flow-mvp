"use client";

import { useState, type KeyboardEvent, type ClipboardEvent } from "react";

interface StringArrayInputProps {
  name: string;
  value: string[];
  onChange: (value: string[]) => void;
  required: boolean;
  description?: string;
}

const MAX_ITEMS = 20;

export function StringArrayInput({
  name,
  value,
  onChange,
  required,
  description,
}: StringArrayInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAddItem = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || value.length >= MAX_ITEMS) return;

    onChange([...value, trimmed]);
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasteText = e.clipboardData.getData("text");
    if (pasteText.includes("\n")) {
      e.preventDefault();
      const lines = pasteText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const availableSlots = MAX_ITEMS - value.length;
      const linesToAdd = lines.slice(0, availableSlots);

      if (linesToAdd.length > 0) {
        onChange([...value, ...linesToAdd]);
        setInputValue("");
      }
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = value.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleStartEdit = (index: number, itemValue: string) => {
    setEditingIndex(index);
    setEditValue(itemValue);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const trimmed = editValue.trim();
    if (trimmed) {
      const newItems = [...value];
      newItems[editingIndex] = trimmed;
      onChange(newItems);
    }
    setEditingIndex(null);
    setEditValue("");
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const isAtCapacity = value.length >= MAX_ITEMS;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {name}
        {required && <span className="ml-1 text-red-500">*</span>}
        <span className="ml-2 text-xs font-normal text-neutral-400">
          (list)
        </span>
      </label>
      {description && (
        <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      )}

      {/* Items list */}
      {value.length > 0 && (
        <ul className="mb-2 space-y-1">
          {value.map((item, index) => (
            <li
              key={index}
              className="group flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800"
            >
              {editingIndex === index ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={handleEditKeyDown}
                  className="flex-1 bg-transparent text-sm text-neutral-700 outline-none dark:text-neutral-300"
                  autoFocus
                />
              ) : (
                <span
                  className="flex-1 cursor-text truncate text-sm text-neutral-700 dark:text-neutral-300"
                  onClick={() => handleStartEdit(index, item)}
                >
                  {item}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="text-neutral-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-neutral-500 dark:hover:text-red-400"
                aria-label={`Remove ${item}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add item input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={isAtCapacity ? "Max items reached" : "Add item..."}
          disabled={isAtCapacity}
          className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
        />
        <button
          type="button"
          onClick={handleAddItem}
          disabled={!inputValue.trim() || isAtCapacity}
          className="rounded-lg bg-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
          aria-label="Add item"
        >
          +
        </button>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          Items: {value.length}/{MAX_ITEMS}
        </span>
        <span className="text-neutral-400">Press Enter or paste multi-line</span>
      </div>
    </div>
  );
}

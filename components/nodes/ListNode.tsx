"use client";

import { useCallback, useState, type KeyboardEvent, type ClipboardEvent } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import type { NodeProps } from "reactflow";
import type { ListNodeData } from "@/types/nodes";

const MAX_ITEMS = 10;

export function ListNode({ id, data }: NodeProps<ListNodeData>) {
  const { setNodes } = useReactFlow();
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const updateItems = useCallback(
    (items: string[]) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, items } } : node
        )
      );
    },
    [id, setNodes]
  );

  const handleAddItem = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || data.items.length >= MAX_ITEMS) return;

    updateItems([...data.items, trimmed]);
    setInputValue("");
  }, [inputValue, data.items, updateItems]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddItem();
      }
    },
    [handleAddItem]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      const pasteText = e.clipboardData.getData("text");
      if (pasteText.includes("\n")) {
        e.preventDefault();
        const lines = pasteText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        const availableSlots = MAX_ITEMS - data.items.length;
        const linesToAdd = lines.slice(0, availableSlots);

        if (linesToAdd.length > 0) {
          updateItems([...data.items, ...linesToAdd]);
          setInputValue("");
        }
      }
    },
    [data.items, updateItems]
  );

  const handleRemoveItem = useCallback(
    (index: number) => {
      const newItems = data.items.filter((_, i) => i !== index);
      updateItems(newItems);
    },
    [data.items, updateItems]
  );

  const handleStartEdit = useCallback((index: number, value: string) => {
    setEditingIndex(index);
    setEditValue(value);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingIndex === null) return;

    const trimmed = editValue.trim();
    if (trimmed) {
      const newItems = [...data.items];
      newItems[editingIndex] = trimmed;
      updateItems(newItems);
    }
    setEditingIndex(null);
    setEditValue("");
  }, [editingIndex, editValue, data.items, updateItems]);

  const handleEditKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === "Escape") {
        setEditingIndex(null);
        setEditValue("");
      }
    },
    [handleSaveEdit]
  );

  const isAtCapacity = data.items.length >= MAX_ITEMS;

  return (
    <div className="w-64 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {data.label}
        </span>
      </div>

      {/* Items list */}
      <div className="max-h-48 overflow-y-auto p-3">
        {data.items.length === 0 ? (
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            No items yet
          </p>
        ) : (
          <ul className="space-y-1">
            {data.items.map((item, index) => (
              <li
                key={index}
                className="group flex items-center gap-2 rounded border border-gray-100 bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
              >
                {editingIndex === index ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={handleEditKeyDown}
                    className="nodrag flex-1 bg-transparent text-xs text-gray-700 outline-none dark:text-gray-300"
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 cursor-text truncate text-xs text-gray-700 dark:text-gray-300"
                    onClick={() => handleStartEdit(index, item)}
                  >
                    {item}
                  </span>
                )}
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="nodrag text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-gray-500 dark:hover:text-red-400"
                  aria-label={`Remove ${item}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
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
      </div>

      {/* Add item input */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isAtCapacity ? "Max items reached" : "Add item..."}
            disabled={isAtCapacity}
            className="nodrag flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
          <button
            onClick={handleAddItem}
            disabled={!inputValue.trim() || isAtCapacity}
            className="nodrag rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
            aria-label="Add item"
          >
            +
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Items: {data.items.length}/{MAX_ITEMS}
          </span>
          {isAtCapacity && (
            <span className="text-amber-500 dark:text-amber-400">Max reached</span>
          )}
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-gray-300 !bg-white dark:!border-gray-600 dark:!bg-gray-800"
      />
    </div>
  );
}

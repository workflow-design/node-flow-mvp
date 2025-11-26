"use client";

import { useCallback, useRef, useState } from "react";

interface DropZoneProps {
  accept: string;
  onFile: (file: File) => void;
  label: string;
}

export function DropZone({ accept, onFile, label }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const isValid = acceptedTypes.some((type) => {
        if (type.endsWith("/*")) {
          const category = type.slice(0, -2);
          return file.type.startsWith(category);
        }
        return file.type === type;
      });

      if (!isValid) {
        setError(`Invalid file type. Expected ${accept}`);
        return false;
      }

      setError(null);
      return true;
    },
    [accept]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        onFile(file);
      }
    },
    [onFile, validateFile]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        onFile(file);
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onFile, validateFile]
  );

  return (
    <div
      className={`nodrag flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed transition-colors ${
        isDragOver
          ? "border-blue-500 bg-blue-500/10"
          : error
            ? "border-red-500 bg-red-500/10"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
      {error ? (
        <p className="px-2 text-center text-sm text-red-500">{error}</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drop {label} here
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            or click to browse
          </p>
        </>
      )}
    </div>
  );
}

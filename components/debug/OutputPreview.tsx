"use client";

interface OutputPreviewProps {
  outputs: Record<string, unknown>;
  runId: string;
}

function isImageUrl(url: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some((ext) => lowerUrl.includes(ext));
}

function isVideoUrl(url: string): boolean {
  const videoExtensions = [".mp4", ".webm", ".mov", ".avi"];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some((ext) => lowerUrl.includes(ext));
}

function MediaPreview({
  name,
  url,
  runId,
  mediaType,
}: {
  name: string;
  url: string;
  runId: string;
  mediaType?: string;
}) {
  const isImage = mediaType === "image" || (!mediaType && isImageUrl(url));
  const isVideo = mediaType === "video" || (!mediaType && isVideoUrl(url));
  const filename = `${name}-${runId.slice(0, 8)}${isImage ? ".png" : isVideo ? ".mp4" : ""}`;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.click();
  };

  if (isImage) {
    return (
      <div className="mb-3">
        <div className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {name}
        </div>
        <div className="group relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            className="max-h-64 rounded-lg border border-neutral-200 bg-neutral-100 object-contain dark:border-neutral-700 dark:bg-neutral-800"
          />
          <button
            onClick={handleDownload}
            className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            Download
          </button>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="mb-3">
        <div className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {name}
        </div>
        <div className="group relative">
          <video
            src={url}
            controls
            className="max-h-64 rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
          />
          <button
            onClick={handleDownload}
            className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            Download
          </button>
        </div>
      </div>
    );
  }

  // Non-media URL
  return (
    <div className="mb-2">
      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {name}:
      </span>{" "}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        {url.slice(0, 60)}{url.length > 60 ? "..." : ""}
      </a>
    </div>
  );
}

export function OutputPreview({ outputs, runId }: OutputPreviewProps) {
  return (
    <div className="space-y-2">
      {Object.entries(outputs).map(([key, value]) => {
        // Handle plain URL strings
        if (typeof value === "string" && value.startsWith("http")) {
          return <MediaPreview key={key} name={key} url={value} runId={runId} />;
        }

        // Handle {type, value} objects from Output nodes
        if (value && typeof value === "object" && "value" in value) {
          const obj = value as { type?: string; value: unknown };
          if (typeof obj.value === "string" && obj.value.startsWith("http")) {
            return (
              <MediaPreview
                key={key}
                name={key}
                url={obj.value}
                runId={runId}
                mediaType={obj.type}
              />
            );
          }
        }

        // Handle arrays (like string[])
        if (Array.isArray(value)) {
          return (
            <div key={key} className="mb-2">
              <div className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {key}
              </div>
              <ul className="space-y-1 rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
                {value.map((item, i) => (
                  <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300">
                    {String(item)}
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        // Fallback: show JSON
        return (
          <div key={key} className="mb-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {key}:
            </span>{" "}
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {JSON.stringify(value).slice(0, 100)}
              {JSON.stringify(value).length > 100 ? "..." : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

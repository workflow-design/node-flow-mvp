/**
 * Extract the first frame from a video URL as a data URL thumbnail.
 */
export async function extractVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("error", onError);
      video.src = "";
      video.load();
    };

    const onLoadedData = () => {
      // Seek to start and wait for frame to be ready
      video.currentTime = 0.1; // Seek slightly after start to ensure frame is rendered
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        cleanup();
        resolve(dataUrl);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    const onError = () => {
      cleanup();
      reject(new Error("Failed to load video"));
    };

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError);

    video.src = videoUrl;
    video.load();
  });
}

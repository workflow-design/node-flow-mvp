import JSZip from "jszip";
import { saveAs } from "file-saver";

type FileToDownload = {
  url: string;
  filename: string;
};

export async function downloadAsZip(files: FileToDownload[]): Promise<void> {
  if (files.length === 0) return;

  const zip = new JSZip();

  const fetchPromises = files.map(async ({ url, filename }) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}`);
      }
      const blob = await response.blob();
      zip.file(filename, blob);
    } catch (error) {
      console.error(`Failed to add ${filename} to zip:`, error);
    }
  });

  await Promise.all(fetchPromises);

  const content = await zip.generateAsync({ type: "blob" });
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
  saveAs(content, `batch_output_${timestamp}.zip`);
}

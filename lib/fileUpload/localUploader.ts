import type { FileUploader, FileUploadResult } from "../fileUpload";
import { saveFile, deleteFile } from "../fileStorage";

export const localUploader: FileUploader = {
  async upload(file: File): Promise<FileUploadResult> {
    const fileId = crypto.randomUUID();
    await saveFile(fileId, file);
    const url = URL.createObjectURL(file);
    return { fileId, url, source: "local" };
  },
  revoke(url: string): void {
    URL.revokeObjectURL(url);
  },
  async deleteFile(fileId: string): Promise<void> {
    await deleteFile(fileId);
  },
};

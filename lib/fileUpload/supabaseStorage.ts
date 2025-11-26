import type { FileStorage, FileUploadResult } from "../fileUpload";
import { supabase } from "../supabase";

const BUCKET_NAME = "media";

export const supabaseFileStorage: FileStorage = {
  async upload(file: File): Promise<FileUploadResult> {
    console.log("[Supabase Upload] Starting upload:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      bucket: BUCKET_NAME,
    });

    const fileId = crypto.randomUUID();
    const fileExt = file.name.split(".").pop();
    const fileName = `${fileId}.${fileExt}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[Supabase Upload] Upload failed:", {
        error: error.message,
        fileName,
      });
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    console.log("[Supabase Upload] Upload successful:", fileName);

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    return {
      fileId: fileName,
      url: publicUrl,
      source: "local",
    };
  },

  revoke(): void {
    // No-op for Supabase - URLs don't need revoking
  },

  async delete(fileId: string): Promise<void> {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileId]);

    if (error) {
      console.error("[Supabase Delete] Failed to delete file:", {
        fileId,
        error: error.message,
      });
    } else {
      console.log("[Supabase Delete] File deleted successfully:", fileId);
    }
  },
};

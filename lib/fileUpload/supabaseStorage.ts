import type { FileStorage, FileUploadResult } from "../fileUpload";
import { supabase } from "../supabase";

const BUCKET_NAME = "media";

export const supabaseFileStorage: FileStorage = {
  async upload(file: File): Promise<FileUploadResult> {
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
      throw new Error(`Failed to upload file: ${error.message}`);
    }

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
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileId]);

    if (error) {
      console.error("Failed to delete file from Supabase:", error);
    }
  },
};

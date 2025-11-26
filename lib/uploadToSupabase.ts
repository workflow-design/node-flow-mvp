import { supabase } from "./supabase";

const BUCKET_NAME = "media";

/**
 * Downloads media from an external URL and uploads it to Supabase Storage
 * @param url - The external URL to download from (e.g., Fal.ai CDN)
 * @param fileExtension - The file extension (e.g., 'png', 'mp4')
 * @returns The public URL of the uploaded file in Supabase
 */
export async function uploadToSupabase(
  url: string,
  fileExtension: string
): Promise<string> {
  // Download the file from the external URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file from ${url}: ${response.statusText}`);
  }

  const blob = await response.blob();
  const fileId = crypto.randomUUID();
  const fileName = `${fileId}.${fileExtension}`;

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, blob, {
      cacheControl: "3600",
      upsert: false,
      contentType: blob.type,
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

  return publicUrl;
}

export interface FileUploadResult {
  fileId: string;
  url: string;
  source: "local";
}

export interface FileUploader {
  upload(file: File): Promise<FileUploadResult>;
  revoke(url: string): void;
  deleteFile(fileId: string): Promise<void>;
}

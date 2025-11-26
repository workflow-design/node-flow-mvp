export interface FileUploadResult {
  fileId: string;
  url: string;
  source: "local";
}

export interface FileStorage {
  upload(file: File): Promise<FileUploadResult>;
  revoke(url: string): void;
  delete(fileId: string): Promise<void>;
}

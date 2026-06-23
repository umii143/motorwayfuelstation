export interface FileStorageProvider {
  uploadFile: (file: Blob, fileName: string) => Promise<string>;
  deleteFile: (fileName: string) => Promise<boolean>;
  getPublicUrl: (fileName: string) => Promise<string>;
}

export class LocalStorageProvider implements FileStorageProvider {
  async uploadFile(file: Blob, fileName: string): Promise<string> {
    // In local phase, we just generate an object URL for the Blob.
    // Note: Object URLs only live for the session duration in the browser.
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line no-console
    console.info(`[LocalStorageProvider] Generated local object URL for ${fileName}`);
    return url;
  }

  async deleteFile(fileName: string): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.info(`[LocalStorageProvider] Mock deleted ${fileName}`);
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPublicUrl(fileName: string): Promise<string> {
    // In local architecture, we cannot return a true public URL.
    // For now, this returns a placeholder or empty string
    return '';
  }
}

export class FileStorageService {
  private provider: FileStorageProvider;

  constructor(provider: FileStorageProvider) {
    this.provider = provider;
  }

  setProvider(provider: FileStorageProvider) {
    this.provider = provider;
  }

  async uploadFile(file: Blob, fileName: string): Promise<string> {
    return this.provider.uploadFile(file, fileName);
  }

  async deleteFile(fileName: string): Promise<boolean> {
    return this.provider.deleteFile(fileName);
  }

  async getPublicUrl(fileName: string): Promise<string> {
    return this.provider.getPublicUrl(fileName);
  }
}

// Export a singleton instance using LocalStorageProvider for the MVP
export const fileStorageService = new FileStorageService(new LocalStorageProvider());

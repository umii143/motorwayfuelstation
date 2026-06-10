import { Attachment } from '../../types';

export interface StorageProvider {
  /**
   * Uploads a file and returns an Attachment object.
   * @param file The file to upload (e.g. from an <input type="file" />)
   * @param uploadedBy The ID of the user uploading the file
   * @param documentType The logical type of the document (pdf, image, circular, letter)
   */
  uploadFile(file: File, uploadedBy: string, documentType: Attachment['type']): Promise<Attachment>;

  /**
   * Retrieves a URL to view or download the file.
   * @param attachment The attachment to get a URL for
   */
  getFileUrl(attachment: Attachment): Promise<string>;

  /**
   * Deletes a file from storage.
   * @param attachment The attachment to delete
   */
  deleteFile(attachment: Attachment): Promise<void>;
}

import { useState } from 'react';
import { generateWhatsAppLink, nativeWebShare } from '../utils/whatsappShare';
import { getWhatsAppTemplate, WhatsAppTemplateType } from '../utils/whatsappTemplates';
import { fileStorageService } from '../services/fileStorage.service';

export interface WhatsAppShareState {
  isOpen: boolean;
  documentType: WhatsAppTemplateType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documentData: any;
  pdfBlob?: Blob;
  pdfFileName?: string;
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDocument?: React.ReactElement<any, any>;
}

export const useWhatsAppShare = () => {
  const [shareState, setShareState] = useState<WhatsAppShareState>({
    isOpen: false,
    documentType: 'custom',
    documentData: { /* empty */ }
  });

  const openShareModal = (
    documentType: WhatsAppTemplateType, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    documentData: any, 
    pdfBlob?: Blob, 
    pdfFileName?: string,
     
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfDocument?: React.ReactElement<any, any>
  ) => {
    setShareState({
      isOpen: true,
      documentType,
      documentData,
      pdfBlob,
      pdfFileName,
      pdfDocument
    });
  };

  const closeShareModal = () => {
    setShareState(prev => ({ ...prev, isOpen: false }));
  };

  /**
   * Generates final text and handles the sharing action
   * depending on mobile native share vs desktop web url.
   */
  const executeShare = async (
    phone: string, 
    template: WhatsAppTemplateType, 
    format: 'text' | 'pdf' | 'both',
    isBusiness: boolean = false
  ) => {
    let pdfUrl = '';
    
    // In future this would await cloud storage upload.
    // Right now, if we need a public URL, we try to upload to local storage (which returns a blob url)
    if ((format === 'pdf' || format === 'both') && shareState.pdfBlob && shareState.pdfFileName) {
      pdfUrl = await fileStorageService.uploadFile(shareState.pdfBlob, shareState.pdfFileName);
    }

    const messageText = getWhatsAppTemplate(template, {
      ...shareState.documentData,
      pdfUrl: format !== 'text' ? pdfUrl : undefined
    });

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // If mobile, try using the native Web Share API which allows directly sending the physical PDF file
    if (isMobile && format !== 'text' && shareState.pdfBlob && shareState.pdfFileName) {
      const file = new File([shareState.pdfBlob], shareState.pdfFileName, { type: 'application/pdf' });
      const sharedNatively = await nativeWebShare('Share Document', messageText, undefined, [file]);
      if (sharedNatively) {
        closeShareModal();
        return;
      }
    }

    // Fallback: Desktop or Web Share unsupported
    // Auto download the PDF for desktop attachment
    if (!isMobile && format !== 'text' && shareState.pdfBlob && shareState.pdfFileName) {
      const objectUrl = URL.createObjectURL(shareState.pdfBlob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = shareState.pdfFileName;
      a.click();
      URL.revokeObjectURL(objectUrl);
    }

    // Open WhatsApp Web/App
    const link = generateWhatsAppLink(phone, messageText, isBusiness);
    window.open(link, '_blank');
    
    closeShareModal();
  };

  return {
    shareState,
    openShareModal,
    closeShareModal,
    executeShare
  };
};

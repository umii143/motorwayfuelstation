// src/services/communication/whatsappProvider.ts

export interface WhatsAppPayload {
  to: string;
  message: string;
  isBusiness?: boolean;
}

export class WhatsAppProvider {
  /**
   * Normalizes a phone number to standard format (e.g., Pakistani 923XXXXXXXXX)
   */
  static normalizePhone(phone: string): string {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('03')) {
      clean = '92' + clean.substring(1);
    } else if (clean.startsWith('3')) {
      clean = '92' + clean;
    }
    return clean;
  }

  static async send(payload: WhatsAppPayload): Promise<boolean> {
    try {
      const normalizedPhone = this.normalizePhone(payload.to);
      const encodedMessage = encodeURIComponent(payload.message);
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const protocol = payload.isBusiness ? 'whatsapp-business://' : (isMobile ? 'whatsapp://' : 'https://web.whatsapp.com/');
      
      let link = '';
      if (isMobile || payload.isBusiness) {
        link = `${protocol}send?phone=${normalizedPhone}&text=${encodedMessage}`;
      } else {
        link = `${protocol}send?phone=${normalizedPhone}&text=${encodedMessage}`;
      }
      
      window.open(link, '_blank');
      return true;
    } catch (err) {
      console.error('WhatsApp Provider Error:', err);
      return false;
    }
  }
}

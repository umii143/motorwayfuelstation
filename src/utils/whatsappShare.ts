/**
 * Normalizes Pakistan phone numbers to the format 923XXXXXXXXX
 * Validates length and prefixes.
 */
export const normalizePakistanPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const numericPhone = phone.replace(/\D/g, '');

  let normalized = numericPhone;

  // Handle formats: 03001234567 -> 923001234567
  if (normalized.startsWith('03') && normalized.length === 11) {
    normalized = '92' + normalized.substring(1);
  }
  // Handle formats: 3001234567 -> 923001234567
  else if (normalized.startsWith('3') && normalized.length === 10) {
    normalized = '92' + normalized;
  }
  // Handle formats: 9203001234567 -> reject/fix? The spec says reject 9203001234567, but let's strictly validate length below.

  // Validation Rules
  if (!normalized.startsWith('92')) {
    throw new Error('Invalid phone number: Must be a Pakistan number starting with 92 or 03');
  }

  if (normalized.length !== 12) {
    throw new Error('Invalid phone number: Must be exactly 12 digits (e.g. 923001234567)');
  }

  // Ensure it's a valid mobile prefix (3XX)
  if (normalized[2] !== '3') {
    throw new Error('Invalid phone number: Must be a valid Pakistan mobile network prefix (3XX)');
  }

  return normalized;
};

/**
 * Formats a normalized number for display: +92 300 1234567
 */
export const formatPhoneForDisplay = (phone: string): string => {
  try {
    const normalized = normalizePakistanPhoneNumber(phone);
    return `+${normalized.substring(0, 2)} ${normalized.substring(2, 5)} ${normalized.substring(5)}`;
  } catch (error) {
    // If it can't be normalized, just return original or formatted best-effort
    return phone;
  }
};

/**
 * Generates the WhatsApp share URL for web/desktop or mobile.
 */
export const generateWhatsAppLink = (phone: string, text: string, isBusiness: boolean = false): string => {
  try {
    const normalizedPhone = normalizePakistanPhoneNumber(phone);
    const encodedText = encodeURIComponent(text);
    
    // Web/Desktop
    if (isBusiness) {
      // WhatsApp Business API/Web link
      return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
    }
    
    return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
  } catch (error) {
    // Fallback if no valid phone (e.g., share to anyone)
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
};

/**
 * Trigger the native Web Share API on mobile devices if supported,
 * especially useful for sharing PDFs locally.
 */
export const nativeWebShare = async (title: string, text: string, url?: string, files?: File[]) => {
  if (navigator.share) {
    try {
      const shareData: ShareData = { title, text };
      if (url) shareData.url = url;
      if (files && files.length > 0) shareData.files = files;

      await navigator.share(shareData);
      return true;
    } catch (error) {
      console.error('Error sharing natively:', error);
      return false;
    }
  }
  return false;
};

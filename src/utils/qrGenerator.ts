import QRCode from 'qrcode';

export interface QRData {
  documentId?: string;
  invoiceNumber?: string;
  customer?: string;
  date?: string;
  amount?: number;
  verificationUrl?: string;
  type?: 'receipt' | 'invoice' | 'verification' | 'general';
}

/**
 * Generate a generic QR code data URL (base64 string) from any string payload.
 * Useful for embedding into PDF documents or printing.
 */
export const generateQRCode = async (payload: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H', // High error correction for thermal printers
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to generate QR code', err);
    return '';
  }
};

/**
 * Build a structured payload string based on Motorway Petroleum standards.
 */
const buildPayload = (data: QRData): string => {
  const payloadLines = [
    `MP-VERIFY:${data.type || 'general'}`,
    `ID:${data.documentId || data.invoiceNumber || 'N/A'}`,
    `DT:${data.date || new Date().toISOString()}`
  ];

  if (data.customer) {
    payloadLines.push(`CUST:${data.customer}`);
  }
  
  if (data.amount !== undefined) {
    payloadLines.push(`AMT:Rs.${data.amount.toFixed(2)}`);
  }

  if (data.verificationUrl) {
    payloadLines.push(`URL:${data.verificationUrl}`);
  }

  // Branding watermark in QR
  payloadLines.push('PWR:UmarAli');

  return payloadLines.join('|');
};

/**
 * Generate a QR code for a standard Customer Receipt
 */
export const generateReceiptQRCode = async (data: QRData): Promise<string> => {
  data.type = 'receipt';
  return await generateQRCode(buildPayload(data));
};

/**
 * Generate a QR code for a B2B Invoice (e.g. for Suppliers or corporate clients)
 */
export const generateInvoiceQRCode = async (data: QRData): Promise<string> => {
  data.type = 'invoice';
  return await generateQRCode(buildPayload(data));
};

/**
 * Generate a secure Digital Verification QR Code
 */
export const generateVerificationQRCode = async (data: QRData): Promise<string> => {
  data.type = 'verification';
  // If no URL is provided, generate a fallback mock link (in reality this would link to an online portal)
  if (!data.verificationUrl) {
    data.verificationUrl = `https://motorwaypetroleum.com/verify/${data.documentId || Date.now()}`;
  }
  return await generateQRCode(buildPayload(data));
};

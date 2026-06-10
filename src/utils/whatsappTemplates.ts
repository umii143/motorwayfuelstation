export type WhatsAppTemplateType = 'invoice' | 'ledger' | 'statement' | 'reminder' | 'custom';

interface TemplateParams {
  documentId?: string;
  amount?: string;
  date?: string;
  openingBalance?: string;
  closingBalance?: string;
  pdfUrl?: string;
}

export const getWhatsAppTemplate = (type: WhatsAppTemplateType, params: TemplateParams): string => {
  const footer = `\n\nMotorway Petroleum & CNG Station\nPowered by Umar Ali ⚡`;

  switch (type) {
    case 'invoice':
      return `Assalam-o-Alaikum,

Your invoice has been generated successfully.

Invoice Number: ${params.documentId || 'N/A'}
Amount: ${params.amount || 'N/A'} PKR
Date: ${params.date || new Date().toLocaleDateString()}

${params.pdfUrl ? `Download PDF:\n${params.pdfUrl}\n` : ''}
Thank you for choosing us.${footer}`;

    case 'ledger':
      return `Assalam-o-Alaikum,

Your account statement is attached.

Opening Balance: ${params.openingBalance || '0'} PKR
Closing Balance: ${params.closingBalance || '0'} PKR

${params.pdfUrl ? `Download PDF:\n${params.pdfUrl}\n` : ''}
Please contact us for any queries.${footer}`;

    case 'statement':
      return `Assalam-o-Alaikum,

Attached is your supplier ledger statement.

${params.pdfUrl ? `Download PDF:\n${params.pdfUrl}\n` : ''}
Please review the outstanding balance.${footer}`;

    case 'reminder':
      return `Friendly Payment Reminder

Dear Customer,

Your outstanding balance is pending.
Kindly clear your dues at your earliest convenience.

${params.pdfUrl ? `Download PDF:\n${params.pdfUrl}\n` : ''}
Thank you.${footer}`;

    case 'custom':
    default:
      return `${params.pdfUrl ? `Download PDF:\n${params.pdfUrl}\n` : ''}${footer}`;
  }
};

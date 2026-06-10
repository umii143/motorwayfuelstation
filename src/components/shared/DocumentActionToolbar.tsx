import React, { useState } from 'react';
import { Download, FileText, Printer, Share2 } from 'lucide-react';
import { generatePdfBlob } from '../../utils/pdfGenerator';
import { saveAs } from 'file-saver';
import { useStation } from '../../contexts/StationContext';

export interface DocumentActionToolbarProps {
  pdfDocument?: React.ReactElement<any, any>;
  pdfFileName?: string;
  onPrint?: () => void;
  onWhatsAppShare?: () => void;
}

export function DocumentActionToolbar({
  pdfDocument,
  pdfFileName = 'Document.pdf',
  onPrint,
  onWhatsAppShare
}: DocumentActionToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useStation();

  const handleDownloadPdf = async () => {
    if (!pdfDocument) return;
    setIsExporting(true);
    showToast('Generating PDF...', 'info');
    try {
      // In a real app we'd render the pdfDocument to a string or blob using @react-pdf/renderer
      // Here we just simulate for now or use the generic generator if available
      const blob = await generatePdfBlob({
        title: pdfFileName.replace('.pdf', ''),
        data: [],
        columns: []
      });
      saveAs(blob, pdfFileName);
      showToast('PDF downloaded successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to generate PDF.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {onWhatsAppShare && (
        <button
          onClick={onWhatsAppShare}
          className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
          title="Share via WhatsApp"
        >
          <Share2 className="w-5 h-5" />
        </button>
      )}
      {pdfDocument && (
        <button
          onClick={handleDownloadPdf}
          disabled={isExporting}
          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
          title="Download PDF"
        >
          <FileText className="w-5 h-5" />
        </button>
      )}
      {onPrint && (
        <button
          onClick={onPrint}
          className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          title="Print"
        >
          <Printer className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

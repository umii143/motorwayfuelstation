import React, { useState } from 'react';
import { Download, FileText, Printer, FileSpreadsheet, Share2, X } from 'lucide-react';
import { useStation } from '../../contexts/StationContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { generateReceiptQRCode } from '../../utils/qrGenerator';
import { generatePdfBlob } from '../../utils/pdfGenerator';

interface ExportToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  columns: { key: string; label: string; urduLabel?: string }[];
  title: string;
  filenamePrefix: string;
}

export function ExportToolbar({ isOpen, onClose, data, columns, title, filenamePrefix }: ExportToolbarProps) {
  const { settings, showToast } = useStation();
  const isUrdu = settings.language === 'ur';

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const exportData = data.map(item => {
        const row: any = {};
        columns.forEach(col => {
          row[isUrdu && col.urduLabel ? col.urduLabel : col.label] = item[col.key] ?? '';
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      saveAs(blob, `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Excel file generated successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to export Excel file.', 'error');
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  const handleWhatsApp = async () => {
    try {
      // Build text summary
      let text = `*${title} - Motorway Petroleum*\n`;
      text += `Date: ${new Date().toLocaleDateString()}\n\n`;
      
      // Limit to 20 rows for WhatsApp to avoid huge messages
      const limit = Math.min(data.length, 20);
      for (let i = 0; i < limit; i++) {
        const item = data[i];
        text += `- ${columns[0].label}: ${item[columns[0].key]} | ${columns[1]?.label}: ${item[columns[1]?.key]}\n`;
      }
      
      if (data.length > 20) {
        text += `\n...and ${data.length - 20} more records.\n`;
      }
      
      text += `\nPowered by Umar Ali ⚡`;
      
      const encodedText = encodeURIComponent(text);
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    // In a real implementation we would render a hidden print template component using react-to-print
    // Here we will trigger browser print for simplicity until the full PDF renderer is attached
    window.print();
    onClose();
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    showToast('Generating PDF Report...', 'info');
    try {
      const blob = await generatePdfBlob({
        title,
        data,
        columns
      });
      saveAs(blob, `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('PDF generated successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to generate PDF.', 'error');
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="font-sans text-sm font-bold text-slate-900 flex items-center gap-2">
            <Download className="h-5 w-5 text-indigo-600" />
            <span>{isUrdu ? 'ڈیٹا ایکسپورٹ کریں' : 'Export Data'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-xl">&times;</button>
        </div>

        <p className="text-xs text-slate-500 mb-5 font-sans">
          {isUrdu 
            ? 'ڈیٹا نکالنے کے لیے مطلوبہ فارمیٹ کا انتخاب کریں:' 
            : 'Select the desired format to export your data:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportPDF}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer"
          >
            <FileText className="h-6 w-6 text-red-600" />
            <span className="font-bold text-xs text-red-700">PDF Report</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 hover:bg-green-100 hover:border-green-300 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
            <span className="font-bold text-xs text-green-700">Excel (XLSX)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <Printer className="h-6 w-6 text-slate-600" />
            <span className="font-bold text-xs text-slate-700">Print / Thermal</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 hover:bg-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer"
          >
            <Share2 className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-xs text-emerald-700">WhatsApp</span>
          </button>
        </div>
        
        <div className="mt-5 text-center">
          <span className="text-[10px] text-slate-400 font-mono">Powered by Umar Ali ⚡</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { X, ScanLine, FileText, AlertTriangle, Sparkles, Image as ImageIcon } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';
import { GlobalSettings } from '../../types';
import { t as translate } from '../../lib/translations';
import { logger } from '../../lib/logger';

interface AIDocumentScannerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobalSettings;
  onDataExtracted?: (data: unknown) => void;
  extractionPrompt?: string;
}

export default function AIDocumentScanner({ isOpen, onClose, settings, onDataExtracted, extractionPrompt }: AIDocumentScannerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (en: string, ur: string) => translate(en, ur, settings);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('Please select a valid image file.', 'براہ کرم درست تصویری فائل منتخب کریں۔'));
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setExtractedData(null);
  };

  const handleScan = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const response = await fetchWithAuth('/api/ai-vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt: extractionPrompt || 'You are an expert fuel station accounting assistant. Extract the following information from this receipt/invoice image: Date, Time, Receipt/Invoice Number, Supplier/Customer Name, Product Details, Quantity, Rate, Amount, Taxes, and Payment Method. Format the response as a clear, readable list.',
            imageBase64: base64String,
            language: settings.language
          })
        });

        if (!response.ok) {
          throw new Error('Failed to process image');
        }

        const data = await response.json();
        
        if (extractionPrompt && onDataExtracted) {
          try {
            // Try to parse JSON from the response (in case it's wrapped in markdown)
            const jsonMatch = data.reply.match(/```json\n([\s\S]*?)\n```/) || data.reply.match(/```\n([\s\S]*?)\n```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : data.reply;
            const parsed = JSON.parse(jsonStr);
            onDataExtracted(parsed);
            setExtractedData("Data successfully extracted and auto-filled!");
          } catch (e) {
            logger.error("Failed to parse JSON response:", e);
            setExtractedData(data.reply);
          }
        } else {
          setExtractedData(data.reply);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: unknown) {
      logger.error(err);
      setError(t('Failed to extract data. Please try again.', 'ڈیٹا نکالنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔'));
    } finally {
      setIsScanning(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setExtractedData(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/20 p-2">
              <ScanLine className="h-5 w-5 text-indigo-50" />
            </div>
            <div>
              <h3 className="font-sans text-lg font-bold">
                {t('Intelligent Document Scanner', 'انٹیلجنٹ ڈاکیومنٹ سکینر')}
              </h3>
              <p className="font-sans text-xs text-indigo-200">
                {t('Upload fuel receipts, shift slips, or invoices to extract data instantly using AI.', 'AI کے ذریعے رسیدوں اور انوائسز سے ڈیٹا نکالیں۔')}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-xl p-2 hover:bg-white/20 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col md:flex-row gap-6">
          
          {/* Left Side: Upload & Preview */}
          <div className="flex-1 flex flex-col gap-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                previewUrl 
                  ? 'border-indigo-500 bg-indigo-50/30' 
                  : 'border-slate-300 bg-slate-100 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*" 
                className="hidden" 
              />
              
              {previewUrl ? (
                <img src={previewUrl} alt="Document Preview" className="h-full w-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-500 p-6 text-center">
                  <div className="rounded-full bg-white p-4 shadow-xs">
                    <ImageIcon className="h-8 w-8 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-bold text-slate-700">
                      {t('Click to upload image', 'تصویر اپ لوڈ کرنے کے لیے کلک کریں')}
                    </p>
                    <p className="font-sans text-xs mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2 border border-red-100">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              {previewUrl && !isScanning && !extractedData && (
                <button
                  onClick={handleScan}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-sans text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  {t('Extract Data with AI', 'ڈیٹا نکالیں')}
                </button>
              )}
              {previewUrl && (
                <button
                  onClick={reset}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-sans text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  {t('Clear', 'صاف کریں')}
                </button>
              )}
            </div>
          </div>

          {/* Right Side: Results */}
          <div className="flex-1 flex flex-col">
            <h4 className="font-sans text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" />
              {t('Extracted Information', 'نکالی گئی معلومات')}
            </h4>
            
            <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs relative">
              {isScanning ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 rounded-2xl">
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                    <ScanLine className="absolute inset-0 m-auto h-6 w-6 text-indigo-600 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="font-sans font-bold text-slate-800">{t('Analyzing Document...', 'دستاویز کا تجزیہ جاری ہے...')}</p>
                    <p className="font-sans text-xs text-slate-500 mt-1">{t('Gemini Vision is extracting data fields', 'جیمنی ویژن ڈیٹا نکال رہا ہے')}</p>
                  </div>
                </div>
              ) : extractedData ? (
                <div className="h-full overflow-y-auto pr-2">
                  <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
                    {extractedData}
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                  <ScanLine className="h-12 w-12 opacity-20 mb-3" />
                  <p className="font-sans text-sm font-medium">
                    {t('Upload an image and scan to see results here', 'نتائج دیکھنے کے لیے تصویر اپ لوڈ کر کے سکین کریں')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

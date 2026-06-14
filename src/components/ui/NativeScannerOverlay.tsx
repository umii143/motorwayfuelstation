import React, { useEffect, useState } from 'react';
import { X, Flashlight, ScanLine, Smartphone } from 'lucide-react';
import { NativeBarcodeScanner } from '../../services/hardware/BarcodeScanner';
import { BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

interface NativeScannerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (result: string) => void;
  title?: string;
  formats?: BarcodeFormat[];
}

export const NativeScannerOverlay: React.FC<NativeScannerOverlayProps> = ({ 
  isOpen, 
  onClose, 
  onScanResult,
  title = "Scan Barcode / QR Code",
  formats = [BarcodeFormat.QrCode, BarcodeFormat.Ean13, BarcodeFormat.Code128]
}) => {
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (Capacitor.isNativePlatform()) {
        document.body.style.background = 'transparent';
        document.documentElement.style.background = 'transparent';
      }
      
      startScanning();
    } else {
      if (Capacitor.isNativePlatform()) {
        document.body.style.background = '';
        document.documentElement.style.background = '';
      }
      NativeBarcodeScanner.stopScan();
    }

    return () => {
      NativeBarcodeScanner.stopScan();
      if (Capacitor.isNativePlatform()) {
        document.body.style.background = '';
        document.documentElement.style.background = '';
      }
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      const result = await NativeBarcodeScanner.startScan(formats);
      if (result) {
        onScanResult(result);
        onClose(); // Automatically close after successful scan
      }
    } catch (error) {
      console.error("Scanner failed to start", error);
      alert("Failed to start scanner. Please ensure camera permissions are granted.");
      onClose();
    }
  };

  const toggleTorch = async () => {
    await NativeBarcodeScanner.toggleTorch();
    setTorchOn(!torchOn);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col pointer-events-auto">
      {/* 
        This transparent overlay is necessary so the webview doesn't block the native camera view 
        which is rendered UNDERNEATH the webview by Capacitor. 
      */}
      <div className="absolute inset-0 bg-transparent" />
      
      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md pt-safe">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/20 p-2 rounded-lg border border-orange-500/50">
            <ScanLine className="w-5 h-5 text-orange-400" />
          </div>
          <h2 className="text-white font-sans font-bold">{title}</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={toggleTorch}
            className={`p-3 rounded-full transition-colors ${torchOn ? 'bg-yellow-400 text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            <Flashlight className="w-5 h-5" />
          </button>
          <button 
            onClick={onClose}
            className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Viewfinder Target */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center">
        {/* Dark overlay around the scan area */}
        <div className="absolute inset-0 border-[rgba(0,0,0,0.6)] border-x-[40px] border-y-[150px] md:border-x-[150px] pointer-events-none" />
        
        {/* Targeting Reticle */}
        <div className="relative w-full h-full max-w-[300px] max-h-[300px] border-2 border-white/20 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-orange-500 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-orange-500 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-orange-500 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-orange-500 rounded-br-xl" />
          
          {/* Scanning animation line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500 shadow-[0_0_15px_3px_#f97316] animate-[scan_2s_ease-in-out_infinite]" />
        </div>

        <div className="absolute bottom-16 flex flex-col items-center gap-2">
          <Smartphone className="w-8 h-8 text-white/50 animate-pulse" />
          <p className="text-white/80 font-sans font-medium text-sm text-center px-8">
            Point your camera at a barcode or QR code to scan it instantly.
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

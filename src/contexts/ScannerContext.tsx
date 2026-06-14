import React, { createContext, useContext, useState, useCallback } from 'react';
import { NativeScannerOverlay } from '../components/ui/NativeScannerOverlay';
import { NativeHaptics } from '../services/hardware/Haptics';
import { BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';

interface ScannerContextType {
  scanBarcode: (options?: { formats?: BarcodeFormat[], title?: string }) => Promise<string | null>;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export const ScannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scanConfig, setScanConfig] = useState<{ formats?: BarcodeFormat[], title?: string }>({});
  const [resolver, setResolver] = useState<(value: string | null) => void>(() => () => {});

  const scanBarcode = useCallback((options?: { formats?: BarcodeFormat[], title?: string }) => {
    return new Promise<string | null>((resolve) => {
      setScanConfig(options || {});
      setResolver(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    resolver(null);
  };

  const handleScanResult = async (result: string) => {
    await NativeHaptics.success();
    setIsOpen(false);
    resolver(result);
  };

  return (
    <ScannerContext.Provider value={{ scanBarcode }}>
      {children}
      <NativeScannerOverlay 
        isOpen={isOpen} 
        onClose={handleClose} 
        onScanResult={handleScanResult} 
        formats={scanConfig.formats}
        title={scanConfig.title}
      />
    </ScannerContext.Provider>
  );
};

export const useScanner = () => {
  const context = useContext(ScannerContext);
  if (!context) {
    throw new Error('useScanner must be used within a ScannerProvider');
  }
  return context;
};

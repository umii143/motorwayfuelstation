import React from 'react';
import { NativeFeedbackProvider } from '../components/providers/NativeFeedbackProvider';
import { AuthProvider } from '../contexts/AuthContext';
import { NativeAuthProvider } from '../contexts/NativeAuthContext';
import { ScannerProvider } from '../contexts/ScannerContext';
import { StationProvider } from '../contexts/StationContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <NativeFeedbackProvider>
      <AuthProvider>
        <NativeAuthProvider>
          <ScannerProvider>
            {children}
          </ScannerProvider>
        </NativeAuthProvider>
      </AuthProvider>
    </NativeFeedbackProvider>
  );
}

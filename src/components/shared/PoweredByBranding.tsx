import React from 'react';
import { PoweredByUmarAli } from './PoweredByUmarAli';

interface BrandingProps {
  variant?: 'full' | 'compact' | 'receipt' | 'footer';
  className?: string;
}

export function PoweredByBranding({ variant = 'compact', className = '' }: BrandingProps) {
  const mappedVariant = variant === 'footer' ? 'compact' : variant;
  return <PoweredByUmarAli variant={mappedVariant} className={className} />;
}

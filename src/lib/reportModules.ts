/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise v4.0 — Report Intelligence Layers
 *
 * 15 Enterprise Intelligence Layers containing Certified Enterprise Reports.
 * Every report is a read-only view over live Firebase operational data.
 * Zero dummy records. Zero mock statistics. Zero placeholder values.
 *
 * Architecture: Registry → reportModules → AdvancedReportsHub → ReportCompilers → Firebase
 */

import {
  Crown,
  Fuel,
  Droplets,
  DollarSign,
  Building,
  Truck,
  Users,
  Award,
  ShieldAlert,
  Sparkles,
  Layers,
  TrendingUp,
  Scale,
  Eye,
  History
} from 'lucide-react';

import { getAllLayers, getReportsByLayer, IntelligenceLayerDef, EnterpriseReportManifest } from './reports/registry';

export interface ReportDefinition {
  id: string;
  name: string;
  desc: string;
  tags: string[];
  relatedReports?: string[];
  manifest: EnterpriseReportManifest; // Injecting the enterprise manifest
}

export interface ReportModule {
  id: string;
  icon: any; // Mapped dynamically
  name: string;
  layerNumber: number;
  emoji: string;
  reports: ReportDefinition[];
}

const iconMap: Record<string, any> = {
  Crown,
  Fuel,
  Droplets,
  DollarSign,
  Building,
  Users,
  Truck,
  Award,
  ShieldAlert,
  Sparkles,
  Layers,
  TrendingUp,
  Scale,
  Eye,
  History
};

// Dynamically generate the REPORT_MODULES from the registries
export const REPORT_MODULES: ReportModule[] = getAllLayers().map((layer: IntelligenceLayerDef) => {
  const layerReports = getReportsByLayer(layer.id);
  
  return {
    id: layer.id,
    icon: iconMap[layer.iconName] || History,
    name: layer.name,
    layerNumber: layer.layerNumber,
    emoji: layer.emoji,
    reports: layerReports.map(r => ({
      id: r.id,
      name: r.title,
      desc: r.description,
      tags: r.tags || [],
      relatedReports: r.relatedReports || [],
      manifest: r
    }))
  };
});

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — Navigation Tree
 *
 * Intelligence Layer navigation tree populated from LayerRegistry.
 * Phase 1: Shows layers only, no reports.
 */

import React from 'react';
import {
  Crown,
  Fuel,
  Droplets,
  DollarSign,
  Building,
  Users,
  Truck,
  Award,
  ShieldAlert,
  TrendingUp,
  Eye,
  Layers,
  Scale,
  Sparkles
} from 'lucide-react';
import type { IntelligenceLayerDefinition, IntelligenceLayerId } from '../../../lib/reports-v2';
import { LayerRegistry, ManifestRegistry } from '../../../lib/reports-v2';

interface NavigationTreeProps {
  selectedLayerId: IntelligenceLayerId | null;
  onLayerSelect: (layerId: IntelligenceLayerId) => void;
  language: 'en' | 'ur';
  isCollapsed: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Crown,
  Fuel,
  Droplets,
  DollarSign,
  Building,
  Users,
  Truck,
  Award,
  ShieldAlert,
  TrendingUp,
  Eye,
  Layers,
  Scale,
  Sparkles
};

export default function NavigationTree({
  selectedLayerId,
  onLayerSelect,
  language,
  isCollapsed
}: NavigationTreeProps) {
  const isEn = language === 'en';
  const layers = LayerRegistry.getEnabledLayers();

  if (isCollapsed) {
    return (
      <div
        style={{
          width: 56,
          borderRight: '1px solid var(--border-main)',
          backgroundColor: 'var(--bg-card)',
          padding: '8px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto',
          flexShrink: 0
        }}
      >
        {layers.map(layer => {
          const Icon = ICON_MAP[layer.iconName] || Layers;
          const isActive = selectedLayerId === layer.id;
          const reportCount = ManifestRegistry.getByLayer(layer.id).length;

          return (
            <button
              key={layer.id}
              onClick={() => onLayerSelect(layer.id)}
              title={isEn ? layer.nameEn : layer.nameUr}
              style={{
                padding: '10px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
                color: isActive ? 'var(--primary-accent)' : 'var(--text-muted)',
                borderLeft: isActive ? '3px solid var(--primary-accent)' : '3px solid transparent',
                transition: 'all 0.15s',
                position: 'relative',
                minHeight: 40,
                minWidth: 40
              }}
            >
              <Icon size={18} />
              {reportCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 6,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-accent)',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {reportCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        width: 260,
        borderRight: '1px solid var(--border-main)',
        backgroundColor: 'var(--bg-card)',
        padding: '12px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'auto',
        flexShrink: 0
      }}
    >
      {/* Section Header */}
      <div
        style={{
          padding: '4px 16px 12px',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        {isEn ? 'Intelligence Layers' : 'انٹیلیجنس لیئرز'}
      </div>

      {layers.map(layer => {
        const Icon = ICON_MAP[layer.iconName] || Layers;
        const isActive = selectedLayerId === layer.id;
        const reportCount = ManifestRegistry.getByLayer(layer.id).length;

        return (
          <button
            key={layer.id}
            onClick={() => onLayerSelect(layer.id)}
            style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
              color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
              borderLeft: isActive ? '3px solid var(--primary-accent)' : '3px solid transparent',
              transition: 'all 0.15s',
              textAlign: 'left',
              width: '100%',
              minHeight: 40,
              minWidth: 'auto'
            }}
          >
            <Icon
              size={16}
              style={{
                color: isActive ? 'var(--primary-accent)' : 'var(--text-muted)',
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {layer.emoji} {isEn ? layer.nameEn : layer.nameUr}
              </div>
            </div>
            {reportCount > 0 && (
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: 'rgba(var(--color-accent), 0.1)',
                  color: 'var(--color-accent)',
                  border: '1px solid var(--border-main)',
                  flexShrink: 0
                }}
              >
                {reportCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

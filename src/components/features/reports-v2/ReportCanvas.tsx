/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — Report Canvas
 *
 * Empty report canvas for Phase 1.
 * Professional empty state — no dummy data, no fake charts, no placeholder KPIs.
 *
 * "No verified operational records found. Start creating transactions to generate realtime analytics."
 */

import React from 'react';
import { FileText, Layers, ArrowRight } from 'lucide-react';
import type { IntelligenceLayerId } from '../../../lib/reports-v2';
import { LayerRegistry } from '../../../lib/reports-v2';

interface ReportCanvasProps {
  selectedLayerId: IntelligenceLayerId | null;
  language: 'en' | 'ur';
}

export default function ReportCanvas({
  selectedLayerId,
  language
}: ReportCanvasProps) {
  const isEn = language === 'en';
  const selectedLayer = selectedLayerId ? LayerRegistry.getLayer(selectedLayerId) : null;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: 'var(--bg-app)',
        minHeight: 400
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: 480
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}
        >
          {selectedLayer
            ? <Layers size={32} style={{ color: 'var(--text-muted)' }} />
            : <FileText size={32} style={{ color: 'var(--text-muted)' }} />
          }
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-main)',
            margin: '0 0 8px'
          }}
        >
          {selectedLayer
            ? (isEn
              ? `${selectedLayer.emoji} ${selectedLayer.nameEn}`
              : `${selectedLayer.emoji} ${selectedLayer.nameUr}`)
            : (isEn
              ? 'Enterprise Reports Workspace'
              : 'انٹرپرائز رپورٹس ورک اسپیس')
          }
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-muted)',
            margin: '0 0 24px',
            lineHeight: 1.6
          }}
        >
          {selectedLayer
            ? (isEn
              ? selectedLayer.descriptionEn
              : selectedLayer.descriptionUr)
            : (isEn
              ? 'Select an Intelligence Layer from the navigation to begin. Reports will be populated in Phase 2 after the enterprise architecture is certified.'
              : 'رپورٹیں دیکھنے کے لیے نیویگیشن سے انٹیلیجنس لیئر منتخب کریں۔ فیز 2 میں رپورٹیں شامل کی جائیں گی۔')
          }
        </p>

        {/* Status */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 12,
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-main)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-muted)'
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--color-success)'
            }}
          />
          {isEn
            ? 'Infrastructure Ready • Phase 1 Active'
            : 'انفراسٹرکچر تیار • فیز 1 فعال'}
          <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
}

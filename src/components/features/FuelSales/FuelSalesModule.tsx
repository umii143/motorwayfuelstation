import React, { useState } from 'react';
import { useStationStore } from '../../../stores/useStationStore';
import { FuelSalesKPIs } from './components/FuelSalesKPIs';
import { FuelSalesRegister } from './components/FuelSalesRegister';

export function FuelSalesModule() {
  const language = useStationStore((state) => state.settings?.language) || 'ur';
  const [productFilter, setProductFilter] = useState('ALL');

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', background: 'var(--bg-main)' }}>
      
      {/* Enterprise Header with Quick Actions (Rule #129) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 32,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>⛽</span>
            {language === 'en' ? 'Fuel Sales Operating System' : 'فیول سیلز آپریٹنگ سسٹم'}
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {language === 'en' ? 'Manage live sales, shifts, test measures, and dispensing history.' : 'لائیو سیلز، شفٹس، ٹیسٹ میژر، اور ڈسپنسنگ ہسٹری کا انتظام کریں۔'}
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => alert('New Sale Modal (Coming Soon)')}
            style={{ 
              padding: '10px 20px', background: 'var(--color-primary)', color: 'white', 
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
          >
            {language === 'en' ? '+ New Sale' : '+ نئی سیل شامل کریں'}
          </button>
          
          <button 
            onClick={() => alert('Shift Close Drawer (Coming Soon)')}
            style={{ 
              padding: '10px 20px', background: 'var(--bg-card)', color: 'var(--text-main)', 
              border: '1px solid var(--border-main)', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            {language === 'en' ? '+ Shift Close' : '+ شفٹ کلوز کریں'}
          </button>
          
          <button 
            onClick={() => alert('Test Measure Modal (Coming Soon)')}
            style={{ 
              padding: '10px 20px', background: 'var(--bg-card)', color: '#d97706', 
              border: '1px dashed #d97706', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            {language === 'en' ? '+ Test Measure' : '+ ٹیسٹ لیٹر'}
          </button>
        </div>
      </div>

      {/* Domain-Specific KPIs (Rule #128) */}
      <FuelSalesKPIs onOpenRegister={(filter) => setProductFilter(filter)} />

      {/* Filter Reset if active */}
      {productFilter !== 'ALL' && (
        <div style={{ 
          marginBottom: 16, padding: '12px 24px', background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8, color: '#059669',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontWeight: 600 }}>
            {language === 'en' ? `Filtered By: ${productFilter}` : `مخصوص فلٹر: ${productFilter}`}
          </span>
          <button 
            onClick={() => setProductFilter('ALL')}
            style={{ background: 'transparent', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            {language === 'en' ? 'Clear Filter' : 'فلٹر ختم کریں'}
          </button>
        </div>
      )}

      {/* Domain-Specific Register (Rule #128) */}
      <FuelSalesRegister productFilter={productFilter} />

    </div>
  );
}

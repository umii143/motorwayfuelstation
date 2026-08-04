import React, { useMemo, useState } from 'react';
import { useInventoryStore } from '../../../../stores/useInventoryStore';
import { useStationStore } from '../../../../stores/useStationStore';
import { db } from '../../../../data/db';

interface FuelSalesRegisterProps {
  productFilter?: string; // 'ALL', 'PETROL', 'DIESEL', 'CREDIT'
}

export function FuelSalesRegister({ productFilter = 'ALL' }: FuelSalesRegisterProps) {
  const language = useStationStore((state) => state.settings?.language) || 'ur';
  const activeStationId = useStationStore((state) => state.activeStationId) || 'st_default';
  
  // Live Data
  const storeStockTxns = useInventoryStore((state) => state.stockTxns || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const salesEntries = useMemo(() => {
    // Rule #127: 100% Live Database
    const liveTxns = storeStockTxns.length > 0 ? storeStockTxns : db.getStockTransactions(activeStationId);

    const rows: Array<{
      id: string;
      date: string;
      shiftId: string;
      pump: string;
      nozzle: string;
      product: string;
      productType: 'petrol' | 'diesel' | 'cng' | 'lube';
      liters: number;
      rate: number;
      amount: number;
      paymentMode: string;
    }> = [];

    // Filter to sales only
    const salesTxns = liveTxns.filter(tx => tx.type === 'sale' || tx.type === 'dispense');

    const now = new Date();
    
    salesTxns.forEach((tx) => {
      const txDate = new Date(tx.date);
      
      // Date Filter
      if (datePreset === 'today') {
        const todayStr = now.toDateString();
        if (txDate.toDateString() !== todayStr) return;
      } else if (datePreset === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        if (txDate < weekAgo) return;
      } else if (datePreset === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 86400000);
        if (txDate < monthAgo) return;
      }

      const pType = (tx.fuelType || 'petrol').toLowerCase();
      let pName = 'پٹرول';
      let prodEnum: 'petrol' | 'diesel' | 'cng' | 'lube' = 'petrol';

      if (pType.includes('diesel')) {
        pName = 'ڈیزل';
        prodEnum = 'diesel';
      } else if (pType.includes('cng')) {
        pName = 'سی این جی';
        prodEnum = 'cng';
      } else if (pType.includes('lube')) {
        pName = 'لوبی';
        prodEnum = 'lube';
      }

      // Handle specific filters from the KPI cards
      if (productFilter === 'PETROL' && prodEnum !== 'petrol') return;
      if (productFilter === 'DIESEL' && prodEnum !== 'diesel') return;
      if (productFilter === 'CREDIT' && tx.paymentMode !== 'credit') return;

      const dateStr = new Date(tx.date).toLocaleDateString('ur-PK', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const liters = tx.quantity || 0;
      const rate = tx.sellingPrice || 270;
      const amount = tx.amount || (liters * rate);

      // Search Filter
      const searchMatch = !searchTerm || 
        pName.includes(searchTerm) || 
        (tx.paymentMode || '').includes(searchTerm) || 
        dateStr.includes(searchTerm) || 
        (tx.id || '').includes(searchTerm);
      
      if (!searchMatch) return;

      rows.push({
        id: tx.id || Math.random().toString(36).substr(2, 9),
        date: dateStr,
        shiftId: tx.shiftId || 'آٹو شفٹ',
        pump: tx.pumpId || 'P-1',
        nozzle: tx.nozzleId || 'N-1',
        product: pName,
        productType: prodEnum,
        liters,
        rate,
        amount,
        paymentMode: tx.paymentMode || 'cash'
      });
    });

    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [storeStockTxns, activeStationId, productFilter, searchTerm, datePreset]);

  // Aggregate Totals
  const totalLiters = salesEntries.reduce((acc, row) => acc + row.liters, 0);
  const totalAmount = salesEntries.reduce((acc, row) => acc + row.amount, 0);

  // Smart Empty State (Rule #127)
  if (salesEntries.length === 0 && !searchTerm) {
    return (
      <div style={{ padding: 64, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 8, border: '1px dashed var(--border-main)', marginTop: 24 }}>
        <span style={{ fontSize: 48, opacity: 0.5 }}>⛽</span>
        <h2 style={{ color: 'var(--text-main)', marginTop: 16 }}>
          {language === 'en' ? 'No Sales Recorded Yet' : 'کوئی سیل ریکارڈ نہیں ہوئی'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          {language === 'en' ? 'Start a new shift or record a manual sale to see the live register.' : 'نئی شفٹ شروع کریں یا مینوئل سیل درج کریں تاکہ لائیو رجسٹر اپڈیٹ ہو۔'}
        </p>
        <button style={{
          padding: '12px 24px', background: 'var(--color-primary)', color: 'white',
          border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', fontWeight: 'bold'
        }}>
          {language === 'en' ? '+ Create First Sale' : '+ پہلی سیل درج کریں'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-main)', overflow: 'hidden' }}>
      
      {/* Table Header Controls */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          📋 {language === 'en' ? 'Fuel Sales Ledger' : 'فیول سیلز رجسٹر'}
        </h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select 
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as any)}
            style={{ 
              padding: '8px 16px', borderRadius: 20, border: '1px solid var(--border-main)', 
              background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' 
            }}
          >
            <option value="all">{language === 'en' ? 'All Time' : 'کل وقت'}</option>
            <option value="today">{language === 'en' ? 'Today' : 'آج'}</option>
            <option value="week">{language === 'en' ? 'This Week' : 'اس ہفتے'}</option>
            <option value="month">{language === 'en' ? 'This Month' : 'اس مہینے'}</option>
          </select>
          <input 
            type="text" 
            placeholder={language === 'en' ? '🔍 Search...' : '🔍 تلاش کریں...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 16px', borderRadius: 20, border: '1px solid var(--border-main)',
              background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none'
            }}
          />
          <button style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border-main)', color: 'var(--text-main)' }}>
            ↓ Export Excel
          </button>
        </div>
      </div>

      {/* The Register Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: language === 'ur' ? 'right' : 'left' }}>
          <thead style={{ background: '#047857', color: 'white', fontSize: 14 }}>
            <tr>
              <th style={{ padding: '16px 24px', fontWeight: 'bold' }}>#</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold' }}>{language === 'en' ? 'Date & Time' : 'تاریخ / وقت'}</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold' }}>{language === 'en' ? 'Shift' : 'شفٹ'}</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold' }}>{language === 'en' ? 'Machine' : 'پمپ / مشین'}</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold' }}>{language === 'en' ? 'Product' : 'پراڈکٹ'}</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold' }}>{language === 'en' ? 'Liters' : 'لیٹرز'}</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold' }}>{language === 'en' ? 'Rate' : 'ریٹ'}</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold' }}>{language === 'en' ? 'Amount (Rs)' : 'رقم'}</th>
              <th style={{ padding: '16px 24px', fontWeight: 'bold' }}>{language === 'en' ? 'Payment Mode' : 'ادائیگی'}</th>
            </tr>
          </thead>
          <tbody>
            {salesEntries.map((row, idx) => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--border-main)', background: idx % 2 === 0 ? 'var(--bg-main)' : 'var(--bg-card)', fontSize: 14 }}>
                <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                <td style={{ padding: '16px 24px', fontWeight: 500 }}>{row.date}</td>
                <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{row.shiftId}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontSize: 12, background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: 4 }}>
                    {row.pump} - {row.nozzle}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold',
                    background: row.productType === 'petrol' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: row.productType === 'petrol' ? '#059669' : '#d97706',
                    border: `1px solid ${row.productType === 'petrol' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                  }}>
                    {row.productType === 'petrol' ? '⛽' : '🛢'} {row.product}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 16 }}>
                  {row.liters.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{row.rate.toFixed(2)}</td>
                <td style={{ padding: '16px 24px', fontWeight: 'bold', color: 'var(--color-success)', fontFamily: 'monospace', fontSize: 16 }}>
                  {row.amount.toLocaleString()}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{
                    padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                    background: row.paymentMode === 'cash' ? 'rgba(16, 185, 129, 0.1)' : 
                                row.paymentMode === 'credit' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: row.paymentMode === 'cash' ? '#059669' : 
                           row.paymentMode === 'credit' ? '#dc2626' : '#2563eb'
                  }}>
                    {row.paymentMode === 'cash' ? (language === 'en' ? 'Cash' : 'نقدی') : 
                     row.paymentMode === 'credit' ? (language === 'en' ? 'Credit' : 'ادھار') : (language === 'en' ? 'Bank' : 'بینک')}
                  </span>
                </td>
              </tr>
            ))}
            
            {/* Empty Search State */}
            {salesEntries.length === 0 && searchTerm && (
              <tr>
                <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                  {language === 'en' ? 'No results found for your search.' : 'آپ کی تلاش کے مطابق کوئی ریکارڈ نہیں ملا۔'}
                </td>
              </tr>
            )}
          </tbody>
          
          {/* Bottom Totals Footer */}
          {salesEntries.length > 0 && (
            <tfoot style={{ background: 'var(--bg-main)', borderTop: '2px solid var(--border-main)', fontWeight: 'bold', fontSize: 16 }}>
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: language === 'ur' ? 'left' : 'right' }}>
                  {language === 'en' ? 'TOTALS:' : 'کل میزان:'}
                </td>
                <td style={{ padding: '24px', color: 'var(--text-main)', fontFamily: 'monospace' }}>
                  {totalLiters.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                </td>
                <td></td>
                <td style={{ padding: '24px', color: 'var(--color-success)', fontFamily: 'monospace', fontSize: 18 }}>
                  Rs {totalAmount.toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

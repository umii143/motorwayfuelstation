import React from 'react';
import { Package, Clock, Hash, CheckCircle, Search } from 'lucide-react';
import { StockBatch, Product } from '../../../types';
import { t } from '../../../lib/translations';

interface BatchHistoryProps {
  batches: StockBatch[];
  products: Product[];
  language: string;
}

export default function BatchHistory({ batches, products, language }: BatchHistoryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'exhausted':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div>
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Package className="size-5 text-indigo-600" />
            <span>{t('FIFO Batch Ledger', 'بیچ لیجر (FIFO)', language)}</span>
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {t('Tracking active and exhausted stock batches for precise cost calculations.', 'دقیق قیمت کے حساب کے لیے فعال اور ختم شدہ اسٹاک بیچز کا ریکارڈ۔', language)}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
           <input
             type="text"
             placeholder={t('Search batch...', 'تلاش کریں...', language)}
             className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
           />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="py-4 px-6 font-semibold">{t('Batch Ref', 'حوالہ')}</th>
              <th className="py-4 px-6 font-semibold">{t('Date', 'تاریخ')}</th>
              <th className="py-4 px-6 font-semibold">{t('Product', 'پراڈکٹ')}</th>
              <th className="py-4 px-6 font-semibold text-right">{t('Received', 'موصول')}</th>
              <th className="py-4 px-6 font-semibold text-right">{t('Remaining', 'باقی')}</th>
              <th className="py-4 px-6 font-semibold text-right">{t('Landed Cost', 'پہنچ قیمت')}</th>
              <th className="py-4 px-6 font-semibold text-center">{t('Status', 'سٹیٹس')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {batches.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  {t('No stock batches found.', 'کوئی اسٹاک بیچ نہیں ملا۔', language)}
                </td>
              </tr>
            ) : (
              batches.map(batch => {
                const product = products.find(p => p.id === batch.productId);
                return (
                  <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Hash className="size-4 text-slate-400" />
                        <span className="font-mono text-slate-700 font-medium text-xs bg-slate-100 px-2 py-0.5 rounded-md">
                          {batch.batchNumber}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-slate-400" />
                        {new Date(batch.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {product ? t(product.name, product.urduName, language) : batch.productId}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-medium text-slate-600">
                      {batch.qtyReceived.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right font-mono">
                      <span className={`font-bold ${batch.qtyRemaining > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {batch.qtyRemaining.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-medium text-slate-600">
                      Rs. {batch.landedCost.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(batch.status)}`}>
                        {batch.status === 'active' ? (
                          <><CheckCircle className="size-3" /> {t('Active', 'فعال', language)}</>
                        ) : (
                          t('Exhausted', 'ختم شدہ', language)
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

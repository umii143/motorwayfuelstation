import React from 'react';
import { PackageOpen, Truck } from 'lucide-react';
import { useInventoryStore } from '../../../../stores/useInventoryStore';
import { useShallow } from 'zustand/react/shallow';
import { useSupplierStore } from '../../../../stores/useSupplierStore';

export function BIProductSupplierAnalysis({ metrics }: any) {
 const { productSales, supplierPerformance } = metrics;
 const { products } = useInventoryStore(useShallow(state => ({ products: state.products })));
 const { suppliers } = useSupplierStore(useShallow(state => ({ suppliers: state.suppliers })));

 const formatCurrency = (val: number) => 
 new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(val);

 return (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
 {/* Product Analysis */}
 <div className="premium-card border overflow-hidden">
 <div className="p-5 border-b border-border bg-subtle flex items-center justify-between">
 <div className="flex items-center gap-2">
 <PackageOpen className="w-5 h-5 text-indigo-600" />
 <h3 className="font-sans text-lg font-bold text-foreground">Product Analysis</h3>
 </div>
 </div>
 <div className="p-5">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {Object.keys(productSales).length === 0 ? (
 <div className="col-span-3 text-center py-8 text-muted-foreground text-sm">No sales data for the selected period.</div>
 ) : (
 Object.entries(productSales).map(([productId, data]: [string, any]) => {
 const prod = products.find(p => p.id === productId);
 const margin = data.revenue - data.cogs;
 const marginPercent = data.revenue > 0 ? (margin / data.revenue) * 100 : 0;
 
 return (
 <div key={productId} className="bg-subtle p-4 rounded-xl border border-border">
 <h4 className="font-bold text-foreground text-base mb-3 flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
 {prod?.name || productId}
 </h4>
 <div className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Revenue</span>
 <span className="font-bold text-foreground">{formatCurrency(data.revenue)}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Liters Sold</span>
 <span className="font-bold text-foreground">{data.liters.toLocaleString()} L</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Total Profit</span>
 <span className="font-bold text-emerald-600">{formatCurrency(margin)}</span>
 </div>
 <div className="pt-2 mt-2 border-t border-border flex justify-between items-center">
 <span className="text-muted-foreground text-xs">Avg Margin</span>
 <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
 {marginPercent.toFixed(2)}%
 </span>
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 </div>

 {/* Supplier Analysis */}
 <div className="premium-card border overflow-hidden">
 <div className="p-5 border-b border-border bg-subtle flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Truck className="w-5 h-5 text-orange-600" />
 <h3 className="font-sans text-lg font-bold text-foreground">Supplier Analysis</h3>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="premium-table">
 <thead>
 <tr>
 <th className="px-5 font-semibold">Supplier</th>
 <th className="px-5 font-semibold text-right">Batches</th>
 <th className="px-5 font-semibold text-right">Liters</th>
 <th className="px-5 font-semibold text-right">Spent</th>
 </tr>
 </thead>
 <tbody>
 {Object.keys(supplierPerformance).length === 0 ? (
 <tr>
 <td colSpan={4} className="py-8 text-center text-muted-foreground">No purchases in the selected period.</td>
 </tr>
 ) : (
 Object.entries(supplierPerformance)
 .sort((a: any, b: any) => b[1].liters - a[1].liters)
 .map(([supplierId, data]: [string, any]) => {
 const supp = suppliers.find(s => s.id === supplierId);
 return (
 <tr key={supplierId} className="hover:bg-slate-50 transition-colors">
 <td className="px-5">{supp?.name || 'any Supplier'}</td>
 <td className="px-5 text-muted-foreground text-right">{data.batches}</td>
 <td className="px-5 text-muted-foreground text-right">{data.liters.toLocaleString()} L</td>
 <td className="px-5 text-foreground text-right">{formatCurrency(data.spent)}</td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}

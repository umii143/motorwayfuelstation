import React, { useState } from 'react';
import { useStation } from '../../contexts/StationContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Search, Filter, AlertCircle, ShieldAlert, FileText, ChevronDown, Activity, Settings, UserCheck, CheckCircle, XCircle } from 'lucide-react';
import { ResponsiveTable } from '../shared/ResponsiveTable';
import { db } from '../../data/db';
import { AuditTrailEntry, InventoryMovement } from '../../types';
import DataIntegrityTab from './IntegrityCenter/DataIntegrityTab';

const AuditCenter: React.FC = () => {
  const { meterResets, settings, staff } = useStation();
  const [activeTab, setActiveTab] = useState('Data Integrity');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditTrails, setAuditTrails] = useState<AuditTrailEntry[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<Record<string, boolean | null>>({});

  React.useEffect(() => {
    const stationId = db.getActiveStationId();
    if (stationId) {
      setAuditTrails(db.getSettingsAuditTrail(stationId));
      setInventoryMovements(db.getInventoryMovements(stationId));
    }
  }, []);

  const verifyHash = async (reset: any) => {
    try {
      const rawString = `${reset.timestamp}-${reset.nozzleId}-${reset.oldReading}-${reset.newReading}`;
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawString));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setVerificationStatus(prev => ({ ...prev, [reset.id]: computedHash === reset.eventHash }));
    } catch (e) {
      setVerificationStatus(prev => ({ ...prev, [reset.id]: false }));
    }
  };

  const tabs = [
    'Data Integrity',
    'Meter Resets',
    'Price Changes',
    'Inventory Adjustments',
    'Shift Reopens',
    'Deleted Transactions',
    'User Login Activity',
    'Cash Corrections',
    'Tank Calibrations',
    'System Events'
  ];

  const renderMeterResets = () => {
    const columns = [
      { accessor: 'timestamp', header: settings.language === 'ur' ? 'تاریخ' : 'Date/Time' },
      { accessor: 'nozzle', header: settings.language === 'ur' ? 'نوزل' : 'Nozzle' },
      { accessor: 'type', header: settings.language === 'ur' ? 'قسم' : 'Reset Type' },
      { accessor: 'reading', header: settings.language === 'ur' ? 'ریڈنگ' : 'Reading (Old -> New)' },
      { accessor: 'stock', header: settings.language === 'ur' ? 'اسٹاک' : 'Stock (Before -> After)' },
      { accessor: 'authorization', header: settings.language === 'ur' ? 'اجازت' : 'Authorization' },
      { accessor: 'severity', header: settings.language === 'ur' ? 'سنگینی' : 'Severity' }
    ];

    const data = meterResets
      .filter(r => 
        r.nozzleName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.authorizedBy.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(r => ({
        id: r.id,
        timestamp: new Date(r.timestamp).toLocaleString(),
        nozzle: r.nozzleName,
        type: r.resetType || (r.isRollover ? 'ROLLOVER' : 'MANUAL'),
        reading: `${r.oldReading} -> ${r.newReading}`,
        stock: `${r.tankStockBeforeReset || r.stockAtReset || 0}L -> ${r.tankStockAfterReset || r.stockAtReset || 0}L`,
        authorization: `${r.requestedBy || r.authorizedBy} (Approved by: ${r.approvedBy || r.authorizedBy})`,
        severity: (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            r.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
            r.severity === 'WARNING' ? 'bg-orange-100 text-orange-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {r.severity || 'INFO'}
          </span>
        ),
        hash: (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => verifyHash(r)}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border border-gray-300 transition-colors"
            >
              Verify Hash
            </button>
            {verificationStatus[r.id] === true && <span title="Hash Valid"><CheckCircle className="w-4 h-4 text-green-500" /></span>}
            {verificationStatus[r.id] === false && <span title="Hash Invalid or Missing"><XCircle className="w-4 h-4 text-red-500" /></span>}
          </div>
        )
      }));

    return <ResponsiveTable columns={[...columns, { accessor: 'hash', header: 'Integrity' }] as any} data={data} keyExtractor={r => r.id} />;
  };

  const renderAuditTrails = (categoryFilter?: string) => {
    const columns = [
      { accessor: 'timestamp', header: 'Date/Time' },
      { accessor: 'category', header: 'Category' },
      { accessor: 'action', header: 'Action' },
      { accessor: 'details', header: 'Details' },
      { accessor: 'user', header: 'User' }
    ];

    const data = auditTrails
      .filter(a => categoryFilter ? a.category === categoryFilter : true)
      .filter(a => 
        a.details.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.user.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(a => ({
        id: a.id,
        timestamp: a.timestamp,
        category: (
          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase">
            {a.category}
          </span>
        ),
        action: <span className="font-bold text-slate-800">{a.action}</span>,
        details: <span className="text-sm text-gray-600">{a.details}</span>,
        user: a.user
      }));

    return <ResponsiveTable columns={columns as any} data={data} keyExtractor={a => a.id} />;
  };

  const renderInventoryMovements = () => {
    const columns = [
      { accessor: 'date', header: 'Date' },
      { accessor: 'type', header: 'Type' },
      { accessor: 'product', header: 'Product' },
      { accessor: 'quantity', header: 'Quantity' },
      { accessor: 'reference', header: 'Reference' }
    ];

    const data = inventoryMovements
      .filter(m => 
        m.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.referenceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(m => ({
        id: m.id,
        date: new Date(m.date).toLocaleString(),
        type: (
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
            ['Purchase', 'Return', 'Tank Refill'].includes(m.type) ? 'bg-green-100 text-green-700' :
            ['Sale', 'Wastage', 'Tank Loss'].includes(m.type) ? 'bg-orange-100 text-orange-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {m.type}
          </span>
        ),
        product: m.productId,
        quantity: `${m.quantity} L`,
        reference: m.referenceId || m.notes || '-'
      }));

    return <ResponsiveTable columns={columns as any} data={data} keyExtractor={m => m.id} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-red-600" />
            {settings.language === 'ur' ? 'آڈٹ سینٹر' : 'Audit Center'}
          </h2>
          <p className="text-gray-500 mt-1">
            {settings.language === 'ur' ? 'تمام اہم سرگرمیوں کا ریکارڈ' : 'Enterprise grade immutable tracking of critical system events.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'text-gray-600 hover:bg-gray-50 border border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Data Integrity' ? (
        <DataIntegrityTab stationId={db.getActiveStationId() || ''} settings={settings} />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <CardTitle>{activeTab}</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={settings.language === 'ur' ? 'تلاش کریں...' : 'Search records...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === 'Meter Resets' && renderMeterResets()}
            {activeTab === 'Price Changes' && renderAuditTrails('Tariff')}
            {activeTab === 'Inventory Adjustments' && renderInventoryMovements()}
            {activeTab === 'System Events' && renderAuditTrails()}
            {activeTab === 'Shift Reopens' && renderAuditTrails('Shift')}
            {activeTab === 'Tank Calibrations' && renderAuditTrails('Tank')}
          
          {['Deleted Transactions', 'User Login Activity', 'Cash Corrections'].includes(activeTab) && (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center">
              <Activity className="w-12 h-12 mb-4 text-gray-300" />
              <p>Audit trail for {activeTab} will appear here.</p>
              <p className="text-sm mt-2">Enterprise Audit Tracking is actively monitoring this module.</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default AuditCenter;

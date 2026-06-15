import React, { useMemo } from 'react';
import { Lightbulb, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useStation } from '../../contexts/StationContext';
import { PoweredByUmarAli } from './PoweredByUmarAli';


interface SmartSuggestionsProps {
  onClose?: () => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ onClose }) => {
  const { tanks, customers, shifts } = useStation();
  const [isVisible, setIsVisible] = React.useState(true);

  const suggestions = useMemo(() => {
    const alerts = [];

    // 1. Check Low Stock Tanks
    if (tanks && tanks.length > 0) {
      tanks.forEach(tank => {
        if (tank.currentStock <= tank.capacity * 0.15) { // Below 15%
          alerts.push({
            id: `tank_${tank.id}`,
            type: 'warning',
            title: 'Low Fuel Stock',
            message: `Tank "${tank.name}" is running low (${(tank.currentStock || 0).toFixed(0)} Liters remaining).`,
            actionLabel: 'Reorder Fuel',
            actionPath: '/inventory'
          });
        }
      });
    }

    // 2. Check Pending Recoveries (Credits)
    if (customers && customers.length > 0) {
      const pendingAccounts = customers.filter(c => c.balance > 50000);
      if (pendingAccounts.length > 0) {
        alerts.push({
          id: 'credit_pending',
          type: 'info',
          title: 'High Outstanding Credits',
          message: `${pendingAccounts.length} customers owe more than 50,000 PKR.`,
          actionLabel: 'View Ledgers',
          actionPath: '/customers'
        });
      }
    }

    // 3. Unresolved Shift Variances
    if (shifts && shifts.length > 0) {
      const recentShifts = shifts.slice(-5); // Get last 5 shifts assuming chronological
      const variances = recentShifts.filter(s => (s.shortage || 0) < -500); // More than 500 shortage
      if (variances.length > 0) {
        alerts.push({
          id: 'shift_variance',
          type: 'warning',
          title: 'Shift Shortages Detected',
          message: `${variances.length} recent shifts reported cash shortages.`,
          actionLabel: 'Audit Shifts',
          actionPath: '/shifts'
        });
      }
    }

    return alerts;
  }, [tanks, customers, shifts]);

  if (suggestions.length === 0 || !isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 max-w-[calc(100vw-3rem)]">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-300" />
            Smart Suggestions
          </h3>
          <button 
            onClick={() => { if (onClose) onClose(); else setIsVisible(false); }} 
            className="text-indigo-200 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="max-h-72 overflow-y-auto p-2 space-y-2">
          {suggestions.map(suggestion => (
            <div 
              key={suggestion.id} 
              className={`p-3 rounded-lg border ${
                suggestion.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
              }`}
            >
              <div className="flex items-start gap-3">
                {suggestion.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className={`text-sm font-bold ${
                    suggestion.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
                  }`}>
                    {suggestion.title}
                  </h4>
                  <p className={`text-xs mt-1 ${
                    suggestion.type === 'warning' ? 'text-amber-700' : 'text-blue-700'
                  }`}>
                    {suggestion.message}
                  </p>
                  
                  {suggestion.actionLabel && (
                    <button 
                      className={`mt-2 text-xs font-bold flex items-center gap-1 hover:underline ${
                        suggestion.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                      }`}
                      onClick={() => {
                        if (suggestion.actionPath) {
                          // In a real app with React Router, we'd navigate
                          // navigate(suggestion.actionPath);
                          console.log('Navigate to', suggestion.actionPath);
                        }
                      }}
                    >
                      {suggestion.actionLabel} <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex justify-center">
          <PoweredByUmarAli variant="compact" />
        </div>
      </div>
    </div>
  );
};

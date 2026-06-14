import React from 'react';
import { Users, Shield, UserPlus, Key } from 'lucide-react';
import { GlobalSettings } from '../../../types';

export default function UsersAndRoles({ settings }: { settings: GlobalSettings }) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-600" />
          {t('Users & Roles', 'یوزرز اور کردار')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">Manage employee access levels, roles, and security permissions.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-indigo-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Centralized Staff Management</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          Staff management, attendance, and payroll have been migrated to the primary Staff Module on the main dashboard sidebar for easier daily access.
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-sm mx-auto text-left">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-indigo-500" />
            <span className="text-xs font-bold text-slate-700">Add Staff</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
            <Key className="h-5 w-5 text-indigo-500" />
            <span className="text-xs font-bold text-slate-700">Manage PINs</span>
          </div>
        </div>
      </div>
    </div>
  );
}

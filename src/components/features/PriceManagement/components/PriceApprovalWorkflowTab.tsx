import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, UserCheck, Send, AlertCircle } from 'lucide-react';

interface PriceApprovalWorkflowTabProps {
  isUrdu: boolean;
  onApprove: () => void;
}

export const PriceApprovalWorkflowTab: React.FC<PriceApprovalWorkflowTabProps> = ({ isUrdu, onApprove }) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const workflowSteps = [
    { stage: '1. Draft', title: 'Rate Proposal Drafted', by: 'Pricing Officer Ali', status: 'completed' },
    { stage: '2. Prepared', title: 'Tax & Levy Verified', by: 'Tax Compliance Lead', status: 'completed' },
    { stage: '3. Submitted', title: 'Submitted for Audit', by: 'System Engine', status: 'completed' },
    { stage: '4. Regional Manager', title: 'Regional Approval', by: 'Regional Manager Zahid', status: 'completed' },
    { stage: '5. Finance Approval', title: 'Ledger Impact Cleared', by: 'CFO Office', status: 'completed' },
    { stage: '6. Owner Approval & Publish', title: 'Final Publish Authorization', by: 'Station Owner (You)', status: 'pending' }
  ];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-[var(--border-main)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 dark:from-amber-500 dark:to-yellow-600 flex items-center justify-center text-white font-black shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-main)] tracking-tight flex items-center gap-2">
              {t('6-Stage Enterprise Approval Pipeline', 'چھ مرحلہ وار قیمت منظوری پائپ لائن')}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 font-bold">
                Oracle NetSuite Protocol
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {t('Multi-stage governance pipeline from proposal draft to final rate publication', 'مختلف انتظامی مراحل سے قیمت کی منظوری اور لائیو اشاعت')}
            </p>
          </div>
        </div>

        <button
          onClick={onApprove}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 dark:from-emerald-500 dark:to-teal-500 text-white text-xs font-black shadow-md transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          {t('Approve & Authorize Publish', 'حتمی منظوری دیں')}
        </button>
      </div>

      {/* Workflow Steps Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        {workflowSteps.map((step) => (
          <div
            key={step.stage}
            className={`p-4 rounded-xl border ${
              step.status === 'completed'
                ? 'bg-[var(--bg-subtle)] border-emerald-500/30 text-[var(--text-main)]'
                : 'bg-[var(--bg-card)] border-amber-500/50 text-amber-900 dark:text-amber-300 animate-pulse'
            }`}
          >
            <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] mb-1">{step.stage}</div>
            <div className="font-bold text-xs text-[var(--text-main)] mb-1">{step.title}</div>
            <div className="text-[10px] text-[var(--text-muted)]">{step.by}</div>
            <div className="mt-2 text-[10px] font-bold">
              {step.status === 'completed' ? (
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Pending Review
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

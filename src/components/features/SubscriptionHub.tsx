/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Crown, 
  Building2, 
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { GlobalSettings } from '../../types';
import { t as translate } from '../../lib/translations';
import { useAuth } from '../../contexts/AuthContext';
import { getPaymentProvider, PaymentProvider } from '../../lib/payment';
import { doc, updateDoc } from 'firebase/firestore';
import { dbFS } from '../../lib/firebase';

interface SubscriptionHubProps {
  settings: GlobalSettings;
}

export default function SubscriptionHub({ settings }: SubscriptionHubProps) {
  const { organization, user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'professional' | 'enterprise'>('professional');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'safepay' | 'jazzcash' | 'easypaisa'>('safepay');

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => translate(en, ur, settings);

  const plans = [
    {
      id: 'basic',
      name: t('Basic', 'بنیادی'),
      price: 'PKR 5,000',
      period: t('/month', '/مہینہ'),
      icon: Zap,
      features: [
        t('1 Fuel Station', '1 فیول اسٹیشن'),
        t('Basic Ledger & Reporting', 'بنیادی کھاتہ اور رپورٹنگ'),
        t('Up to 3 Staff Accounts', '3 اسٹاف اکاؤنٹس تک'),
        t('Standard Support', 'معیاری سپورٹ')
      ],
      color: 'bg-slate-50 border-slate-200',
      iconColor: 'text-slate-600',
      btnColor: 'bg-slate-800 hover:bg-slate-900'
    },
    {
      id: 'professional',
      name: t('Professional', 'پروفیشنل'),
      price: 'PKR 12,000',
      period: t('/month', '/مہینہ'),
      icon: Crown,
      popular: true,
      features: [
        t('Up to 3 Fuel Stations', '3 فیول اسٹیشنز تک'),
        t('Advanced Analytics & BI', 'ایڈوانسڈ اینالٹکس'),
        t('Lube POS Included', 'لیوب پی او ایس شامل ہے'),
        t('Unlimited Staff Accounts', 'لامحدود اسٹاف اکاؤنٹس'),
        t('Priority WhatsApp Support', 'ترجیحی واٹس ایپ سپورٹ')
      ],
      color: 'bg-orange-50 border-orange-200 shadow-lg scale-105 z-10',
      iconColor: 'text-orange-600',
      btnColor: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      id: 'enterprise',
      name: t('Enterprise', 'انٹرپرائز'),
      price: 'Custom',
      period: '',
      icon: Building2,
      features: [
        t('Unlimited Stations', 'لامحدود اسٹیشنز'),
        t('Custom ERP Integration', 'کسٹم ای آر پی انضمام'),
        t('White-label Options', 'وائٹ لیبل آپشنز'),
        t('Dedicated Account Manager', 'مخصوص اکاؤنٹ مینیجر')
      ],
      color: 'bg-slate-50 border-slate-200',
      iconColor: 'text-slate-600',
      btnColor: 'bg-slate-800 hover:bg-slate-900'
    }
  ];

  const handleSubscribe = async () => {
    if (!organization) return;
    if (selectedPlan === 'enterprise') {
      alert(t('Contacting sales...', 'سیلز سے رابطہ کر رہے ہیں...'));
      return;
    }

    setIsProcessing(true);
    setPaymentSuccess(false);

    try {
      const provider: PaymentProvider = getPaymentProvider(selectedGateway);
      
      // Determine amount based on plan
      const amount = selectedPlan === 'professional' ? 12000 : 5000;
      
      // 1. Initialize Payment
      const result = await provider.initializePayment(amount, 'PKR', organization.orgId);
      
      if (result.success) {
        // 2. Verify Payment (simulated webhook/callback)
        const verified = await provider.verifyPayment(result.transactionId);
        
        if (verified) {
          // 3. Update SaaS Organization record in Firestore
          const orgRef = doc(dbFS, 'organizations', organization.orgId);
          await updateDoc(orgRef, {
            subscriptionStatus: 'active',
            subscriptionTier: selectedPlan,
            // Add 30 days to current date or trial end date
            trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

          // Also log audit
          const auditLog = {
            id: `aud_${Date.now()}`,
            userId: user?.uid || 'unknown',
            email: user?.email || 'unknown',
            action: 'subscription_upgraded',
            details: `Organization upgraded to ${selectedPlan.toUpperCase()} via ${selectedGateway.toUpperCase()}`,
            ip: '127.0.0.1',
            device: navigator.userAgent,
            timestamp: new Date().toISOString()
          };
          // Fire and forget audit log
          import('firebase/firestore').then(({ setDoc, doc }) => {
            setDoc(doc(dbFS, 'auditLogs', auditLog.id), auditLog);
          });

          setPaymentSuccess(true);
        }
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert(t('Payment failed. Please try again.', 'ادائیگی ناکام ہو گئی۔ براہ کرم دوبارہ کوشش کریں۔'));
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateDaysRemaining = () => {
    if (!organization?.trialEndDate) return 0;
    const end = new Date(organization.trialEndDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const daysRemaining = calculateDaysRemaining();
  const isExpired = organization?.subscriptionStatus === 'expired' || (organization?.subscriptionStatus === 'trialing' && daysRemaining === 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-100 to-transparent rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
            <CreditCard className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-sans text-2xl font-bold text-slate-900 tracking-tight">
              {t('Subscription & Billing', 'سبسکرپشن اور بلنگ')}
            </h1>
            <p className="font-sans text-sm text-slate-500 mt-1">
              {t('Manage your FuelPro enterprise subscription and payment methods.', 'اپنے فیول پرو انٹرپرائز سبسکرپشن اور ادائیگی کے طریقوں کا انتظام کریں۔')}
            </p>
          </div>
        </div>
      </div>

      {/* Current Status Banner */}
      <div className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 ${
        paymentSuccess 
          ? 'bg-emerald-50 border-emerald-200' 
          : isExpired 
            ? 'bg-rose-50 border-rose-200' 
            : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full mt-1 ${
            paymentSuccess ? 'bg-emerald-100 text-emerald-600' :
            isExpired ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {paymentSuccess ? <CheckCircle2 className="h-6 w-6" /> :
             isExpired ? <AlertTriangle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${
              paymentSuccess ? 'text-emerald-900' :
              isExpired ? 'text-rose-900' : 'text-blue-900'
            }`}>
              {paymentSuccess 
                ? t('Payment Successful!', 'ادائیگی کامیاب!')
                : isExpired 
                  ? t('Subscription Expired', 'سبسکرپشن ختم ہو گئی ہے')
                  : t('Active Trial Period', 'فعال ٹرائل کی مدت')}
            </h3>
            <p className={`text-sm mt-1 max-w-xl ${
              paymentSuccess ? 'text-emerald-700' :
              isExpired ? 'text-rose-700' : 'text-blue-700'
            }`}>
              {paymentSuccess 
                ? t('Your account has been upgraded successfully. Thank you for choosing FuelPro Enterprise.', 'آپ کا اکاؤنٹ کامیابی کے ساتھ اپ گریڈ ہو گیا ہے۔')
                : isExpired
                  ? t('Your trial period has ended. Please upgrade your plan to continue using FuelPro without interruption.', 'آپ کی ٹرائل کی مدت ختم ہو گئی ہے۔ رسائی بحال کرنے کے لیے براہ کرم اپنا پلان اپ گریڈ کریں۔')
                  : t(`You are currently on a free trial. You have ${daysRemaining} days remaining before your trial expires. Upgrade now to secure your data.`, `آپ اس وقت مفت ٹرائل پر ہیں۔ آپ کے ٹرائل کی مدت ختم ہونے میں ${daysRemaining} دن باقی ہیں۔`)}
            </p>
          </div>
        </div>

        {!paymentSuccess && organization && (
          <div className="shrink-0 flex flex-col items-end">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {t('Current Plan', 'موجودہ پلان')}
            </span>
            <span className="px-4 py-1.5 bg-white rounded-lg font-bold text-slate-800 border border-slate-200 shadow-xs uppercase">
              {organization.subscriptionTier}
            </span>
          </div>
        )}
      </div>

      {!paymentSuccess && (
        <>
          {/* Payment Gateway Selection */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h3 className="font-bold text-slate-900">{t('Select Payment Gateway', 'ادائیگی کا طریقہ منتخب کریں')}</h3>
              <p className="text-sm text-slate-500">{t('Choose your preferred method for seamless transactions in Pakistan.', 'پاکستان میں ہموار لین دین کے لیے اپنا پسندیدہ طریقہ منتخب کریں۔')}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { id: 'safepay', name: 'Safepay', desc: 'Cards / Bank' },
                { id: 'jazzcash', name: 'JazzCash', desc: 'Mobile Wallet' },
                { id: 'easypaisa', name: 'EasyPaisa', desc: 'Mobile Wallet' },
                { id: 'stripe', name: 'Stripe', desc: 'International' }
              ].map(gw => (
                <button
                  key={gw.id}
                  onClick={() => setSelectedGateway(gw.id as any)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    selectedGateway === gw.id 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className={`h-10 w-10 mb-2 rounded-full flex items-center justify-center ${
                    selectedGateway === gw.id ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <span className={`font-bold text-sm ${selectedGateway === gw.id ? 'text-orange-900' : 'text-slate-700'}`}>
                    {gw.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase mt-1">{gw.desc}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 w-max px-3 py-1.5 rounded-lg">
              <ShieldCheck className="h-4 w-4" />
              {t('256-bit Secure Encryption Checkout via ' + selectedGateway.toUpperCase(), 'محفوظ ادائیگی')}
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 items-center">
            {plans.map(plan => {
              const Icon = plan.icon;
              return (
                <div 
                  key={plan.id}
                  className={`relative rounded-3xl border p-8 transition-all duration-300 ${plan.color} ${
                    selectedPlan === plan.id && !plan.popular ? 'ring-2 ring-slate-900' : ''
                  }`}
                  onClick={() => setSelectedPlan(plan.id as any)}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-md">
                      {t('Most Popular', 'سب سے مقبول')}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{plan.id === 'basic' ? t('For small single pumps', 'چھوٹے پمپ کے لیے') : plan.id === 'professional' ? t('For growing networks', 'بڑھتے ہوئے نیٹ ورکس کے لیے') : t('For corporate fleets', 'کارپوریٹ کے لیے')}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-white shadow-sm ${plan.iconColor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                      <span className="text-sm font-bold text-slate-400 mb-1">{plan.period}</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`shrink-0 rounded-full p-0.5 ${plan.popular ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan(plan.id as any);
                      handleSubscribe();
                    }}
                    disabled={isProcessing}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all shadow-md ${plan.btnColor} ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing && selectedPlan === plan.id ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        {plan.id === 'enterprise' ? t('Contact Sales', 'رابطہ کریں') : t('Upgrade Now', 'اپ گریڈ کریں')}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

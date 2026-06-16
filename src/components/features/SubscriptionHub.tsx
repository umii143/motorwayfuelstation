import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Crown, 
  Building2, 
  Clock,
  ArrowRight,
  ShieldCheck,
  UploadCloud,
  FileImage,
  RefreshCw,
  MessageCircle
} from 'lucide-react';
import { GlobalSettings } from '../../types';
import { t as translate } from '../../lib/translations';
import { useAuth } from '../../contexts/AuthContext';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { dbFS } from '../../lib/firebase';
import { haptic } from '../../utils/haptics';

interface SubscriptionHubProps {
  settings: GlobalSettings;
}

export default function SubscriptionHub({ settings }: SubscriptionHubProps) {
  const { organization, user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'enterprise'>('professional');
  const [selectedGateway, setSelectedGateway] = useState<'jazzcash' | 'easypaisa' | 'bank' | 'raast'>('jazzcash');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => translate(en, ur, settings);

  const isPending = organization?.subscriptionStatus === 'pending_verification';

  const plans = [
    {
      id: 'starter',
      name: t('Starter', 'اسٹارٹر'),
      price: 'Rs. 2,999',
      amount: 2999,
      period: t('/month', '/مہینہ'),
      icon: Zap,
      features: [
        t('Single Station', 'سنگل اسٹیشن'),
        t('Basic Dashboard', 'بنیادی ڈیش بورڈ'),
        t('Shift Wizard', 'شفٹ وزرڈ'),
        t('Stock IN & Customers', 'اسٹاک اور کسٹمرز')
      ],
      color: 'bg-slate-50 border-slate-200',
      iconColor: 'text-slate-600',
      btnColor: 'bg-slate-800 hover:bg-slate-900'
    },
    {
      id: 'professional',
      name: t('Professional', 'پروفیشنل'),
      price: 'Rs. 5,999',
      amount: 5999,
      period: t('/month', '/مہینہ'),
      icon: Crown,
      popular: true,
      features: [
        t('Everything in Starter', 'اسٹارٹر کی تمام خصوصیات'),
        t('Treasury Center & Analytics', 'ٹریژری سینٹر اور اینالٹکس'),
        t('Mobile APK & OTP Login', 'موبائل ایپ اور لاگ ان'),
        t('WhatsApp Integration', 'واٹس ایپ کا انضمام')
      ],
      color: 'bg-orange-50 border-orange-200 shadow-lg scale-105 z-10',
      iconColor: 'text-orange-600',
      btnColor: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      id: 'enterprise',
      name: t('Enterprise', 'انٹرپرائز'),
      price: 'Rs. 12,999',
      amount: 12999,
      period: t('/month', '/مہینہ'),
      icon: Building2,
      features: [
        t('Unlimited Users & Stations', 'لامحدود یوزرز اور اسٹیشنز'),
        t('OTA Updates & Priority Support', 'اپ ڈیٹس اور ترجیحی سپورٹ'),
        t('Custom Branding', 'کسٹم برانڈنگ'),
        t('API Access', 'اے پی آئی تک رسائی')
      ],
      color: 'bg-slate-50 border-slate-200',
      iconColor: 'text-slate-600',
      btnColor: 'bg-slate-800 hover:bg-slate-900'
    }
  ];

  const gateways = [
    { id: 'jazzcash', name: 'NayaPay', desc: '0316 8432329 (Umar Ali)' },
    { id: 'easypaisa', name: 'SadaPay', desc: '0316 84 32329 (Umar Ali)' },
    { id: 'raast', name: 'Raast ID', desc: '0316 8432329 (Umar Ali)' },
    { id: 'bank', name: 'Bank Transfer', desc: 'Please use Raast/NayaPay/SadaPay' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleSubmitReceipt = async () => {
    if (!organization || !user || !receiptFile) return;
    
    setIsProcessing(true);
    try {
      const requestId = `req_${Date.now()}`;
      
      // Upload to ImgBB via free API
      const formData = new FormData();
      formData.append('key', '4f7eacf5f013e25960ed4be616506e61');
      formData.append('image', receiptFile);

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'ImgBB upload failed');
      }
      
      const receiptUrl = data.data.url;

      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      
      // Create Subscription Request
      const subReq = {
        id: requestId,
        orgId: organization.orgId,
        userId: user.uid,
        userEmail: user.email,
        plan: selectedPlan,
        status: 'pending',
        paymentMethod: selectedGateway,
        amount: selectedPlanData?.amount || 0,
        receiptUrl,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(dbFS, 'subscriptionRequests', requestId), subReq);

      // Update Org Status
      await updateDoc(doc(dbFS, 'organizations', organization.orgId), {
        subscriptionStatus: 'pending_verification'
      });

      haptic.success();
      
      // Open WhatsApp automatically
      const waMessage = `Assalamualaikum.\nI have submitted my FuelPro subscription payment.\nOrg ID: ${organization.orgId}\nPlan: ${selectedPlan}\nPlease verify my request.`;
      const waUrl = `https://wa.me/923168432329?text=${encodeURIComponent(waMessage)}`;
      window.open(waUrl, '_blank');
      
      // Local state update handled by real-time listener or reload
      window.location.reload();
      
    } catch (err: any) {
      console.error('Upload Error:', err);
      alert(`Upload Failed: ${err.message || err.code || 'Unknown error'}\n\nPlease make sure your ImgBB API key is correct and you have internet connection.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateDaysRemaining = () => {
    if (!organization?.expiryDate && !organization?.trialEndDate) return 0;
    const end = new Date(organization.expiryDate || organization.trialEndDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const daysRemaining = calculateDaysRemaining();
  const isExpired = organization?.subscriptionStatus === 'expired' || (organization?.subscriptionStatus === 'trialing' && daysRemaining === 0);
  const isActive = organization?.subscriptionStatus === 'active';

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-row items-center justify-between premium-card p-6 border relative overflow-hidden">
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
              {t('Manage your FuelPro enterprise license.', 'اپنے فیول پرو انٹرپرائز لائسنس کا انتظام کریں۔')}
            </p>
          </div>
        </div>
      </div>

      {/* Current Status Banner */}
      <div className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 ${
        isActive ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' :
        isPending ? 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20' :
        isExpired ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20' : 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full mt-1 ${
            isActive ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
            isPending ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' :
            isExpired ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
          }`}>
            {isActive ? <CheckCircle2 className="h-6 w-6" /> :
             isPending ? <Clock className="h-6 w-6" /> :
             isExpired ? <AlertTriangle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${
              isActive ? 'text-emerald-900 dark:text-emerald-400' :
              isPending ? 'text-orange-900 dark:text-orange-400' :
              isExpired ? 'text-rose-900 dark:text-rose-400' : 'text-blue-900 dark:text-blue-400'
            }`}>
              {isActive ? t('Active Subscription', 'فعال سبسکرپشن') :
               isPending ? t('Pending Verification', 'تصدیق زیر التوا ہے') :
               isExpired ? t('Subscription Expired', 'سبسکرپشن ختم ہو گئی ہے') :
               t('Active Trial Period', 'فعال ٹرائل کی مدت')}
            </h3>
            <p className={`text-sm mt-1 max-w-xl ${
              isActive ? 'text-emerald-700 dark:text-emerald-300' :
              isPending ? 'text-orange-700 dark:text-orange-300' :
              isExpired ? 'text-rose-700 dark:text-rose-300' : 'text-blue-700 dark:text-blue-300'
            }`}>
              {isActive ? t(`Your account is fully upgraded. ${daysRemaining} days remaining.`, `آپ کا اکاؤنٹ اپ گریڈ ہے۔ ${daysRemaining} دن باقی ہیں۔`) :
               isPending ? t('Your payment receipt is under review by our team. Please wait for approval.', 'آپ کی رسید کا جائزہ لیا جا رہا ہے۔ براہ کرم انتظار کریں۔') :
               isExpired ? t('Your trial/subscription has ended. Please upgrade your plan to continue using all features.', 'رسائی بحال کرنے کے لیے براہ کرم اپنا پلان اپ گریڈ کریں۔') :
               t(`You are currently on a free trial. You have ${daysRemaining} days remaining.`, `آپ اس وقت مفت ٹرائل پر ہیں۔ ${daysRemaining} دن باقی ہیں۔`)}
            </p>
          </div>
        </div>
      </div>

      {(!isPending) && (
        <div className="bg-white dark:bg-[#111622] rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Progress Steps */}
          <div className="flex border-b border-slate-100">
            {[1, 2, 3].map(num => (
              <div key={num} className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition-colors ${step === num ? 'border-orange-500 text-orange-600 bg-orange-50/50' : step > num ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400'}`}>
                {num === 1 ? t('Choose Plan', 'پلان منتخب کریں') : num === 2 ? t('Payment Method', 'ادائیگی کا طریقہ') : t('Upload Receipt', 'رسید اپ لوڈ کریں')}
              </div>
            ))}
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-6 pt-4 items-center">
                    {plans.map(p => (
                  <div 
                    key={p.id} 
                    className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
                      selectedPlan === p.id 
                        ? 'border-orange-500 ring-4 ring-orange-500/10 dark:bg-orange-500/10 bg-orange-50' 
                        : 'border-slate-200 dark:border-slate-800 dark:bg-[#161c2d] hover:border-orange-300 dark:hover:border-orange-500/50'
                    } ${p.popular ? 'md:-mt-4 md:mb-4 shadow-xl' : ''}`}
                    onClick={() => setSelectedPlan(p.id as any)}
                  >
                    {p.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                        {t('Most Popular', 'سب سے مقبول')}
                      </div>
                    )}
                    <div className={`p-3 rounded-xl inline-flex ${p.id === 'professional' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'} mb-4`}>
                      <p.icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-bold dark:text-white">{p.name}</h4>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{p.price}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{p.period}</span>
                    </div>
                    <div className="mt-6 space-y-3">
                      {p.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </div>
                    <button onClick={() => { setSelectedPlan(p.id as any); setStep(2); haptic.light(); }} className={`w-full mt-8 py-3 rounded-xl font-bold transition-all ${selectedPlan === p.id ? 'bg-orange-600 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
                      {t('Select Plan', 'منتخب کریں')}
                    </button>
                  </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-3xl mx-auto">
                  <div className="mb-6 text-center">
                    <h3 className="text-xl font-bold dark:text-white">{t('Select Payment Gateway', 'ادائیگی کا طریقہ منتخب کریں')}</h3>
                    <p className="text-slate-500">{t('Please select where you would like to transfer the payment.', 'براہ کرم منتخب کریں کہ آپ ادائیگی کہاں منتقل کرنا چاہتے ہیں۔')}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {gateways.map(g => (
                      <div key={g.id} onClick={() => setSelectedGateway(g.id as any)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        selectedGateway === g.id 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-500/50 dark:bg-[#161c2d]'
                      }`}>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{g.name}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{g.desc}</p>
                          </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setStep(1)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700">{t('Back', 'پیچھے')}</button>
                    <button onClick={() => setStep(3)} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/30">
                      {t('Continue', 'جاری رکھیں')} <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-2xl mx-auto">
                  <div className="mb-6 text-center">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('Upload Payment Receipt', 'ادائیگی کی رسید اپ لوڈ کریں')}</h3>
                    <p className="text-slate-500">
                      {t('Please transfer ', 'براہ کرم ')} 
                      <strong className="text-slate-900 dark:text-white">{plans.find(p => p.id === selectedPlan)?.price}</strong> 
                      {t(' to the selected account and upload the screenshot.', ' منتقل کریں اور اسکرین شاٹ اپ لوڈ کریں۔')}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/50 rounded-2xl p-6 mb-8 flex items-start gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/50 rounded-xl shrink-0"><ShieldCheck className="h-6 w-6" /></div>
                    <div>
                      <h4 className="font-bold text-blue-900 dark:text-blue-400 mb-1">{gateways.find(g => g.id === selectedGateway)?.name} Account Details</h4>
                      <p className="text-blue-800 dark:text-blue-200 font-mono text-lg bg-white dark:bg-black/20 inline-block px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800 mt-2">{gateways.find(g => g.id === selectedGateway)?.desc}</p>
                    </div>
                  </div>
                  
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  
                  <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${receiptFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 bg-slate-50 dark:bg-[#161c2d]'}`}>
                    {receiptFile ? (
                      <>
                        <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-full flex items-center justify-center mb-4"><FileImage className="h-8 w-8" /></div>
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-400 text-lg">{receiptFile.name}</h4>
                        <p className="text-emerald-700 dark:text-emerald-500 text-sm mt-1">{t('Tap to change file', 'فائل تبدیل کرنے کے لیے تھپتھپائیں')}</p>
                      </>
                    ) : (
                      <>
                        <div className="h-16 w-16 bg-white dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200 dark:border-slate-700"><UploadCloud className="h-8 w-8" /></div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 text-lg">{t('Tap to upload receipt', 'رسید اپ لوڈ کرنے کے لیے تھپتھپائیں')}</h4>
                        <p className="text-slate-500 text-sm mt-1">{t('Supported formats: JPG, PNG, PDF', 'معاون فارمیٹس: JPG, PNG, PDF')}</p>
                      </>
                    )}
                  </div>

                  <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                    <button onClick={() => setStep(2)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700" disabled={isProcessing}>{t('Back', 'پیچھے')}</button>
                    <button onClick={handleSubmitReceipt} disabled={!receiptFile || isProcessing} className={`bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 ${(!receiptFile || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {isProcessing ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><MessageCircle className="h-5 w-5" /> {t('Submit & WhatsApp', 'جمع کرائیں')}</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

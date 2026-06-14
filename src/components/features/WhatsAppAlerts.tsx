import React, { useState, useEffect } from 'react';
import { GlobalSettings } from '../../types';
import { fetchWithAuth } from '../../lib/api';
import { MessageCircle, Settings2, BellRing, Save, CheckCircle2, Smartphone, QrCode, Loader2, LogOut } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { t as translate } from '../../lib/translations';

interface Props {
  settings: GlobalSettings;
  onUpdateSettings: (settings: GlobalSettings) => void;
}

export default function WhatsAppAlerts({ settings, onUpdateSettings }: Props) {
  const ws = settings.whatsappSettings;
  const [phoneNumber, setPhoneNumber] = useState(ws?.number || '+92 ');
  const [alerts, setAlerts] = useState({
    shiftClose: ws?.alerts?.shiftClose ?? true,
    priceChange: ws?.alerts?.priceChange ?? true,
    tankLow: ws?.alerts?.tankLow ?? true,
    cashVariance: ws?.alerts?.cashVariance ?? true
  });
  const [saved, setSaved] = useState(false);

  const t = (en: string, ur: string) => translate(en, ur, settings);

  const handleSave = () => {
    onUpdateSettings({
      ...settings,
      whatsappSettings: {
        enabled: true,
        number: phoneNumber,
        alerts
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const [waStatus, setWaStatus] = useState({ ready: false, qr: '', initializing: false });
  
  useEffect(() => {
    const fetchStatus = () => fetchWithAuth('/api/wa/status').then(r => r.json()).then(setWaStatus).catch(() => {});
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleInitWA = async () => {
    setWaStatus(prev => ({ ...prev, initializing: true }));
    try {
      await fetchWithAuth('/api/wa/init', { method: 'POST' });
    } catch(e) {}
  };

  const handleLogoutWA = async () => {
    try {
      await fetchWithAuth('/api/wa/logout', { method: 'POST' });
      setWaStatus({ ready: false, qr: '', initializing: false });
    } catch(e) {}
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden group">
        <div className="absolute right-[-40px] top-[-40px] h-64 w-64 bg-white/5 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover:bg-white/10" />
        <MessageCircle className="absolute right-[-20px] bottom-[-20px] h-56 w-56 text-white opacity-5 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-700" />
        
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4 shadow-sm text-emerald-50">
            <BellRing className="h-3 w-3" />
            {t('Enterprise Feature', 'انٹرپرائز فیچر')}
          </span>
          <h2 className="font-sans text-3xl md:text-4xl font-black mb-3 tracking-tight">
            {t('WhatsApp Business Alerts', 'واٹس ایپ بزنس الرٹس')}
          </h2>
          <p className="font-sans text-emerald-50/90 max-w-xl text-sm leading-relaxed font-semibold">
            {t('Configure automatic notifications for critical station events. FuelPro will send instant updates directly to your registered WhatsApp number.', 'اسٹیشن کے اہم واقعات کے لیے خودکار اطلاعات مرتب کریں۔ فیول پرو آپ کے رجسٹرڈ واٹس ایپ نمبر پر فوری اپ ڈیٹس بھیجے گا۔')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
          <div className="p-2.5 bg-slate-100 rounded-xl">
            <Smartphone className="h-6 w-6 text-slate-600" />
          </div>
          <h3 className="font-sans text-2xl font-black text-slate-800 tracking-tight">
            {t('Device Linking', 'ڈیوائس لنکنگ')}
          </h3>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <h4 className="font-sans font-black text-slate-800 text-lg">
              {t('Link Your WhatsApp', 'اپنا واٹس ایپ لنک کریں')}
            </h4>
            <p className="font-sans text-sm text-slate-600 leading-relaxed font-semibold">
              {t('FuelPro requires a linked WhatsApp Web session to send free automated alerts. Click "Generate QR Code", then scan it using your phone.', 'فیول پرو کو مفت آٹو الرٹس بھیجنے کے لیے ایک واٹس ایپ ویب سیشن درکار ہے۔ "کیو آر کوڈ بنائیں" پر کلک کریں، اور پھر اسے اپنے فون سے اسکین کریں۔')}
            </p>
            <ol className="list-decimal pl-4 text-xs font-semibold text-slate-500 space-y-2 font-sans">
              <li>Open WhatsApp on your phone</li>
              <li>Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Linked Devices</strong></li>
              <li>Tap on <strong>Link a Device</strong> and scan the code</li>
            </ol>
            
            {waStatus.ready ? (
              <button onClick={handleLogoutWA} className="mt-4 px-6 py-2.5 bg-red-50 text-red-600 rounded-lg font-bold text-sm border border-red-200 hover:bg-red-100 transition flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Disconnect Device
              </button>
            ) : !waStatus.qr && !waStatus.initializing && (
              <button onClick={handleInitWA} className="mt-4 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm shadow hover:bg-emerald-700 transition flex items-center gap-2">
                <QrCode className="h-4 w-4" /> Generate QR Code
              </button>
            )}
          </div>
          
          <div className="w-64 h-64 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center relative overflow-hidden">
            {waStatus.ready ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="font-sans font-bold text-emerald-700">Client Ready</p>
                <p className="text-xs text-slate-500 mt-1">Ready to send alerts.</p>
              </div>
            ) : waStatus.qr ? (
              <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm inline-block">
                <QRCodeSVG 
                  value={waStatus.qr} 
                  size={200} 
                  bgColor="#ffffff" 
                  fgColor="#000000" 
                  level="L" 
                  includeMargin={true} 
                />
              </div>
            ) : waStatus.initializing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-xs font-bold text-slate-500">Loading Client...</p>
              </div>
            ) : (
              <div className="text-center p-4">
                <QrCode className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">Click generate to view QR</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
          <div className="p-2.5 bg-slate-100 rounded-xl">
            <Settings2 className="h-6 w-6 text-slate-600" />
          </div>
          <h3 className="font-sans text-2xl font-black text-slate-800 tracking-tight">
            {t('Notification Settings', 'نوٹیفکیشن سیٹنگز')}
          </h3>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block font-sans text-sm font-black text-slate-700 mb-2.5">
              {t('Target WhatsApp Number', 'مطلوبہ واٹس ایپ نمبر')}
            </label>
            <div className="relative max-w-md group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="relative w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3.5 text-lg font-mono font-bold focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 transition-all shadow-sm"
                placeholder="+92 3XX XXXXXXX"
              />
              <MessageCircle className="absolute right-4 top-4 h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <p className="font-sans text-xs font-semibold text-slate-500 mt-2.5">
              {t('Must include country code (e.g., +92 for Pakistan)', 'ملکی کوڈ شامل کرنا لازمی ہے (جیسے پاکستان کے لیے +92)')}
            </p>
          </div>

          <div className="pt-2">
            <h4 className="font-sans text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
              <BellRing className="h-5 w-5 text-emerald-600" />
              {t('Event Triggers', 'ایونٹ ٹرگرز')}
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {[
                { 
                  id: 'shiftClose', 
                  label: t('Shift Closure Summaries', 'شفٹ بند ہونے کی سمری'), 
                  desc: t('Receive total sales, variance, and cash deposited when a shift ends.', 'شفٹ ختم ہونے پر کل فروخت، فرق، اور جمع کی گئی کیش کی تفصیل موصول کریں۔') 
                },
                { 
                  id: 'priceChange', 
                  label: t('OGRA Price Updates', 'اوگرا قیمتوں کی اپ ڈیٹس'), 
                  desc: t('Alert when official government fuel rates are updated.', 'جب سرکاری فیول ریٹس اپ ڈیٹ ہوں تو الرٹ حاصل کریں۔') 
                },
                { 
                  id: 'tankLow', 
                  label: t('Critical Tank Levels', 'ٹینک کی کم سطح'), 
                  desc: t('Warning when any underground tank dips below its reorder threshold.', 'جب کوئی بھی ٹینک مقررہ کم سطح سے نیچے جائے تو وارننگ حاصل کریں۔') 
                },
                { 
                  id: 'cashVariance', 
                  label: t('Cash Shortage/Excess', 'کیش کی کمی/زیادتی'), 
                  desc: t('Immediate alert if a cashier reports a variance > 0.05%.', 'اگر کیشیئر 0.05٪ سے زیادہ کیش کا فرق رپورٹ کرے تو فوری الرٹ حاصل کریں۔') 
                }
              ].map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                    alerts[item.id as keyof typeof alerts] 
                      ? 'border-emerald-200 bg-emerald-50/50 shadow-sm' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="relative flex items-center pt-0.5">
                    <input
                      type="checkbox"
                      id={item.id}
                      checked={alerts[item.id as keyof typeof alerts]}
                      onChange={(e) => setAlerts({...alerts, [item.id]: e.target.checked})}
                      className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-emerald-50 cursor-pointer transition-colors"
                    />
                  </div>
                  <label htmlFor={item.id} className="cursor-pointer flex-1">
                    <span className="block font-sans font-black text-slate-800 text-sm mb-1">{item.label}</span>
                    <span className="block font-sans text-xs font-semibold text-slate-500 leading-relaxed">{item.desc}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 mt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-sans text-sm font-black text-white transition-all duration-300 transform active:scale-95 ${
                saved 
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' 
                  : 'bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30'
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  {t('Saved Successfully', 'کامیابی سے محفوظ ہو گیا')}
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  {t('Save Configurations', 'ترتیبات محفوظ کریں')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

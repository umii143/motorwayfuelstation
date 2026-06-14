import React, { useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Info, Database, DollarSign, Wallet, FileText } from 'lucide-react';
import { Product, BankAccount, Pump } from '../../../types';
import { t as translate } from '../../../lib/translations';
import { useStation } from '../../../contexts/StationContext';

interface UnifiedAccountManagerProps {
  products: Product[];
  banks: BankAccount[];
  pumps: Pump[];
  language: string;
  onUpdateProducts?: (products: Product[]) => void;
  onUpdateBanks?: (banks: BankAccount[]) => void;
  onUpdatePumps?: (pumps: Pump[]) => void;
  onLogAudit: (category: string, action: string, details: string) => void;
}

export default function UnifiedAccountManager({
  products,
  banks,
  pumps,
  language,
  onUpdateProducts,
  onUpdateBanks,
  onUpdatePumps,
  onLogAudit
}: UnifiedAccountManagerProps) {
  const { showConfirm, showToast } = useStation();
  const t = (en: string, ur: string) => translate(en, ur, language);

  // Active sub-tab state inside this module
  const [subTab, setSubTab] = useState<'products' | 'banks' | 'digital'>('banks');

  // ==========================================
  // PRODUCTS SUBSECTION
  // ==========================================
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({ name: '', urduName: '', type: 'fuel' as any, rate: 250, unit: 'Litre', currentStock: 0, minStock: 500 });
  const [showProductForm, setShowProductForm] = useState<boolean>(false);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdForm({ name: '', urduName: '', type: 'fuel', rate: 250, unit: 'Litre', currentStock: 0, minStock: 500 });
    setShowProductForm(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdForm({
      name: p.name,
      urduName: p.urduName || p.name,
      type: p.type || 'fuel',
      rate: p.rate || 0,
      unit: p.unit || 'Litre',
      currentStock: p.currentStock || 0,
      minStock: p.minStock || 500
    });
    setShowProductForm(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProducts) return;

    if (editingProduct) {
      const updated = products.map(p => p.id === editingProduct.id ? { ...p, ...prodForm } : p);
      onUpdateProducts(updated);
      onLogAudit('Product', 'Update', `Product "${prodForm.name}" updated with rate Rs. ${prodForm.rate}.`);
    } else {
      const newPro: Product = {
        id: 'prod_' + Date.now(),
        ...prodForm
      };
      onUpdateProducts([...products, newPro]);
      onLogAudit('Product', 'Create', `New Product "${prodForm.name}" was registered under rate Rs. ${prodForm.rate}.`);
    }
    setShowProductForm(false);
    showToast(t('Product records successfully logged!', 'پراڈکٹ معلومات کامیابی سے محفوظ ہو گئیں!'), 'success');
  };

  const handleDeleteProduct = (id: string) => {
    if (!onUpdateProducts) return;
    showConfirm(
      t('Confirm Product Deletion', 'پراڈکٹ حذف کرنے کی تصدیق کریں'),
      t('Are you sure you want to delete this product catalog?', 'کیا آپ واقعی اس پراڈکٹ کو حذف کرنا چاہتے ہیں؟'),
      () => {
        const p = products.find(prod => prod.id === id);
        onUpdateProducts(products.filter(prod => prod.id !== id));
        onLogAudit('Product', 'Delete', `Product "${p?.name}" catalog deleted manually.`);
        showToast(t('Product deleted successfully.', 'رکارڈ حذف کر دیا گیا۔'), 'success');
      }
    );
  };

  // ==========================================
  // BANK ACCOUNTS SUBSECTION (Compound Name mapping)
  // ==========================================
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankForm, setBankForm] = useState({ bankName: '', accountNo: '', accountTitle: '', balance: 0 });
  const [showBankForm, setShowBankForm] = useState<boolean>(false);

  const handleOpenAddBank = () => {
    setEditingBank(null);
    setBankForm({ bankName: '', accountNo: '', accountTitle: '', balance: 0 });
    setShowBankForm(true);
  };

  const handleOpenEditBank = (b: BankAccount) => {
    setEditingBank(b);
    const [bankName, ...titleParts] = b.name.split(' | ');
    setBankForm({
      bankName: bankName || b.name,
      accountNo: b.accountNo,
      accountTitle: titleParts.join(' | ') || 'General Account',
      balance: b.balance
    });
    setShowBankForm(true);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateBanks) return;

    const compoundName = `${bankForm.bankName} | ${bankForm.accountTitle}`;

    if (editingBank) {
      const updated = banks.map(b => b.id === editingBank.id ? { ...b, name: compoundName, accountNo: bankForm.accountNo, balance: bankForm.balance } : b);
      onUpdateBanks(updated);
      onLogAudit('Bank', 'Update', `Bank account "${bankForm.bankName}" updated. Title: ${bankForm.accountTitle}. Balance: Rs. ${bankForm.balance}.`);
    } else {
      const newBank: BankAccount = {
        id: 'bank_' + Date.now(),
        name: compoundName,
        accountNo: bankForm.accountNo,
        balance: bankForm.balance
      };
      onUpdateBanks([...banks, newBank]);
      onLogAudit('Bank', 'Create', `New Bank account "${bankForm.bankName}" registered. Opening: Rs. ${bankForm.balance}.`);
    }
    setShowBankForm(false);
    showToast(t('Bank account records saved!', 'بینک اکاؤنٹ ریکارڈ محفوظ کر لیا گیا!'), 'success');
  };

  const handleDeleteBank = (id: string) => {
    if (!onUpdateBanks) return;
    showConfirm(
      t('Confirm Account Deletion', 'بینک اکاؤنٹ حذف کرنے کی تصدیق کریں'),
      t('Are you sure you want to delete this bank ledger account?', 'کیا آپ واقعی اس بینک اکاؤنٹ ریکارڈ کو حذف کرنا چاہتے ہیں؟'),
      () => {
        const targetBank = banks.find(b => b.id === id);
        onUpdateBanks(banks.filter(b => b.id !== id));
        onLogAudit('Bank', 'Delete', `Bank Account "${targetBank?.name.split(' | ')[0]}" (A/C: ${targetBank?.accountNo}) deleted manually.`);
        showToast(t('Bank Account removed from station system.', 'بینک اکاؤنٹ ریکارڈ حذف کر دیا گیا۔'), 'success');
      }
    );
  };

  // ==========================================
  // DIGITAL PAYMENT HANDLERS
  // ==========================================
  const digitalWallets = banks.filter(b => {
    const lname = b.name.toLowerCase();
    return lname.includes('easypaisa') || lname.includes('jazzcash') || lname.includes('digital') || lname.includes('nayapay');
  });
  const normalBanks = banks.filter(b => !digitalWallets.includes(b));

  const [walletForm, setWalletForm] = useState({ provider: 'EasyPaisa Merchant', merchantTitle: '', tillNumber: '', balance: 0 });
  const [showWalletForm, setShowWalletForm] = useState<boolean>(false);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);

  const handleOpenAddWallet = () => {
    setEditingWalletId(null);
    setWalletForm({ provider: 'EasyPaisa Merchant', merchantTitle: '', tillNumber: '', balance: 0 });
    setShowWalletForm(true);
  };

  const handleOpenEditWallet = (b: BankAccount) => {
    setEditingWalletId(b.id);
    const [provider, ...titleParts] = b.name.split(' | ');
    setWalletForm({
      provider: provider || b.name,
      merchantTitle: titleParts.join(' | ') || 'Merchant Wallet',
      tillNumber: b.accountNo,
      balance: b.balance
    });
    setShowWalletForm(true);
  };

  const handleSaveWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateBanks) return;

    const compoundName = `${walletForm.provider} | ${walletForm.merchantTitle}`;

    const mappedBankForm: BankAccount = {
      id: editingWalletId || 'wallet_' + Date.now(),
      name: compoundName,
      accountNo: walletForm.tillNumber,
      balance: walletForm.balance
    };

    if (editingWalletId) {
      const updated = banks.map(b => b.id === editingWalletId ? mappedBankForm : b);
      onUpdateBanks(updated);
      onLogAudit('DigitalWallet', 'Update', `Wallet provider "${walletForm.provider}" till ${walletForm.tillNumber} was updated.`);
    } else {
      onUpdateBanks([...banks, mappedBankForm]);
      onLogAudit('DigitalWallet', 'Create', `New digital wallet "${walletForm.provider}" linked successfully.`);
    }

    setShowWalletForm(false);
    showToast(t('Digital merchant wallet settings saved successfully!', 'ڈیجیٹل والٹ کامیابی سے محفوظ ہو گیا!'), 'success');
  };

  return (
    <div className="space-y-6">
      {/* SECTION TABS HEADER */}
      <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200 gap-1.5 select-none self-start">
        <button
          onClick={() => setSubTab('banks')}
          className={`flex-1 py-1.5 px-3 rounded-md font-sans text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'banks' ? 'bg-white text-slate-850 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('🏦 Traditional Bank Ledgers', '🏦 بینک اکاؤنٹس')}
        </button>

        <button
          onClick={() => setSubTab('digital')}
          className={`flex-1 py-1.5 px-3 rounded-md font-sans text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'digital' ? 'bg-white text-slate-850 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('📲 Mobile Merchant Wallets', '📲 موبائل والٹس')}
        </button>

        <button
          onClick={() => setSubTab('products')}
          className={`flex-1 py-1.5 px-3 rounded-md font-sans text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'products' ? 'bg-white text-slate-850 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('📦 Station Physical Inventory Catalog', '📦 فیول و لیوبریکنٹ آئٹمز')}
        </button>
      </div>

      {/* ======================= BANK TAB PANEL ======================= */}
      {subTab === 'banks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Current Corporate Accounts:', 'دفتر کے بینک اکاؤنٹس کی فہرست :')}</h4>
            {!showBankForm && (
              <button
                onClick={handleOpenAddBank}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>{t('Register New Bank', 'نیا بینک اکاؤنٹ درج کریں')}</span>
              </button>
            )}
          </div>

          {showBankForm ? (
            /* SEPARATED SAVING AND UPDATING ACCOUNT SECTION */
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6 p-4 rounded-xl border border-emerald-250 bg-emerald-50/5 animate-fade-in">
              <form onSubmit={handleSaveBank} className="space-y-3 font-sans text-xs text-slate-650">
                <h5 className="font-bold text-slate-800 uppercase tracking-tight text-[11px] border-b border-dashed border-slate-100 pb-1 flex items-center gap-1">
                  <Database className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{editingBank ? t('UPDATE SELECTED REGISTER', 'بینک اکاؤنٹ تبدیل کریں (Update)') : t('SAVE NEW BANK LEDGER', 'نیا بینک اکاؤنٹ محفوظ کریں (SaveNew)')}</span>
                </h5>

                <div className="space-y-1">
                  <label className="font-bold block">{t('Commercial Bank Name:', 'بینک کا نام:')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Allied Bank Limited (ABL)"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    className="w-full rounded border border-slate-200 bg-white p-2 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block">{t('Account Number/IBAN:', 'بینک اکاؤنٹ نمبر (IBAN):')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PK83 ABL 1029 3847 2831"
                    value={bankForm.accountNo}
                    onChange={(e) => setBankForm({ ...bankForm, accountNo: e.target.value })}
                    className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block">{t('Registered Account Title:', 'کھاتہ دار کا نام (Title):')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sajid Mahmood Petroleum Traders"
                    value={bankForm.accountTitle}
                    onChange={(e) => setBankForm({ ...bankForm, accountTitle: e.target.value })}
                    className="w-full rounded border border-slate-200 bg-white p-2 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block">{t('Audit Initial Ledger Balance (Rs):', 'ابتدائی کتابی بیلنس (روپے):')}</label>
                  <input
                    type="number"
                    required
                    value={bankForm.balance}
                    onChange={(e) => setBankForm({ ...bankForm, balance: Number(e.target.value) })}
                    className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t mt-3">
                  <button type="button" onClick={() => setShowBankForm(false)} className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase">{t('Cancel', 'کینسل')}</button>
                  <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-extrabold uppercase shadow-2xs">{editingBank ? t('Apply Changes', 'تبدیلی لاگو کریں') : t('Save Parameters', 'محفوظ کریں')}</button>
                </div>
              </form>

              {/* IN-LINE REALISTIC CHEQUE-CARD STYLE PREVIEW */}
              <div className="flex flex-col items-center justify-center p-4 border border-slate-250 bg-gradient-to-br from-slate-905 from-slate-900 to-slate-800 rounded-xl text-white relative overflow-hidden shadow-md select-none h-56 self-center">
                <div className="w-full flex justify-between items-start">
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase tracking-widest font-bold">{t('Commercial Ledger Card', 'کمرشل بینک لیجر کارڈ')}</span>
                    <strong className="block text-sm font-sans mt-0.5 tracking-tight">{bankForm.bankName || t('Bank Title Placeholder', 'بینک کا نام')}</strong>
                  </div>
                  <Database className="h-6 w-6 text-slate-500" />
                </div>

                <div className="w-full mt-6">
                  <span className="block text-[8px] text-slate-400 uppercase tracking-widest">{t('Account Holder Title', 'کھاتہ دار')}</span>
                  <strong className="block text-xs uppercase tracking-tight mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{bankForm.accountTitle || t('SAJID MAHMOOD PETROLEUM', 'لاگو دفتری ٹائٹل')}</strong>
                </div>

                <div className="w-full flex justify-between items-end mt-6">
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase tracking-widest">{t('Account Number/IBAN', 'کھاتہ نمبر')}</span>
                    <span className="block font-mono text-[10px] break-all tracking-wide">{bankForm.accountNo || 'PK00 XXXX XXXXXXX XXXXX'}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] text-slate-400 uppercase tracking-widest">{t('Active Ledger Balance', 'دفتری بیلنس')}</span>
                    <strong className="block font-mono text-emerald-450 text-emerald-400 text-sm">Rs. {(bankForm.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {normalBanks.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-slate-400 text-xs border border-dashed rounded-xl bg-white">{t('No registered traditional bank accounts yet.', 'کوئی عمومی بینک اکاؤنٹ رجسٹرڈ نہیں ہے۔')}</div>
              ) : (
                normalBanks.map(b => {
                  const [bankName, ...titleParts] = b.name.split(' | ');
                  const bankNameVal = bankName || b.name;
                  const titleVal = titleParts.join(' | ') || 'Business Account';

                  return (
                    <div key={b.id} className="rounded-xl border border-slate-205 bg-white p-4 shadow-2xs hover:shadow-xs flex justify-between items-center transition-shadow">
                      <div>
                        <div className="text-[10px] bg-slate-150 text-slate-700 px-2.5 py-0.5 inline-block rounded-full font-mono font-bold uppercase">{bankNameVal}</div>
                        <h4 className="font-sans font-bold text-slate-800 text-xs mt-1.5 uppercase leading-none">{titleVal}</h4>
                        <div className="font-mono text-[10px] text-slate-400 mt-2">{b.accountNo}</div>
                      </div>
                      <div className="text-right flex flex-col justify-between h-20 items-end">
                        <strong className="font-mono text-xs text-slate-900 block">Rs. {b.balance?.toLocaleString()}</strong>
                        <div className="flex gap-2 select-none">
                          <button onClick={() => handleOpenEditBank(b)} className="text-[11px] font-bold text-orange-655 text-orange-600 hover:text-orange-800 inline-flex items-center gap-0.5 cursor-pointer">
                            <Edit className="h-3 w-3" />
                            <span>{t('Edit', 'تبدیل')}</span>
                          </button>
                          <button onClick={() => handleDeleteBank(b.id)} className="text-[11px] font-bold text-red-500 hover:text-red-700 inline-flex items-center gap-0.5 cursor-pointer">
                            <Trash2 className="h-3 w-3" />
                            <span>{t('Delete', 'حذف')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================= DIGITAL WALLET PANEL ======================= */}
      {subTab === 'digital' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Mobile Wallets Account List:', 'موبائل والٹ اور ٹیلی کام تجارتی کھاتہ جات :')}</h4>
            {!showWalletForm && (
              <button
                onClick={handleOpenAddWallet}
                className="px-3 py-1 bg-violet-605 bg-violet-600 hover:bg-violet-700 text-white font-sans text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>{t('Link Mobile Wallet', 'نیا موبائل والٹ شامل کریں')}</span>
              </button>
            )}
          </div>

          {showWalletForm ? (
            /* SEPARATED SAVING AND UPDATING MOBILE SECTION */
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6 p-4 rounded-xl border border-violet-250 bg-violet-50/5 animate-fade-in">
              <form onSubmit={handleSaveWallet} className="space-y-3 font-sans text-xs text-slate-650">
                <h5 className="font-bold text-slate-800 uppercase tracking-tight text-[11px] border-b border-dashed border-slate-100 pb-1 flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5 text-violet-600" />
                  <span>{editingWalletId ? t('UPDATE MOBILE GATEWAY', 'موبائل والٹ تبدیل کریں (Update)') : t('SAVE NEW DIGITAL WALLET', 'نیا موبائل والٹ رجسٹر کریں (SaveNew)')}</span>
                </h5>

                <div className="space-y-1">
                  <label className="font-bold block">{t('Digital Gateway Provider:', 'ڈیجیٹل والٹ سروس پرووائیڈر:')}</label>
                  <select
                    value={walletForm.provider}
                    onChange={(e) => setWalletForm({ ...walletForm, provider: e.target.value })}
                    className="w-full rounded border border-slate-200 bg-white p-2 text-xs"
                  >
                    <option value="EasyPaisa Merchant Wallet">EasyPaisa Merchant</option>
                    <option value="JazzCash Retail General">JazzCash General</option>
                    <option value="NayaPay Business POS">NayaPay Business POS</option>
                    <option value="HBL Konnect Mobile Agent">HBL Konnect Agent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold block">{t('Till Merchant ID / SIM SIM No:', 'مرچنٹ ٹِل نمبر یا سم کارڈ نمبر:')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Till No: 102938 / 03001234567"
                    value={walletForm.tillNumber}
                    onChange={(e) => setWalletForm({ ...walletForm, tillNumber: e.target.value })}
                    className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block">{t('Merchant Business Title Setup:', 'کاروباری ٹائٹل یا مالک کا نام:')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAJID PETRO PETROLEUM SERVICE"
                    value={walletForm.merchantTitle}
                    onChange={(e) => setWalletForm({ ...walletForm, merchantTitle: e.target.value })}
                    className="w-full rounded border border-slate-200 bg-white p-2 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block">{t('Audit Active Balance (Rs):', 'موجودہ والٹ بیلنس (Rs):')}</label>
                  <input
                    type="number"
                    required
                    value={walletForm.balance}
                    onChange={(e) => setWalletForm({ ...walletForm, balance: Number(e.target.value) })}
                    className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t mt-3">
                  <button type="button" onClick={() => setShowWalletForm(false)} className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase">{t('Cancel', 'کینسل')}</button>
                  <button type="submit" className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-extrabold uppercase shadow-2xs">{editingWalletId ? t('Apply Changes', 'تغیر لاگو کریں') : t('Save Parameters', 'محفوظ کریں')}</button>
                </div>
              </form>

              {/* IN-LINE MOBILE OVERLAY RECEIPT MOCKUP PREVIEW */}
              <div className="flex flex-col items-center justify-center p-4 border border-slate-200 bg-slate-900 rounded-2xl relative shadow-lg min-h-[220px] select-none text-[11px] font-mono text-slate-300 w-64 mx-auto self-center">
                <div className="absolute top-1 right-2 uppercase font-sans text-[7px] text-emerald-500 font-bold tracking-widest flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span>{t('GPRS Connected', 'آن لائن')}</span>
                </div>
                
                <div className="w-full text-center border-b border-dashed border-slate-700 pb-2 mb-2">
                  <span className="block text-white font-sans font-black uppercase text-[10px] tracking-tight">{walletForm.provider}</span>
                  <span className="block text-[9px] text-slate-400 mt-1">{t('Till Account:', 'مرچنٹ اکاؤنٹ:')} {walletForm.tillNumber || 'XXXXXX'}</span>
                </div>

                <div className="w-full space-y-1 text-[10px] text-slate-300">
                  <div className="flex justify-between">
                    <span>{t('MERCHANT TITLE:', 'کھاتہ دار ٹائٹل:')}</span>
                    <strong className="text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-full max-w-[120px]">{walletForm.merchantTitle || 'NOT SET'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('STATUS SECURE:', 'سیکیورٹی پیرامیٹر:')}</span>
                    <strong className="text-teal-400">MD5 DIGITAL GATE</strong>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-700 pt-2 mt-2">
                    <span className="font-sans text-[8px] text-slate-400 uppercase">{t('TILL WALLET BALANCE', 'موجودہ بیلنس')}</span>
                    <strong className="text-emerald-400 font-bold text-xs">Rs. {walletForm.balance.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="w-full pt-3 mt-3 border-t border-dashed border-slate-705 text-center text-[7px] text-slate-500 font-sans uppercase">
                  {t('Sajid Mahmood Petrol Station POS System', 'ساجد محمود فیمین پٹرولیم سروس پشاور')}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {digitalWallets.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-slate-400 text-xs border border-dashed rounded-xl bg-white">{t('No mobile wallets registered in system.', 'کوئی موبائل یا ڈیجیٹل تجارتی والٹ درج نہیں ہے۔')}</div>
              ) : (
                digitalWallets.map(w => {
                  const [provider, ...titleParts] = w.name.split(' | ');
                  const provVal = provider || w.name;
                  const titleVal = titleParts.join(' | ') || 'Merchant Wallet';

                  return (
                    <div key={w.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs flex justify-between items-center border-l-4 border-l-violet-605 border-l-violet-600 transition-shadow">
                      <div>
                        <div className="text-[9px] bg-violet-100 text-violet-850 px-2 py-0.5 inline-block rounded font-bold uppercase font-mono">{provVal}</div>
                        <h4 className="font-sans font-bold text-slate-800 text-xs mt-1.5 uppercase leading-none">{titleVal}</h4>
                        <div className="font-mono text-[10px] text-slate-400 mt-1.5">{t('Till Number:', 'ٹِل نمبر / سم:')} {w.accountNo}</div>
                      </div>
                      <div className="text-right flex flex-col justify-between h-20 items-end">
                        <strong className="font-mono text-xs text-slate-900 block font-black">Rs. {w.balance?.toLocaleString()}</strong>
                        <div className="flex gap-2 select-none">
                          <button onClick={() => handleOpenEditWallet(w)} className="text-[11px] font-bold text-orange-655 text-orange-600 hover:text-orange-850 inline-flex items-center gap-0.5 cursor-pointer">
                            <Edit className="h-3 w-3" />
                            <span>{t('Edit', 'تبدیل')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================= PRODUCTS CATALOGUE PANEL ======================= */}
      {subTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Fuel & Lubricants Catalog Setup:', 'اسٹیشن انونٹری اور سیلز کیٹلاگ لسٹ :')}</h4>
            {!showProductForm && (
              <button
                onClick={handleOpenAddProduct}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>{t('Add Stock Item', 'کیٹلاگ مصنوع شامل کریں')}</span>
              </button>
            )}
          </div>

          {showProductForm ? (
            /* SEPARATED SAVING AND UPDATING PRODUCT SECTION */
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6 p-4 rounded-xl border border-orange-250 bg-orange-50/5 animate-fade-in">
              <form onSubmit={handleSaveProduct} className="space-y-3 font-sans text-xs text-slate-655">
                <h5 className="font-bold text-slate-800 uppercase tracking-tight text-[11px] border-b border-dashed border-slate-100 pb-1 flex items-center gap-1">
                  <Database className="h-3.5 w-3.5 text-orange-600" />
                  <span>{editingProduct ? t('UPDATE INVENTORY SKU', 'کیٹلاگ کارڈ ترمیم کریں (Update)') : t('REGISTER NEW PRODUCT BRAND', 'کیٹلاگ مصنوع درج کریں (SaveNew)')}</span>
                </h5>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold block">{t('Product Name (English):', 'پراڈکٹ نام (English):')}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. High Octane (HOBC)"
                      value={prodForm.name}
                      onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                      className="w-full rounded border border-slate-200 bg-white p-2 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold block">{t('Product Name (Urdu):', 'پراڈکٹ نام (Urdu):')}</label>
                    <input
                      type="text"
                      required
                      placeholder="High Octane ہائی اوکٹین"
                      value={prodForm.urduName}
                      onChange={(e) => setProdForm({ ...prodForm, urduName: e.target.value })}
                      className="w-full rounded border border-slate-205 bg-white p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold block">{t('Category Classification:', 'آئٹم کیٹیگری ٹائپ:')}</label>
                    <select
                      value={prodForm.type}
                      onChange={(e) => setProdForm({ ...prodForm, type: e.target.value as any })}
                      className="w-full rounded border border-slate-200 bg-white p-2 text-xs font-sans"
                    >
                      <option value="fuel">{t('Fuel (Petrol/Diesel/CNG)', 'پٹرول ڈیزل مائع')}</option>
                      <option value="lube">{t('Lubricants / Mobile Oils', 'لیوبریکنٹس آئل')}</option>
                      <option value="other">{t('Station General Grocery', 'جنرل اسٹور آئٹم')}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold block">{t('Aggregate Standard unit:', 'پیمائش کی اکائی (Unit):')}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Litre, Box, Can, Kg"
                      value={prodForm.unit}
                      onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                      className="w-full rounded border border-slate-200 bg-white p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold block">{t('Retail tariff (Rs):', 'فی اکائی قیمت (Rs):')}</label>
                    <input
                      type="number"
                      required
                      value={prodForm.rate}
                      onChange={(e) => setProdForm({ ...prodForm, rate: Number(e.target.value) })}
                      className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold block">{t('Initial Catalog Stock:', 'ابتدائی اسٹاک مقدار:')}</label>
                    <input
                      type="number"
                      required
                      value={prodForm.currentStock}
                      onChange={(e) => setProdForm({ ...prodForm, currentStock: Number(e.target.value) })}
                      className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold block">{t('Alarm levels (L/Nos):', 'الارم ریفرنس لمٹ:')}</label>
                    <input
                      type="number"
                      required
                      value={prodForm.minStock}
                      onChange={(e) => setProdForm({ ...prodForm, minStock: Number(e.target.value) })}
                      className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t mt-3">
                  <button type="button" onClick={() => setShowProductForm(false)} className="px-3 py-1 bg-slate-105 rounded text-xs font-bold uppercase">{t('Cancel', 'کینسل')}</button>
                  <button type="submit" className="px-4 py-1.5 bg-orange-600 text-white rounded text-xs font-extrabold uppercase shadow-2xs">{editingProduct ? t('Update Record', 'ترمیم لاگو کریں') : t('Save SKU', 'محفوظ کریں')}</button>
                </div>
              </form>

              {/* IN-LINE LIVE PRODUCT CARD MOCKUP PREVIEW */}
              <div className="rounded-xl border border-dashed border-slate-250 p-4 bg-slate-50 flex flex-col justify-between select-none font-sans text-xs text-slate-650 h-56 self-center">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 font-bold uppercase rounded">{t('SKU Item Preview', 'کارڈ پری ویو')}</span>
                    <strong className="font-mono text-xs text-orange-650 uppercase font-bold">{prodForm.type}</strong>
                  </div>
                  <h4 className="font-bold text-slate-850 text-sm mt-3 uppercase tracking-tight">{prodForm.name || t('Product Name (English)', 'سامان کا نام')}</h4>
                  <span className="block text-slate-450 font-medium text-[11px] mt-0.5">{prodForm.urduName || t('سامان کا اردو نام', 'سامان کا اردو نام')}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 border-t border-dashed border-slate-200 pt-3">
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase tracking-widest">{t('Current retail rate:', 'سیلز ریٹ:')}</span>
                    <strong className="block font-sans text-xs text-slate-800">Rs. {prodForm.rate} / {prodForm.unit}</strong>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] text-slate-400 uppercase tracking-widest">{t('Catalog Stock levels:', 'ابتدائی انونٹری اسٹاک:')}</span>
                    <strong className="block font-mono text-xs text-emerald-600 font-bold">{(prodForm.currentStock || 0).toLocaleString()} {prodForm.unit}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {products.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-slate-400 text-xs border border-dashed rounded-xl bg-white">{t('No registered product catalogues yet.', 'کوئی بھی مصنوعات رجسٹرڈ نہیں ہے۔')}</div>
              ) : (
                products.map(p => (
                  <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs flex justify-between items-center transition-shadow">
                    <div>
                      <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5. inline-block rounded font-black uppercase font-mono">{p.type}</div>
                      <h4 className="font-sans font-bold text-slate-800 text-xs mt-1.5 uppercase leading-none">{t(p.name, p.urduName)}</h4>
                      <p className="text-[10.5px] text-slate-500 mt-1">{t('Tariff:', 'سیلز ریٹ :')} Rs. {p.rate?.toFixed(2)} / {p.unit}</p>
                    </div>
                    <div className="text-right flex flex-col justify-between h-16 items-end">
                      <div className="text-[10.5px] text-slate-450 leading-none">{t('In Stock Inventory:', 'موجودہ اسٹاک:')} <strong className="font-mono text-xs text-slate-800 font-bold">{(p.currentStock || 0).toLocaleString()} {p.unit}</strong></div>
                      <div className="flex gap-2 select-none mt-2">
                        <button onClick={() => handleOpenEditProduct(p)} className="text-[11px] font-bold text-orange-655 text-orange-600 hover:text-orange-850 inline-flex items-center gap-0.5 cursor-pointer">
                          <Edit className="h-3 w-3" />
                          <span>{t('Edit', 'تبدیل')}</span>
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-[11px] font-bold text-red-500 hover:text-red-700 inline-flex items-center gap-0.5 cursor-pointer">
                          <Trash2 className="h-3 w-3" />
                          <span>{t('Delete', 'حذف')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

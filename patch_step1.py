import re

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find from step 1 start to step 2 start
pattern = r'\{\s*/\*\s*==========================================\s*STEP 1: SHIFT SETUP & INITIALS.*?(?=\{\s*/\*\s*==========================================\s*STEP 2: OPENING NOZZLES METER CORRELATION)'

replacement = """      {/* ==========================================
          STEP 1: SHIFT SETUP & INITIALS
          ========================================== */}
      {wizardStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in pb-12">
          {/* Top Info Cards (4 columns) */}
          <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Opening Cash Float", "ابتدائی کیش فلوٹ")}</p>
              <h4 className="mt-2 text-2xl font-black text-slate-100 flex items-baseline gap-1">
                <span className="text-sm font-bold text-slate-500">PKR</span>
                20,000
              </h4>
            </div>
            
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Expected Sales", "متوقع سیلز")}</p>
              <h4 className="mt-2 text-2xl font-black text-slate-100 flex items-baseline gap-1">
                <span className="text-sm font-bold text-slate-500">PKR</span>
                78,650
              </h4>
            </div>
            
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Operator Risk Score", "آپریٹر رسک اسکور")}</p>
              <div className="flex items-center gap-3 mt-2">
                <h4 className="text-xl font-black text-emerald-400">{t("Low Risk", "کم خطرہ")}</h4>
                <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2 py-1 rounded-full">{t("Trust: 92%", "اعتماد: 92%")}</span>
              </div>
            </div>
            
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Active Shifts Today", "آج کی سرگرم شفٹیں")}</p>
              <h4 className="mt-2 text-2xl font-black text-slate-100 flex items-baseline gap-2">
                3
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+1 new</span>
              </h4>
            </div>
          </div>

          {/* Left Column: Staff Selection */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-700/50 bg-slate-900/50 p-6 shadow-sm h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none"></div>
            
            <div className="mb-6 flex items-center gap-3 relative z-10">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20">
                1
              </div>
              <h3 className="font-sans text-xl font-black text-slate-100 tracking-tight">
                {t("Select Operator", "آپریٹر کا انتخاب کریں")}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar relative z-10 max-h-[500px]">
              {staff
                .filter((st) => st.active)
                .map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      haptic.light();
                      setSelectedStaffId(s.id);
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition-all duration-200 group ${
                      selectedStaffId === s.id
                        ? "border-orange-500/50 bg-orange-500/10 shadow-md shadow-orange-500/5 ring-1 ring-orange-500/50"
                        : "border-slate-700/50 bg-slate-800/30 hover:border-orange-500/30 hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-300">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1e293b&color=f97316&bold=true`} alt={s.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className={`font-sans text-sm font-bold tracking-wide transition-colors ${selectedStaffId === s.id ? 'text-orange-400' : 'text-slate-200 group-hover:text-slate-100'}`}>
                          {settings.language === "en" ? s.name : s.urduName}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                          {t(s.role.toUpperCase(), s.role)}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center justify-center h-6 w-6 rounded-full transition-all duration-300 ${selectedStaffId === s.id ? 'bg-orange-500 text-white scale-100' : 'bg-slate-800 border border-slate-700 text-transparent scale-90 opacity-50 group-hover:border-slate-600'}`}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Middle Column: Configuration */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-700/50 bg-slate-900/50 p-6 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>

            <div className="mb-6 flex items-center gap-3 relative z-10">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-500/20">
                2
              </div>
              <h3 className="font-sans text-xl font-black text-slate-100 tracking-tight">
                {t("Shift Configuration", "شفٹ کی ترتیب منتخب کریں")}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              <div 
                onClick={() => setShiftType("day")}
                className={`relative flex flex-col items-center justify-center text-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 group ${
                  shiftType === "day" 
                    ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5" 
                    : "border-slate-700/50 bg-slate-800/30 hover:border-blue-500/30 hover:bg-slate-800/80"
                }`}
              >
                <div className={`p-4 rounded-full transition-colors duration-300 shadow-inner ${shiftType === 'day' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-500 group-hover:text-blue-400'}`}>
                  <Sun className="w-8 h-8" />
                </div>
                <div>
                  <p className={`font-black text-lg tracking-wide ${shiftType === 'day' ? 'text-blue-400' : 'text-slate-300'}`}>
                    {t("Day Shift", "دن کی شفٹ")}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">06:00 AM → 06:00 PM</p>
                </div>
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${shiftType === 'day' ? 'border-blue-500 bg-blue-500' : 'border-slate-600 bg-slate-800'}`}>
                  {shiftType === 'day' && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                </div>
              </div>

              <div 
                onClick={() => setShiftType("night")}
                className={`relative flex flex-col items-center justify-center text-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 group ${
                  shiftType === "night" 
                    ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5" 
                    : "border-slate-700/50 bg-slate-800/30 hover:border-indigo-500/30 hover:bg-slate-800/80"
                }`}
              >
                <div className={`p-4 rounded-full transition-colors duration-300 shadow-inner ${shiftType === 'night' ? 'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-500 group-hover:text-indigo-400'}`}>
                  <Moon className="w-8 h-8" />
                </div>
                <div>
                  <p className={`font-black text-lg tracking-wide ${shiftType === 'night' ? 'text-indigo-400' : 'text-slate-300'}`}>
                    {t("Night Shift", "رات کی شفٹ")}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">06:00 PM → 06:00 AM</p>
                </div>
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${shiftType === 'night' ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600 bg-slate-800'}`}>
                  {shiftType === 'night' && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 pt-6 border-t border-slate-700/50 relative z-10">
              <div className="group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  {t("Shift Date", "شفٹ کی تاریخ")}
                </label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-700/50 bg-slate-800/80 rounded-xl text-sm font-bold text-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                />
              </div>

              <div className="group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  {t("Start Time", "شروع کا وقت")}
                </label>
                <input
                  type="time"
                  value={shiftTime}
                  onChange={(e) => setShiftTime(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-700/50 bg-slate-800/80 rounded-xl text-sm font-bold text-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Summary & Start */}
          <div className="lg:col-span-3 rounded-3xl border border-slate-700/50 bg-slate-900/50 p-6 shadow-sm relative overflow-hidden flex flex-col h-full justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>

            <div>
              <div className="mb-6 flex items-center gap-3 relative z-10">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20">
                  3
                </div>
                <h3 className="font-sans text-xl font-black text-slate-100 tracking-tight">
                  {t("Verify & Start", "تصدیق اور شروع")}
                </h3>
              </div>

              <div className="flex flex-col gap-3 mb-8 relative z-10">
                <div className="flex items-center justify-between bg-slate-800/30 border border-slate-700/50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                      <Fuel className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Nozzles", "نوزلز")}</span>
                  </div>
                  <span className="text-lg font-black text-slate-200">{nozzles.length}</span>
                </div>
                
                <div className="flex items-center justify-between bg-slate-800/30 border border-slate-700/50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                      <BarChart2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Products", "پروڈکٹس")}</span>
                  </div>
                  <span className="text-lg font-black text-slate-200">{products.length}</span>
                </div>
                
                <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{t("Rates", "ریٹس")}</span>
                  </div>
                  <span className="text-sm font-black text-emerald-400">{t("Synced", "سنک")}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6 relative z-10">
                <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Info className="w-4 h-4" />
                </div>
                <p className="text-xs text-blue-300 leading-relaxed font-medium">
                  {t("You are about to start a new shift. Readings will be locked to this operator.", "آپ ایک نئی شفٹ شروع کرنے والے ہیں۔")}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedStaffId}
              onClick={handleStartShift}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5 text-center font-sans text-lg font-black text-white tracking-wide shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-1 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <span className="relative z-10">
                {isLubeBusiness
                  ? t("LAUNCH LUBE SHIFT", "نئی لیوب شفٹ شروع کریں")
                  : t("LAUNCH SHIFT", "نئی کاروباری شفٹ شروع کریں")}
              </span>
              <Play className="w-5 h-5 relative z-10 fill-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      )}
"""

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

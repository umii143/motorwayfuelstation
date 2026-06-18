import sys

with open('d:/newfuelstation5/fuelpro/orig_shiftwizard.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# STEP 1 Replacements
content = content.replace(
'''            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">{t("Opening Cash Float", "ابتدائی کیش فلوٹ")}</p>
              <h4 className="mt-1 text-xl font-bold text-slate-900">PKR 20,000</h4>
            </div>''',
'''            <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">{t("Opening Cash Float", "ابتدائی کیش فلوٹ")}</p>
              <h4 className="mt-1 text-xl font-bold text-slate-200">PKR 20,000</h4>
            </div>'''
)

content = content.replace(
'''            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">{t("Expected Sales", "متوقع سیلز")}</p>
              <h4 className="mt-1 text-xl font-bold text-slate-900">PKR 78,650</h4>
            </div>''',
'''            <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">{t("Expected Sales", "متوقع سیلز")}</p>
              <h4 className="mt-1 text-xl font-bold text-slate-200">PKR 78,650</h4>
            </div>'''
)

content = content.replace(
'''            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">{t("Operator Risk Score", "آپریٹر رسک اسکور")}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h4 className="text-xl font-bold text-emerald-600">{t("Low Risk", "کم خطرہ")}</h4>
                <span className="text-xs text-slate-500">{t("Trust Score: 92%", "اعتماد کا اسکور: 92%")}</span>
              </div>
            </div>''',
'''            <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">{t("Operator Risk Score", "آپریٹر رسک اسکور")}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h4 className="text-xl font-bold text-emerald-600">{t("Low Risk", "کم خطرہ")}</h4>
                <span className="text-xs text-slate-500">{t("Trust Score: 92%", "اعتماد کا اسکور: 92%")}</span>
              </div>
            </div>'''
)

content = content.replace(
'''            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">{t("Active Shifts Today", "آج کی سرگرم شفٹیں")}</p>
              <h4 className="mt-1 text-xl font-bold text-slate-900">3</h4>
            </div>''',
'''            <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">{t("Active Shifts Today", "آج کی سرگرم شفٹیں")}</p>
              <h4 className="mt-1 text-xl font-bold text-slate-200">3</h4>
            </div>'''
)

content = content.replace(
'''            {/* Left Column: Staff Selection */}
            <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-full flex flex-col">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm">
                  1
                </div>
                <h3 className="font-sans text-lg font-bold text-slate-800 tracking-tight">
                  {t("Select Operator", "آپریٹر کا انتخاب کریں")}
                </h3>
              </div>''',
'''            {/* Left Column: Staff Selection */}
            <div className="lg:col-span-4 rounded-3xl border border-slate-700/50 bg-slate-900/50 p-6 shadow-sm h-full flex flex-col">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-sm shadow-sm">
                  1
                </div>
                <h3 className="font-sans text-lg font-bold text-slate-100 tracking-tight">
                  {t("Select Operator", "آپریٹر کا انتخاب کریں")}
                </h3>
              </div>'''
)

content = content.replace(
'''                  <div
                    key={s.id}
                    onClick={() => {
                      haptic.light();
                      setSelectedStaffId(s.id);
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                      selectedStaffId === s.id
                        ? "border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500"
                        : "border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold uppercase shadow-sm">
                        {s.name.charAt(0)}
                      </div>''',
'''                  <div
                    key={s.id}
                    onClick={() => {
                      haptic.light();
                      setSelectedStaffId(s.id);
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                      selectedStaffId === s.id
                        ? "border-orange-500 bg-orange-500/10 shadow-sm ring-1 ring-orange-500"
                        : "border-slate-700/50 bg-slate-800/50 hover:border-orange-500/50 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 border border-slate-700 overflow-hidden shadow-sm">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1e293b&color=f97316&bold=true`} alt={s.name} className="w-full h-full object-cover" />
                      </div>'''
)

content = content.replace(
'''                      <div>
                        <p className={`font-sans text-sm font-bold ${selectedStaffId === s.id ? 'text-blue-900' : 'text-slate-700'}`}>
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-500">{s.role}</p>
                      </div>''',
'''                      <div>
                        <p className={`font-sans text-sm font-bold ${selectedStaffId === s.id ? 'text-orange-400' : 'text-slate-200'}`}>
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-400">{s.role}</p>
                      </div>'''
)

content = content.replace(
'''                    {selectedStaffId === s.id && (
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    )}''',
'''                    {selectedStaffId === s.id && (
                      <CheckCircle2 className="h-5 w-5 text-orange-500" />
                    )}'''
)

content = content.replace(
'''              {/* Shift Type Selection */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm">
                    2
                  </div>
                  <h3 className="font-sans text-lg font-bold text-slate-800 tracking-tight">
                    {t("Select Shift Configuration", "شفٹ کی ترتیب منتخب کریں")}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setShiftType("day")}
                    className={`relative flex flex-col items-center justify-center text-center gap-2 p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      shiftType === "day" 
                        ? "border-orange-500 bg-orange-50 shadow-md ring-4 ring-orange-50" 
                        : "border-slate-100 hover:border-orange-200 hover:bg-orange-50/30"
                    }`}
                  >
                    <div className="absolute top-4 right-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shiftType === 'day' ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
                        {shiftType === 'day' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className={`p-4 rounded-full ${shiftType === 'day' ? 'bg-orange-100 text-orange-500' : 'bg-slate-100 text-slate-400'} transition-colors mb-2`}>
                      <Sun className="w-8 h-8" />
                    </div>
                    <p className={`font-bold text-lg ${shiftType === 'day' ? 'text-orange-700' : 'text-slate-600'}`}>
                      {t("Day Shift (Morning)", "دن کی شفٹ")}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
                      06:00 AM → 06:00 PM • 12 Hours
                    </p>
                  </div>

                  <div 
                    onClick={() => setShiftType("night")}
                    className={`relative flex flex-col items-center justify-center text-center gap-2 p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      shiftType === "night" 
                        ? "border-indigo-500 bg-indigo-50 shadow-md ring-4 ring-indigo-50" 
                        : "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30"
                    }`}
                  >
                    <div className="absolute top-4 right-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shiftType === 'night' ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                        {shiftType === 'night' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="time"
                          value={shiftTime}
                          onChange={(e) => setShiftTime(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date & Time Settings inline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">''',
'''              {/* Shift Type Selection */}
              <div className="rounded-3xl border border-slate-700/50 bg-slate-900/50 p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-sm shadow-sm">
                    2
                  </div>
                  <h3 className="font-sans text-lg font-bold text-slate-100 tracking-tight">
                    {t("Select Shift Configuration", "شفٹ کی ترتیب منتخب کریں")}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setShiftType("day")}
                    className={`relative flex flex-col items-center justify-center text-center gap-2 p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      shiftType === "day" 
                        ? "border-orange-500 bg-orange-500/10 shadow-md ring-4 ring-orange-500/10" 
                        : "border-slate-700/50 hover:border-orange-500/50 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="absolute top-4 right-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shiftType === 'day' ? 'border-orange-500 bg-orange-500' : 'border-slate-600'}`}>
                        {shiftType === 'day' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className={`p-4 rounded-full ${shiftType === 'day' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-500'} transition-colors mb-2`}>
                      <Sun className="w-8 h-8" />
                    </div>
                    <p className={`font-bold text-lg ${shiftType === 'day' ? 'text-orange-400' : 'text-slate-300'}`}>
                      {t("Day Shift (Morning)", "دن کی شفٹ")}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 bg-slate-800/50 border border-slate-700 px-3 py-1 rounded-full">
                      06:00 AM → 06:00 PM • 12 Hours
                    </p>
                  </div>

                  <div 
                    onClick={() => setShiftType("night")}
                    className={`relative flex flex-col items-center justify-center text-center gap-2 p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      shiftType === "night" 
                        ? "border-indigo-500 bg-indigo-500/10 shadow-md ring-4 ring-indigo-500/10" 
                        : "border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="absolute top-4 right-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shiftType === 'night' ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'}`}>
                        {shiftType === 'night' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className={`p-4 rounded-full ${shiftType === 'night' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'} transition-colors mb-2`}>
                      <Moon className="w-8 h-8" />
                    </div>
                    <p className={`font-bold text-lg ${shiftType === 'night' ? 'text-indigo-400' : 'text-slate-300'}`}>
                      {t("Night Shift (Evening)", "رات کی شفٹ")}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 bg-slate-800/50 border border-slate-700 px-3 py-1 rounded-full">
                      06:00 PM → 06:00 AM • 12 Hours
                    </p>
                  </div>
                </div>

                {/* Date & Time Settings inline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-700/50">'''
)

content = content.replace(
'''                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {t("Shift Date", "شفٹ کی تاریخ")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="date"
                        value={shiftDate}
                        onChange={(e) => setShiftDate(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {t("Start Time", "شروع کا وقت")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="time"
                        value={shiftTime}
                        onChange={(e) => setShiftTime(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary & Start Button Row */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden flex flex-col h-full justify-between">
                <div>
                  <div className="mb-5 flex items-center gap-3 relative z-10">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm">
                      3
                    </div>
                    <h3 className="font-sans text-lg font-bold text-slate-800 tracking-tight">
                      {t("Verify & Start", "تصدیق اور شروع")}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-md px-2.5 py-1.5">
                      <Fuel className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">{nozzles.length} {t("Nozzles", "نوزلز")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-md px-2.5 py-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">{products.length} {t("Products", "پروڈکٹس")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-md px-2.5 py-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-700">{t("Rates Synced", "ریٹس سنک")}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 relative z-10">
                    <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Info className="w-4 h-4" />
                    </div>
                    <p className="text-sm text-blue-800 leading-snug font-medium">
                      {t("You are about to start a new shift. Please verify all details before proceeding. Once started, readings will be locked to this operator.", "آپ ایک نئی شفٹ شروع کرنے والے ہیں۔ براہ کرم آگے بڑھنے سے پہلے تمام تفصیلات کی تصدیق کریں۔")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selectedStaffId}
                  onClick={() => {
                    haptic.light();
                    setWizardStep(2);
                  }}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-center font-sans text-lg font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-3 group relative overflow-hidden"
                >''',
'''                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {t("Shift Date", "شفٹ کی تاریخ")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type="date"
                        value={shiftDate}
                        onChange={(e) => setShiftDate(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-700/50 bg-slate-800/50 rounded-lg text-sm text-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {t("Start Time", "شروع کا وقت")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type="time"
                        value={shiftTime}
                        onChange={(e) => setShiftTime(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-700/50 bg-slate-800/50 rounded-lg text-sm text-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary & Start Button Row */}
              <div className="rounded-3xl border border-slate-700/50 bg-slate-900/50 p-6 shadow-sm relative overflow-hidden flex flex-col h-full justify-between">
                <div>
                  <div className="mb-5 flex items-center gap-3 relative z-10">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-sm shadow-sm">
                      3
                    </div>
                    <h3 className="font-sans text-lg font-bold text-slate-100 tracking-tight">
                      {t("Verify & Start", "تصدیق اور شروع")}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                    <div className="flex items-center gap-1.5 bg-slate-800/50 border border-slate-700/50 rounded-md px-2.5 py-1.5">
                      <Fuel className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-300">{nozzles.length} {t("Nozzles", "نوزلز")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-800/50 border border-slate-700/50 rounded-md px-2.5 py-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-300">{products.length} {t("Products", "پروڈکٹس")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2.5 py-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-300">{t("Rates Synced", "ریٹس سنک")}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 relative z-10">
                    <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Info className="w-4 h-4" />
                    </div>
                    <p className="text-sm text-blue-200 leading-snug font-medium">
                      {t("You are about to start a new shift. Please verify all details before proceeding. Once started, readings will be locked to this operator.", "آپ ایک نئی شفٹ شروع کرنے والے ہیں۔ براہ کرم آگے بڑھنے سے پہلے تمام تفصیلات کی تصدیق کریں۔")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selectedStaffId}
                  onClick={() => {
                    haptic.light();
                    setWizardStep(2);
                  }}
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-center font-sans text-lg font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-3 group relative overflow-hidden"
                >'''
)

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

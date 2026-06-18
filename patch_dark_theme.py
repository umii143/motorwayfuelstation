import re

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'\{\s*/\*\s*==========================================\s*STEP 1: SHIFT SETUP & INITIALS.*?(?=\{\s*/\*\s*==========================================\s*STEP 2: OPENING NOZZLES METER CORRELATION)'

replacement = """      {/* ==========================================
          STEP 1: SHIFT SETUP & INITIALS
          ========================================== */}
      {wizardStep === 1 && (
        <div className="max-w-[1200px] mx-auto animate-fade-in space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Initiate New Shift Session</h2>
                <p className="text-sm text-slate-400 mt-0.5">Start your shift and manage your sales efficiently</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/50 px-4 py-2.5 rounded-xl shadow-sm backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Today's Date</p>
                <p className="text-sm font-bold text-white">{format(new Date(), "dd MMMM yyyy, EEEE")}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center border border-slate-600/50 ml-2">
                <Calendar className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          </div>

          {/* Top 4 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:bg-slate-800/80 transition-colors backdrop-blur-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400">Expected Sales <span className="float-right text-slate-500">›</span></p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">PKR 78,650</h4>
                  <p className="text-xs font-semibold text-emerald-400 mt-1">+12.5% vs Yesterday</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:bg-slate-800/80 transition-colors backdrop-blur-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400">Opening Cash Float <span className="float-right text-slate-500">›</span></p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Coins className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">PKR 20,000</h4>
                  <p className="text-xs font-semibold text-emerald-400 mt-1">Recommended</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:bg-slate-800/80 transition-colors backdrop-blur-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400">Operator Risk Score <span className="float-right text-slate-500">›</span></p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
                  <AlertCircle className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Low Risk</h4>
                  <p className="text-xs font-semibold text-orange-400 mt-1">Trust Score: 92%</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:bg-slate-800/80 transition-colors backdrop-blur-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400">Active Shifts Today <span className="float-right text-slate-500">›</span></p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">3</h4>
                  <p className="text-xs font-semibold text-blue-400 mt-1 hover:underline cursor-pointer">View All Shifts</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Select Staff */}
            <div className="lg:col-span-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 shadow-sm flex flex-col h-[480px] backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="text-lg font-bold text-white">Select Staff Member</h3>
              </div>
              
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input type="text" placeholder="Search staff by name or code..." className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {staff.filter(st => st.active).map(s => {
                  const isSelected = selectedStaffId === s.id;
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => setSelectedStaffId(s.id)}
                      className={`relative flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-700/30'}`}
                    >
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center border-2 border-slate-800 shadow-sm">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1e293b&color=f97316&bold=true`} alt={s.name} className="w-12 h-12 rounded-full border border-slate-600 object-cover" />
                          {isSelected && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800"></div>}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{settings.language === "en" ? s.name : s.urduName}</h4>
                          <p className={`text-xs font-semibold ${isSelected ? 'text-orange-400' : 'text-slate-400'}`}>{t(s.role.toUpperCase(), s.role)}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            <span className="text-[10px] text-slate-400">Active</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">EMP-{s.id.slice(-3).toUpperCase()}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">92%</span>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="w-full mt-3 py-2.5 text-xs font-bold text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors">
                <User className="w-3.5 h-3.5" />
                View All Staff
              </button>
            </div>

            {/* Right Col: Shift Type & Date */}
            <div className="lg:col-span-7 flex flex-col gap-6 h-[480px]">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 shadow-sm flex-1 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="text-lg font-bold text-white">Select Shift Type</h3>
                </div>

                <div className="grid grid-cols-2 gap-5 h-48">
                  <div 
                    onClick={() => setShiftType("day")}
                    className={`relative flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${shiftType === 'day' ? 'border-orange-500 bg-orange-500/10 shadow-sm' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-700/30'}`}
                  >
                    <div className="w-12 h-12 mb-3 text-orange-400">
                      <Sun className="w-full h-full" fill={shiftType === 'day' ? 'currentColor' : 'none'} strokeWidth={shiftType === 'day' ? 2 : 1.5} />
                    </div>
                    <h4 className={`text-lg font-bold ${shiftType === 'day' ? 'text-white' : 'text-slate-300'}`}>Day Shift</h4>
                    <p className={`text-sm font-semibold mb-2 ${shiftType === 'day' ? 'text-orange-400' : 'text-slate-500'}`}>(Morning)</p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">06:00 AM → 06:00 PM</p>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-3">12 Hours</p>
                    
                    <div className="absolute bottom-4 right-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shiftType === 'day' ? 'border-orange-500 bg-orange-500' : 'border-slate-600'}`}>
                        {shiftType === 'day' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setShiftType("night")}
                    className={`relative flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${shiftType === 'night' ? 'border-orange-500 bg-orange-500/10 shadow-sm' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-700/30'}`}
                  >
                    <div className="w-12 h-12 mb-3 text-indigo-400">
                      <Moon className="w-full h-full" fill={shiftType === 'night' ? 'currentColor' : 'none'} strokeWidth={shiftType === 'night' ? 2 : 1.5} />
                    </div>
                    <h4 className={`text-lg font-bold ${shiftType === 'night' ? 'text-white' : 'text-slate-300'}`}>Night Shift</h4>
                    <p className={`text-sm font-semibold mb-2 ${shiftType === 'night' ? 'text-indigo-400' : 'text-slate-500'}`}>(Evening)</p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">06:00 PM → 06:00 AM</p>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-3">12 Hours</p>
                    
                    <div className="absolute bottom-4 right-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shiftType === 'night' ? 'border-orange-500 bg-orange-500' : 'border-slate-600'}`}>
                        {shiftType === 'night' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 shadow-sm backdrop-blur-sm">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-3">
                    <Calendar className="w-4 h-4 text-slate-400" /> Opening Date
                  </label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={shiftDate}
                      onChange={(e) => setShiftDate(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 shadow-sm backdrop-blur-sm">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-3">
                    <Clock className="w-4 h-4 text-slate-400" /> Opening Start Time
                  </label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={shiftTime}
                      onChange={(e) => setShiftTime(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Summary & Recent */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">5</div>
                <h3 className="text-lg font-bold text-white">Shift Summary Preview</h3>
              </div>

              <div className="grid grid-cols-5 gap-4 mb-6">
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"><User className="w-3.5 h-3.5 text-orange-400" /> Operator</p>
                  <p className="font-bold text-white text-sm">{selectedStaffId ? (staff.find(s=>s.id===selectedStaffId)?.name || 'Unknown') : 'Not selected'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedStaffId ? staff.find(s=>s.id===selectedStaffId)?.role : '-'}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"><Sun className="w-3.5 h-3.5 text-orange-400" /> Shift Type</p>
                  <p className="font-bold text-white text-sm">{shiftType === 'day' ? 'Day Shift' : 'Night Shift'}</p>
                  <p className="text-xs text-orange-400 font-semibold bg-orange-500/10 border border-orange-500/20 inline-block px-2 py-0.5 mt-0.5 rounded-md">{shiftType === 'day' ? 'Morning' : 'Evening'}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500" /> Date</p>
                  <p className="font-bold text-white text-sm">{format(new Date(shiftDate), "dd/MM/yyyy")}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{format(new Date(shiftDate), "EEEE")}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" /> Start Time</p>
                  <p className="font-bold text-white text-sm">{format(new Date(`2000-01-01T${shiftTime}`), "hh:mm a")}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Status</p>
                  <span className="inline-flex items-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 mt-0.5 rounded-md">Ready to Start</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-6 bg-slate-900/50 border border-slate-700/50 rounded-xl p-3">
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5"><div className="w-5 h-5 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><Coins className="w-3 h-3"/></div><span className="text-[10px] font-bold text-slate-400 uppercase">Opening Cash</span></div>
                  <span className="font-bold text-white text-sm">PKR 20,000</span>
                </div>
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5"><div className="w-5 h-5 bg-blue-500/20 rounded flex items-center justify-center text-blue-400"><TrendingUp className="w-3 h-3"/></div><span className="text-[10px] font-bold text-slate-400 uppercase">Expected Sales</span></div>
                  <span className="font-bold text-white text-sm">PKR 78,650</span>
                </div>
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5"><div className="w-5 h-5 bg-indigo-500/20 rounded flex items-center justify-center text-indigo-400"><Activity className="w-3 h-3"/></div><span className="text-[10px] font-bold text-slate-400 uppercase">Credit Limit</span></div>
                  <span className="font-bold text-white text-sm">PKR 45,000</span>
                </div>
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5"><div className="w-5 h-5 bg-orange-500/20 rounded flex items-center justify-center text-orange-400"><Zap className="w-3 h-3"/></div><span className="text-[10px] font-bold text-slate-400 uppercase">Max Discount</span></div>
                  <span className="font-bold text-white text-sm">10%</span>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><Info className="w-3 h-3"/></div>
                <p className="text-sm text-blue-300 font-medium leading-relaxed">You are about to start a <span className="font-bold text-blue-200">{shiftType === 'day' ? 'Day' : 'Night'} Shift</span> session.<br/>All sales, expenses and activities will be recorded under this shift.</p>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 shadow-sm flex flex-col backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> Recent Shift Activity</h3>
                <span className="text-xs font-bold text-blue-400 cursor-pointer hover:text-blue-300 transition-colors">View All</span>
              </div>
              <div className="flex-1 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-slate-700 rounded-full border border-slate-600 flex items-center justify-center text-slate-300 text-xs font-bold">UA</div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
                        <User className="w-2.5 h-2.5 text-orange-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">15/06/2026 <span className="text-slate-200 font-bold ml-1">Day Shift</span></p>
                      <p className="text-sm font-bold text-white">Umar Ali</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sales</p>
                    <p className="text-sm font-bold text-emerald-400">PKR 68,450</p>
                  </div>
                </div>
                <div className="h-px bg-slate-700/50 w-full"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-slate-700 rounded-full border border-slate-600 flex items-center justify-center text-slate-300 text-xs font-bold">ZA</div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
                        <Moon className="w-2.5 h-2.5 text-indigo-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">15/06/2026 <span className="text-slate-200 font-bold ml-1">Night Shift</span></p>
                      <p className="text-sm font-bold text-white">Zain Ahmed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sales</p>
                    <p className="text-sm font-bold text-emerald-400">PKR 54,230</p>
                  </div>
                </div>
                <div className="h-px bg-slate-700/50 w-full"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-slate-700 rounded-full border border-slate-600 flex items-center justify-center text-slate-300 text-xs font-bold">BH</div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
                        <User className="w-2.5 h-2.5 text-orange-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">14/06/2026 <span className="text-slate-200 font-bold ml-1">Day Shift</span></p>
                      <p className="text-sm font-bold text-white">Bilal Hussain</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sales</p>
                    <p className="text-sm font-bold text-emerald-400">PKR 72,190</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={!selectedStaffId}
            onClick={handleStartShift}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-4 text-center font-sans text-lg font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-wider group mt-2"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>START SHIFT SESSION</span>
            <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
"""

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

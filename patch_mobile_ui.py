import re

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change Top 4 Cards Grid
content = content.replace(
    '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">',
    '<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">'
)

# 2. To make the stats fit better on 2-col mobile, we can slightly reduce text sizes
content = content.replace(
    '<h4 className="text-xl font-bold text-white">PKR 78,650</h4>',
    '<h4 className="text-lg lg:text-xl font-bold text-white">PKR 78,650</h4>'
)
content = content.replace(
    '<h4 className="text-xl font-bold text-white">PKR 20,000</h4>',
    '<h4 className="text-lg lg:text-xl font-bold text-white">PKR 20,000</h4>'
)
content = content.replace(
    '<h4 className="text-xl font-bold text-white">Low Risk</h4>',
    '<h4 className="text-lg lg:text-xl font-bold text-white">Low Risk</h4>'
)
content = content.replace(
    '<h4 className="text-xl font-bold text-white">3</h4>',
    '<h4 className="text-lg lg:text-xl font-bold text-white">3</h4>'
)
content = content.replace(
    '<div className="w-12 h-12 rounded-full',
    '<div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full'
)
content = content.replace(
    'className="w-6 h-6 text-',
    'className="w-5 h-5 lg:w-6 lg:h-6 text-'
)


# 3. Replace the Select Staff & Shift Type container section
pattern_staff = r'\{\s*/\*\s*Left Col: Select Staff\s*\*/\s*\}.*?(?=\{\s*/\*\s*Bottom Row: Summary & Recent\s*\*/\s*\})'

replacement_staff = """            {/* Left Col: Select Staff */}
            <div className="lg:col-span-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 shadow-sm flex flex-col backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                  <h3 className="text-lg font-bold text-white">Select Staff Member</h3>
                </div>
                {selectedStaffId && (
                  <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">Selected</div>
                )}
              </div>
              
              <div className="relative group flex-1 flex flex-col z-50">
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <input type="text" placeholder="Search staff by name or code..." className="peer w-full pl-9 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors" />
                </div>

                <div className="absolute top-[52px] left-0 right-0 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl opacity-0 invisible peer-focus:opacity-100 peer-focus:visible hover:opacity-100 hover:visible transition-all max-h-[300px] overflow-y-auto custom-scrollbar">
                  {staff.filter(st => st.active).map(s => {
                    const isSelected = selectedStaffId === s.id;
                    return (
                      <div 
                        key={s.id} 
                        onMouseDown={(e) => {
                          e.preventDefault(); // prevents input from losing focus immediately before click fires
                          setSelectedStaffId(s.id);
                        }}
                        className={`relative flex items-center justify-between p-3 border-b border-slate-700/50 cursor-pointer transition-all last:border-0 ${isSelected ? 'bg-orange-500/10' : 'hover:bg-slate-700/50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1e293b&color=f97316&bold=true`} alt={s.name} className="w-10 h-10 rounded-full border border-slate-600 object-cover" />
                          <div>
                            <h4 className="font-bold text-white text-sm">{settings.language === "en" ? s.name : s.urduName}</h4>
                            <p className={`text-xs font-semibold ${isSelected ? 'text-orange-400' : 'text-slate-400'}`}>{t(s.role.toUpperCase(), s.role)}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-orange-500" strokeWidth={3} />}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Staff Info Display */}
                <div className="mt-2">
                  {selectedStaffId ? (
                    <div className="bg-slate-900/50 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(staff.find(s => s.id === selectedStaffId)?.name || '')}&background=1e293b&color=f97316&bold=true`} alt="Selected" className="w-14 h-14 rounded-full border-2 border-orange-500/50 object-cover" />
                          <div>
                            <h4 className="font-bold text-white text-base">{staff.find(s => s.id === selectedStaffId)?.name}</h4>
                            <p className="text-sm font-semibold text-orange-400">{staff.find(s => s.id === selectedStaffId)?.role}</p>
                            <span className="inline-block mt-1 text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">EMP-{selectedStaffId.slice(-3).toUpperCase()}</span>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-900/20">
                      <User className="w-10 h-10 text-slate-600 mb-2" />
                      <p className="text-sm text-slate-400 font-medium">No staff selected</p>
                      <p className="text-xs text-slate-500 mt-1">Tap the search bar to select an operator</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Shift Type & Date */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 shadow-sm flex-1 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="text-lg font-bold text-white">Select Shift Type</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:gap-5">
                  <div 
                    onClick={() => setShiftType("day")}
                    className={`relative flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${shiftType === 'day' ? 'border-orange-500 bg-orange-500/10 shadow-sm' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-700/30'}`}
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 mb-3 text-orange-400">
                      <Sun className="w-full h-full" fill={shiftType === 'day' ? 'currentColor' : 'none'} strokeWidth={shiftType === 'day' ? 2 : 1.5} />
                    </div>
                    <h4 className={`text-base lg:text-lg font-bold ${shiftType === 'day' ? 'text-white' : 'text-slate-300'}`}>Day Shift</h4>
                    <p className={`text-xs lg:text-sm font-semibold mb-2 ${shiftType === 'day' ? 'text-orange-400' : 'text-slate-500'}`}>(Morning)</p>
                    <p className="text-[10px] lg:text-[11px] font-semibold text-slate-400 mt-1 lg:mt-2 bg-slate-900 px-2 py-1 rounded-full border border-slate-700">06:00 AM → 06:00 PM</p>
                    
                    <div className="absolute bottom-3 right-3 lg:bottom-4 lg:right-4">
                      <div className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full border-2 flex items-center justify-center ${shiftType === 'day' ? 'border-orange-500 bg-orange-500' : 'border-slate-600'}`}>
                        {shiftType === 'day' && <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setShiftType("night")}
                    className={`relative flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${shiftType === 'night' ? 'border-orange-500 bg-orange-500/10 shadow-sm' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-700/30'}`}
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 mb-3 text-indigo-400">
                      <Moon className="w-full h-full" fill={shiftType === 'night' ? 'currentColor' : 'none'} strokeWidth={shiftType === 'night' ? 2 : 1.5} />
                    </div>
                    <h4 className={`text-base lg:text-lg font-bold ${shiftType === 'night' ? 'text-white' : 'text-slate-300'}`}>Night Shift</h4>
                    <p className={`text-xs lg:text-sm font-semibold mb-2 ${shiftType === 'night' ? 'text-indigo-400' : 'text-slate-500'}`}>(Evening)</p>
                    <p className="text-[10px] lg:text-[11px] font-semibold text-slate-400 mt-1 lg:mt-2 bg-slate-900 px-2 py-1 rounded-full border border-slate-700">06:00 PM → 06:00 AM</p>
                    
                    <div className="absolute bottom-3 right-3 lg:bottom-4 lg:right-4">
                      <div className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full border-2 flex items-center justify-center ${shiftType === 'night' ? 'border-orange-500 bg-orange-500' : 'border-slate-600'}`}>
                        {shiftType === 'night' && <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
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
"""

new_content = re.sub(pattern_staff, replacement_staff, content, flags=re.DOTALL)

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

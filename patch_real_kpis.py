import re

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace Top 4 Cards Grid
top_cards_pattern = r'\{\s*/\*\s*Top 4 Cards\s*\*/\s*\}.*?(?=<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">)'

real_top_cards = """          {/* Top 4 System Status Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 lg:p-5 shadow-sm flex flex-col justify-between hover:bg-slate-800/80 transition-colors backdrop-blur-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] lg:text-xs font-semibold text-slate-400">Active Shifts <span className="float-right text-slate-500">›</span></p>
              </div>
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                  <Activity className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-lg lg:text-xl font-bold text-white">{shifts.filter(s => s.status === 'active' && s.stationId === activeStationId).length}</h4>
                  <p className="text-[10px] lg:text-xs font-semibold text-blue-400 mt-0.5 lg:mt-1">Currently Running</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 lg:p-5 shadow-sm flex flex-col justify-between hover:bg-slate-800/80 transition-colors backdrop-blur-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] lg:text-xs font-semibold text-slate-400">Available Staff <span className="float-right text-slate-500">›</span></p>
              </div>
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
                  <User className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-lg lg:text-xl font-bold text-white">{staff.filter(s => s.active).length}</h4>
                  <p className="text-[10px] lg:text-xs font-semibold text-orange-400 mt-0.5 lg:mt-1">Active Profiles</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 lg:p-5 shadow-sm flex flex-col justify-between hover:bg-slate-800/80 transition-colors backdrop-blur-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] lg:text-xs font-semibold text-slate-400">Active Pumps <span className="float-right text-slate-500">›</span></p>
              </div>
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Fuel className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-lg lg:text-xl font-bold text-white">{pumps.filter(p => p.active && p.stationId === activeStationId).length}</h4>
                  <p className="text-[10px] lg:text-xs font-semibold text-emerald-400 mt-0.5 lg:mt-1">Online</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 lg:p-5 shadow-sm flex flex-col justify-between hover:bg-slate-800/80 transition-colors backdrop-blur-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] lg:text-xs font-semibold text-slate-400">Active Nozzles <span className="float-right text-slate-500">›</span></p>
              </div>
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                  <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-lg lg:text-xl font-bold text-white">{nozzles.filter(n => n.active).length}</h4>
                  <p className="text-[10px] lg:text-xs font-semibold text-indigo-400 mt-0.5 lg:mt-1">Operational</p>
                </div>
              </div>
            </div>
          </div>

"""

content = re.sub(top_cards_pattern, real_top_cards, content, flags=re.DOTALL)

# 2. Remove the 4 dummy badges from "Shift Summary Preview" bottom left
# Find the specific flex-wrap container with the dummies
dummy_badges_pattern = r'<div className="flex flex-wrap gap-3 mb-6 bg-slate-900/50 border border-slate-700/50 rounded-xl p-3">.*?</div>\s*</div>\s*<div className="bg-blue-500/10'
dummy_badges_replacement = r'</div>\n              <div className="bg-blue-500/10'

content = re.sub(dummy_badges_pattern, dummy_badges_replacement, content, flags=re.DOTALL)


# 3. Remove the 92% Trust score badge from the staff list if present.
# It looks like:
# <div className="flex items-center gap-2 mt-1">
#   <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">92%</span>
#   <ChevronRight className="w-4 h-4 text-slate-500" />
# </div>
# Wait, I removed the chevron right and 92% entirely in my previous patch `patch_mobile_ui.py`.
# Let's check if the 92% is still there. In patch_mobile_ui.py, I used:
# `<img src=... /> <div><h4...>...</h4><p...>...</p></div>`
# I completely omitted the right-side elements (92% and chevron)! So no need to remove them from the staff list, they are already gone.

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

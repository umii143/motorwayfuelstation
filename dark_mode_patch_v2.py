import re

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Staff Avatar logic safely without touching outer divs
old_avatar = '''                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold uppercase shadow-sm">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-sans text-sm font-bold ${selectedStaffId === s.id ? 'text-blue-900' : 'text-slate-700'}`}>
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-500">{s.role}</p>
                      </div>
                    </div>
                    {selectedStaffId === s.id && (
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    )}'''

new_avatar = '''                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 border border-slate-700 overflow-hidden shadow-sm">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1e293b&color=f97316&bold=true`} alt={s.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className={`font-sans text-sm font-bold ${selectedStaffId === s.id ? 'text-orange-400' : 'text-slate-200'}`}>
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-400">{s.role}</p>
                      </div>
                    </div>
                    {selectedStaffId === s.id && (
                      <CheckCircle2 className="h-5 w-5 text-orange-500" />
                    )}'''

content = content.replace(old_avatar, new_avatar)

# 2. Step 1 Top Metrics border/bg
content = content.replace('className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"', 'className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 shadow-sm"')

# 3. Global Color replacements for Dark Mode 
content = content.replace('text-slate-900', 'text-slate-200')
content = content.replace('bg-white', 'bg-slate-900/50')
content = content.replace('border-slate-200', 'border-slate-700/50')
content = content.replace('border-slate-100', 'border-slate-700/50')
content = content.replace('bg-slate-50', 'bg-slate-800/50')
content = content.replace('text-slate-800', 'text-slate-200')
content = content.replace('text-blue-800', 'text-blue-200')
content = content.replace('text-blue-900', 'text-blue-300')
content = content.replace('bg-blue-50/50', 'bg-blue-500/10')
content = content.replace('bg-blue-50', 'bg-blue-500/20')
content = content.replace('bg-blue-100', 'bg-blue-500/30')
content = content.replace('text-blue-600', 'text-blue-400')
content = content.replace('border-blue-100', 'border-blue-500/20')
content = content.replace('bg-emerald-50', 'bg-emerald-500/10')
content = content.replace('border-emerald-100', 'border-emerald-500/20')
content = content.replace('text-emerald-700', 'text-emerald-400')
content = content.replace('bg-orange-50', 'bg-orange-500/10')
content = content.replace('border-orange-200', 'border-orange-500/50')
content = content.replace('bg-indigo-50', 'bg-indigo-500/10')
content = content.replace('border-indigo-200', 'border-indigo-500/50')

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

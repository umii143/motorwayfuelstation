import codecs
import re

# Fix useJarvis.ts
with codecs.open('src/hooks/useJarvis.ts', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace('recognitionRef.current?.onresult =', 'if (recognitionRef.current) recognitionRef.current.onresult =')
text = text.replace('recognitionRef.current?.onerror =', 'if (recognitionRef.current) recognitionRef.current.onerror =')
text = text.replace('recognitionRef.current?.onend =', 'if (recognitionRef.current) recognitionRef.current.onend =')
text = text.replace('recognitionRef.current?.continuous =', 'if (recognitionRef.current) recognitionRef.current.continuous =')
text = text.replace('recognitionRef.current?.interimResults =', 'if (recognitionRef.current) recognitionRef.current.interimResults =')

with codecs.open('src/hooks/useJarvis.ts', 'w', 'utf-8') as f:
    f.write(text)

# Fix biAggregator.ts
with codecs.open('src/lib/bi/biAggregator.ts', 'r', 'utf-8') as f:
    text = f.read()
text = text.replace('b.omcInvoicePrice', '(b.omcInvoicePrice || 0)')
text = text.replace('r.date.startsWith', '(r.date || "").startsWith')
text = text.replace('r.date.slice', '(r.date || "").slice')
with codecs.open('src/lib/bi/biAggregator.ts', 'w', 'utf-8') as f:
    f.write(text)

# Fix reportCompilers.ts remaining
with codecs.open('src/lib/reportCompilers.ts', 'r', 'utf-8') as f:
    text = f.read()
text = text.replace('entry.impactAmount.toLocaleString', '(entry.impactAmount || 0).toLocaleString')
text = text.replace('date: h.date,', 'date: h.date || "",')
text = text.replace('h.newRate -', '(h.newRate || 0) -')
text = text.replace('- h.oldRate', '- (h.oldRate || 0)')
with codecs.open('src/lib/reportCompilers.ts', 'w', 'utf-8') as f:
    f.write(text)

# Fix forecast.worker.ts
with codecs.open('src/workers/forecast.worker.ts', 'r', 'utf-8') as f:
    text = f.read()
text = text.replace('let upcomingEvents = [];', 'let upcomingEvents: any[] = [];')
with codecs.open('src/workers/forecast.worker.ts', 'w', 'utf-8') as f:
    f.write(text)

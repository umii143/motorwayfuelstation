import codecs

with codecs.open('src/lib/reportCompilers.ts', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace(r"\'\'", "''")
text = text.replace(r"\'0.00\'", "'0.00'")
text = text.replace(r"\'0\'", "'0'")

with codecs.open('src/lib/reportCompilers.ts', 'w', 'utf-8') as f:
    f.write(text)

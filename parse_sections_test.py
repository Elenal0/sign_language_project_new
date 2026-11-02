# -*- coding: utf-8 -*-
import re

with open('vittsaathi_extracted_raw.txt', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
print(f"Total lines in extracted raw: {len(lines)}")

# Let's see the structure of sections and questions
for i, line in enumerate(lines):
    line_s = line.strip()
    if not line_s:
        continue
    # Let's print section headers and introductory text
    if re.match(r'^\d+\.\s+[A-Z]', line_s) and not line_s.endswith('?'):
        print(f"L{i}: {line_s[:100]}")

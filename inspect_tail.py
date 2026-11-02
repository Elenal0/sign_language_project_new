# -*- coding: utf-8 -*-
with open('vittsaathi_extracted_raw.txt', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
for i in range(375, len(lines)):
    print(f"L{i}: {lines[i].encode('ascii', errors='replace').decode('ascii')}")

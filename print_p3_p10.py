# -*- coding: utf-8 -*-
with open('vittsaathi_extracted_raw.txt', 'r', encoding='utf-8') as f:
    text = f.read()

pages = text.split('=== PAGE ')
for p in range(3, len(pages)):
    print(f"=================== PAGE {p} ===================")
    print(pages[p].encode('ascii', errors='replace').decode('ascii'))

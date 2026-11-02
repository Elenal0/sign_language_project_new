# -*- coding: utf-8 -*-
with open('vittsaathi_extracted_raw.txt', 'r', encoding='utf-8') as f:
    text = f.read()

pages = text.split('=== PAGE ')

for p_num, page in enumerate(pages[1:], 1):
    lines = page.split('\n')
    print(f"\n=================== PAGE {p_num} ===================")
    for l in lines:
        if l.strip():
            print(l.encode('ascii', errors='replace').decode('ascii'))

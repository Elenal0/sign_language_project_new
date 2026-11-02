# -*- coding: utf-8 -*-
with open('vittsaathi_extracted_raw.txt', 'r', encoding='utf-8') as f:
    text = f.read()

pages = text.split('=== PAGE ')
print("PAGE 1:")
print(pages[1].encode('ascii', errors='replace').decode('ascii'))
print("\nPAGE 2:")
print(pages[2].encode('ascii', errors='replace').decode('ascii'))

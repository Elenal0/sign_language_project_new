# -*- coding: utf-8 -*-
with open('internship_extracted_raw.txt', encoding='utf-8') as f:
    text = f.read()

s2_idx = text.find('2. "Tell me about your internship"')
s3_idx = text.find('3. ETL questions')
print('=== SECTION 2 ===')
print(text[s2_idx:s3_idx].encode('ascii', errors='replace').decode('ascii'))

s15_idx = text.find('15. Data pipeline architecture questions')
s16_idx = text.find('16. Questions about scale')
print('=== SECTION 15 DIAGRAM ===')
print(text[s15_idx:s16_idx].encode('ascii', errors='replace').decode('ascii'))

s19_idx = text.find('19. Top 25 questions to master')
print('=== SECTION 19 ===')
print(text[s19_idx:].encode('ascii', errors='replace').decode('ascii'))

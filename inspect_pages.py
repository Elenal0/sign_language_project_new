# -*- coding: utf-8 -*-
with open('vittsaathi_extracted_raw.txt', 'r', encoding='utf-8') as f:
    text = f.read()

pages = text.split('=== PAGE ')
for i, page in enumerate(pages[1:], 1):
    print(f"--- PAGE {i} ---")
    lines = [l.strip() for l in page.split('\n') if l.strip()]
    for line in lines:
        if any(line.startswith(prefix) for prefix in ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.', '12.', '13.', '14.', '15.', '16.', '17.', '18.', '19.', '20.']):
            # check if it looks like a section or question
            print(f"  {line[:100]}")
        elif 'questions' in line.lower() or 'architecture' in line.lower() or 'priority' in line.lower():
            print(f"  >> {line[:100]}")

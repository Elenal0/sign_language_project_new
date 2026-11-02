# -*- coding: utf-8 -*-
import re

with open('vittsaathi_extracted_raw.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's write a comprehensive question parser that extracts all numbered questions
# and lists them with their section headers
lines = text.split('\n')

all_questions = []
current_section = "Header"

for line in lines:
    line_s = line.strip()
    if not line_s or line_s.startswith('==='):
        continue
    
    # Check section headers
    # e.g., "1. Most important questions", "4. Spring Boot questions", etc.
    if re.match(r'^\d+\.\s+[A-Za-z].*?(?:questions|master|integration|data)', line_s, re.I) and not line_s.endswith('?'):
        current_section = line_s
        print(f"FOUND SECTION: {current_section}")
        continue
    
    # Question match
    m = re.match(r'^(\d+)\.\s+(.*)$', line_s)
    if m:
        q_num = int(m.group(1))
        q_text = m.group(2)
        all_questions.append((q_num, q_text, current_section))

print(f"\nTotal extracted questions: {len(all_questions)}")
print(f"Range: Q{all_questions[0][0]} to Q{all_questions[-1][0]}")

# Let's save a clean list of all questions with section
with open('vittsaathi_clean_questions_list.txt', 'w', encoding='utf-8') as f:
    last_sec = ""
    for q_num, q_text, sec in all_questions:
        if sec != last_sec:
            f.write(f"\n## {sec}\n\n")
            last_sec = sec
        f.write(f"Q{q_num}. {q_text}\n")

print("Saved vittsaathi_clean_questions_list.txt successfully!")

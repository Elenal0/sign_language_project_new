# -*- coding: utf-8 -*-
import re

with open('internship_extracted_raw.txt', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
questions = {}

sec_titles = [
    '1. Most important questions',
    '2. "Tell me about your internship"',
    '3. ETL questions',
    '4. Pandas questions',
    '5. NumPy questions',
    '6. SQLAlchemy questions',
    '7. SQLite questions',
    '8. REST API / mfapi.in questions',
    '9. Mutual fund / finance questions',
    '10. Data cleaning questions',
    '11. Statistical analysis questions',
    '12. Power BI questions',
    '13. DAX questions',
    '14. Dashboard questions',
    '15. Data pipeline architecture questions',
    '16. Questions about scale',
    '17. Troubleshooting questions',
    '18. Behavioral questions about the internship',
    '19. Top 25 questions to master'
]

for idx, line in enumerate(lines):
    line_s = line.strip()
    if not line_s:
        continue
    
    # Check if this line is one of the section titles
    is_sec = False
    for st in sec_titles:
        if line_s.startswith(st[:15]):
            is_sec = True
            break
    if is_sec:
        continue

    m = re.match(r'^(\d{1,3})\.\s+(.+)$', line_s)
    if m:
        q_num = int(m.group(1))
        q_text = m.group(2).strip()
        # If question text ends or continues on next line, let's capture it
        questions[q_num] = q_text

print(f"Total questions mapped: {len(questions)}")
expected = list(range(1, 227))
missing = set(expected) - set(questions.keys())
print(f"Missing numbers: {sorted(missing)}")
if not missing:
    print("All 226 questions are present from 1 to 226 without any gaps!")

with open('internship_questions_extracted.txt', 'w', encoding='utf-8') as f:
    for q_num in sorted(questions.keys()):
        f.write(f"{q_num}. {questions[q_num]}\n")

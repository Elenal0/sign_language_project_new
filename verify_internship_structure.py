# -*- coding: utf-8 -*-
import re

with open('internship_extracted_raw.txt', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
sections = [
    (1, "1. Most important questions"),
    (2, '2. "Tell me about your internship"'),
    (3, "3. ETL questions"),
    (4, "4. Pandas questions"),
    (5, "5. NumPy questions"),
    (6, "6. SQLAlchemy questions"),
    (7, "7. SQLite questions"),
    (8, "8. REST API / mfapi.in questions"),
    (9, "9. Mutual fund / finance questions"),
    (10, "10. Data cleaning questions"),
    (11, "11. Statistical analysis questions"),
    (12, "12. Power BI questions"),
    (13, "13. DAX questions"),
    (14, "14. Dashboard questions"),
    (15, "15. Data pipeline architecture questions"),
    (16, "16. Questions about scale"),
    (17, "17. Troubleshooting questions"),
    (18, "18. Behavioral questions about the internship"),
    (19, "19. Top 25 questions to master")
]

current_sec = "Header"
sec_questions = {s[1]: [] for s in sections}

for line in lines:
    line_s = line.strip()
    for s_idx, s_title in sections:
        if line_s.startswith(s_title[:12]):
            current_sec = s_title
            break
    
    m = re.match(r'^(\d{1,3})\.\s+(.+)', line_s)
    if m:
        q_num = int(m.group(1))
        # Exclude section titles themselves
        if not any(line_s.startswith(s[1][:12]) for s in sections):
            if current_sec in sec_questions:
                sec_questions[current_sec].append(q_num)

for s_title, qs in sec_questions.items():
    if qs:
        print(f"{s_title}: Q{min(qs)} to Q{max(qs)} (Total: {len(qs)})")
    else:
        print(f"{s_title}: (Conceptual / Architectural Section)")

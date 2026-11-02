# -*- coding: utf-8 -*-
import re

with open('vittsaathi_extracted_raw.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's find all lines
lines = text.split('\n')

sections = []
current_sec_title = "Intro"
all_items = []

section_headers = [
    "1. Most important questions",
    "2. Project understanding questions",
    "3. Architecture questions",
    "4. Spring Boot questions",
    "5. REST API questions",
    "6. JWT authentication",
    "7. PostgreSQL questions",
    "8. Redis questions",
    "9. Docker questions",
    "10. LangGraph",
    "11. Multi-agent system questions",
    "12. Gemini API questions",
    "13. RAG",
    "14. Security of private financial data",
    "15. React questions",
    "16. Full-stack integration questions",
    "17. Advanced questions",
    "18. Questions comparing technologies",
    "19. Top 25 questions to master"
]

def is_section_header(line):
    line_clean = line.strip()
    for sh in section_headers:
        if line_clean.lower().startswith(sh.lower()):
            return True
    return False

current_section = "Header"
current_sec_num = 0

questions_by_sec = {}
current_q_list = []

for line in lines:
    line_clean = line.strip()
    if not line_clean or line_clean.startswith('==='):
        continue
    
    # Check if section header
    if is_section_header(line_clean):
        if current_section != "Header":
            questions_by_sec[current_section] = current_q_list
        current_section = line_clean
        current_q_list = []
        continue
    
    # Check if it's a question
    # Matches: number. question text
    q_match = re.match(r'^(\d+)\.\s+(.*)$', line_clean)
    if q_match:
        q_num = int(q_match.group(1))
        q_text = q_match.group(2)
        current_q_list.append((q_num, q_text, line_clean))

if current_section:
    questions_by_sec[current_section] = current_q_list

print(f"Total sections detected: {len(questions_by_sec)}")
total_questions = 0
all_q_nums = []

with open('vittsaathi_parsed_summary.txt', 'w', encoding='utf-8') as f:
    for sec, qlist in questions_by_sec.items():
        f.write(f"\n========================================\n")
        f.write(f"SECTION: {sec} (Count: {len(qlist)})\n")
        f.write(f"========================================\n")
        print(f"Section: {sec} -> {len(qlist)} questions")
        for q_num, q_text, raw in qlist:
            all_q_nums.append(q_num)
            total_questions += 1
            f.write(f"  Q{q_num}: {q_text}\n")

print(f"\nTotal questions found: {total_questions}")
print(f"Min Q num: {min(all_q_nums) if all_q_nums else None}, Max Q num: {max(all_q_nums) if all_q_nums else None}")

# Check missing numbers from min to max
missing = []
all_q_set = set(all_q_nums)
for i in range(min(all_q_nums), max(all_q_nums) + 1):
    if i not in all_q_set:
        missing.append(i)

print(f"Missing numbers between {min(all_q_nums)} and {max(all_q_nums)}: {missing}")

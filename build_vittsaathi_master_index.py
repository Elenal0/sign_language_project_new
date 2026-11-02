# -*- coding: utf-8 -*-
import re

with open('vittsaathi_extracted_raw.txt', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')

# The 19 section headers in the PDF are exactly:
# 1. Most important questions
# 2. Project understanding questions
# 3. Architecture questions
# 4. Spring Boot questions
# 5. REST API questions
# 6. JWT authentication – VERY IMPORTANT
# 7. PostgreSQL questions
# 8. Redis questions
# 9. Docker questions
# 10. LangGraph – HIGH PRIORITY
# 11. Multi-agent system questions
# 12. Gemini API questions
# 13. RAG – EXTREMELY IMPORTANT
# 14. Security of private financial data
# 15. React questions
# 16. Full-stack integration questions
# 17. Advanced questions
# 18. Questions comparing technologies
# 19. Top 25 questions to master

exact_section_headers = [
    "1. most important questions",
    "2. project understanding questions",
    "3. architecture questions",
    "4. spring boot questions",
    "5. rest api questions",
    "6. jwt authentication",
    "7. postgresql questions",
    "8. redis questions",
    "9. docker questions",
    "10. langgraph",
    "11. multi-agent system questions",
    "12. gemini api questions",
    "13. rag",
    "14. security of private financial data",
    "15. react questions",
    "16. full-stack integration questions",
    "17. advanced questions",
    "18. questions comparing technologies",
    "19. top 25 questions to master"
]

def is_exact_section(line):
    clean = line.strip().lower()
    for es in exact_section_headers:
        if clean.startswith(es) and not clean.endswith('?'):
            return True
    return False

parsed_questions = {}

for line in lines:
    line_s = line.strip()
    m = re.match(r'^(\d+)\.\s+(.*)$', line_s)
    if m:
        num = int(m.group(1))
        if is_exact_section(line_s):
            print(f"Skipping section header: {line_s}")
            continue
        q_text = m.group(2).strip()
        parsed_questions[num] = q_text

print(f"Total numbered questions parsed: {len(parsed_questions)}")
print(f"Min: {min(parsed_questions.keys())}, Max: {max(parsed_questions.keys())}")

missing = [i for i in range(1, 262) if i not in parsed_questions]
print(f"Missing between 1 and 261: {missing}")

# Write to file
with open('vittsaathi_verified_questions.txt', 'w', encoding='utf-8') as f:
    for i in range(1, 262):
        if i in parsed_questions:
            f.write(f"{i}. {parsed_questions[i]}\n")
        else:
            f.write(f"{i}. MISSING\n")

print("Saved vittsaathi_verified_questions.txt")

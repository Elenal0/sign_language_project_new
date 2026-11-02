# -*- coding: utf-8 -*-
import re

with open('vittsaathi_extracted_raw.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's see all lines that match a section pattern or question pattern
lines = text.split('\n')
print(f"Total lines: {len(lines)}")

# Let's find all questions: typically number followed by dot
questions = []
for line in lines:
    line_clean = line.strip()
    match = re.match(r'^(\d+)\.\s+(.*)$', line_clean)
    if match:
        num = int(match.group(1))
        q_text = match.group(2)
        questions.append((num, q_text, line_clean))

print(f"Total questions found by regex: {len(questions)}")
print(f"Min q num: {questions[0][0] if questions else None}, Max q num: {questions[-1][0] if questions else None}")

# Let's save extracted questions to a text file
with open('vittsaathi_questions_extracted.txt', 'w', encoding='utf-8') as f:
    for num, q_text, raw in questions:
        f.write(f"{num}. {q_text}\n")

# Let's print out the sections and structure
with open('vittsaathi_structure_summary.txt', 'w', encoding='utf-8') as f:
    for i, line in enumerate(lines):
        line_s = line.strip()
        if line_s.startswith('=== PAGE'):
            f.write(f"\n{line_s}\n")
        elif re.match(r'^\d+\.\s+[A-Za-z]', line_s) and len(line_s) < 80:
            # Check if this is a section header (often has no question mark, or is followed by introductory text)
            if not line_s.endswith('?') and not line_s.endswith('.'):
                f.write(f"SECTION CANDIDATE: {line_s}\n")
            elif any(keyword in line_s.lower() for keyword in ['questions', 'architecture', 'understanding', 'system', 'agent', 'rag']):
                f.write(f"SECTION OR GROUP: {line_s}\n")

print("Done parsing structure and questions.")

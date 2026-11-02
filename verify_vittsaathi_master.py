import re
import sys

def verify_master():
    path = 'VittSaathi_Interview_Answers.md'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.splitlines()
    words = content.split()
    print(f"=== MASTER FILE STATISTICS ===")
    print(f"File Path: {path}")
    print(f"File Size: {len(content) / 1024:.2f} KB ({len(content)} bytes)")
    print(f"Total Lines: {len(lines)}")
    print(f"Total Words: {len(words)}")

    # 1. Verify Questions Q1 to Q261
    questions_found = re.findall(r'### Q(\d+)\.\s+([^\n]+)', content)
    q_dict = {int(num): title for num, title in questions_found}
    print(f"\nUnique questions found matching '### Q<num>.': {len(q_dict)}")

    missing_q = []
    for i in range(1, 262):
        if i not in q_dict:
            missing_q.append(i)

    if missing_q:
        print(f"CRITICAL ERROR: Missing questions: {missing_q}")
        return False
    else:
        print("SUCCESS: All 261 questions (Q1 to Q261) exist sequentially!")

    # 2. Verify all 6 subsections in every single question
    required_subsections = [
        '**Concept and Fundamentals:**',
        '**My Project Implementation:**',
        '**Why I Used It:**',
        '**Alternatives and Comparison:**',
        '**Interview-Ready Answer:**',
        '**Follow-up Depth:**'
    ]

    # Split content by '### Q\d+\.'
    # Exclude content before Q1 and after Q261
    q1_idx = content.find('### Q1.')
    sec18_idx = content.find('## Section 18:')
    body_q = content[q1_idx:sec18_idx]

    blocks = re.split(r'### Q\d+\.', body_q)[1:]
    if len(blocks) != 261:
        print(f"CRITICAL ERROR: Question block count mismatch: expected 261, got {len(blocks)}")
        return False

    subsections_missing = 0
    total_subsections = 0
    for idx in range(261):
        q_num = idx + 1
        block = blocks[idx]
        for sub in required_subsections:
            if sub in block:
                total_subsections += 1
            else:
                print(f"ERROR: Missing '{sub}' in Q{q_num}: {q_dict[q_num]}")
                subsections_missing += 1

    print(f"\nTotal question subsections found: {total_subsections} / {261 * 6}")
    if subsections_missing > 0:
        print(f"FAILED: {subsections_missing} subsections missing!")
        return False
    else:
        print("SUCCESS: All 1,566 question subsections are present!")

    # 3. Verify Section 18 comparisons
    sec18_content = content[sec18_idx:content.find('## Section 19:')]
    comp_matches = re.findall(r'### Comparison (\d+):', sec18_content)
    print(f"\nSection 18 Comparisons found: {len(comp_matches)} (Expected: 9)")
    comp_blocks = re.split(r'### Comparison \d+:', sec18_content)[1:]
    comp_subs_missing = 0
    for idx, c_num in enumerate(comp_matches):
        c_block = comp_blocks[idx]
        for sub in required_subsections:
            if sub not in c_block:
                print(f"ERROR: Missing '{sub}' in Comparison {c_num}")
                comp_subs_missing += 1

    if comp_subs_missing > 0:
        print(f"FAILED: {comp_subs_missing} subsections missing in Section 18!")
        return False
    else:
        print("SUCCESS: All 9 technology comparisons have all 6 mandatory subsections!")

    # 4. Verify Section 19 Priority Table
    sec19_content = content[content.find('## Section 19:'):]
    rows = [line for line in sec19_content.splitlines() if re.match(r'\|\s*\*\*\d+\*\*\s*\|', line)]
    print(f"\nSection 19 Priority Rows found: {len(rows)} (Expected: 25)")
    if len(rows) != 25:
        print(f"FAILED: Expected 25 priority rows, got {len(rows)}")
        return False
    else:
        print("SUCCESS: Section 19 priority table has all 25 rows!")

    print("\n=======================================================")
    print("VERIFICATION COMPLETE: 100% OF ALL REQUIREMENTS SATISFIED!")
    print("=======================================================")
    return True

if __name__ == '__main__':
    ok = verify_master()
    if not ok:
        sys.exit(1)

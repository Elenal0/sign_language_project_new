import sys

# Script to generate Section 4 (Q42-Q61), Section 5 (Q62-Q74), and Section 6 (Q75-Q95)
# Total questions: 54

content = []

def add_q(q_num, title, concept, implementation, why, alternatives, interview, follow_up):
    block = f"""### Q{q_num}. {title}

**Concept and Fundamentals:**
{concept.strip()}

**My Project Implementation:**
{implementation.strip()}

**Why I Used It:**
{why.strip()}

**Alternatives and Comparison:**
{alternatives.strip()}

**Interview-Ready Answer:**
{interview.strip()}

**Follow-up Depth:**
{follow_up.strip()}
"""
    content.append(block)

print("Authoring Section 4: Spring Boot (Q42 to Q61)...")

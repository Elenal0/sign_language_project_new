import os
import re

def build_master_file():
    parts = [
        'vitt_sec1_to_sec3.md',
        'vitt_sec4_to_sec6.md',
        'vitt_sec7_to_sec9.md',
        'vitt_sec10_to_sec12.md',
        'vitt_sec13_to_sec15.md',
        'vitt_sec16.md',
        'vitt_sec17.md',
        'vitt_sec18_sec19.md'
    ]

    all_content_chunks = []
    for p in parts:
        if not os.path.exists(p):
            raise FileNotFoundError(f"Missing chunk file: {p}")
        with open(p, 'r', encoding='utf-8') as f:
            all_content_chunks.append(f.read().strip())

    full_body = '\n\n---\n\n'.join(all_content_chunks)

    # Extract all question titles for the TOC
    q_matches = re.findall(r'### (Q\d+\.\s+([^\n]+))', full_body)
    comp_matches = re.findall(r'### (Comparison \d+:\s+([^\n]+))', full_body)

    # Build Header & Table of Contents
    header = r'''# VittSaathi: Comprehensive Technical Interview Master Guide

> **Project Identity:** VittSaathi — Enterprise Full-Stack Personal Wealth Management & AI Financial Advisory Platform  
> **Core Architecture:** React 18 SPA + Spring Boot 3 REST APIs + PostgreSQL 15 + Redis 7 + Docker + Python 3.11 LangGraph Multi-Agent System (Sentinel, Kalpa, Drishti) + Google Gemini API + RAG (Indian Tax Code & Financial Regulations)  
> **Target Audience:** Placement Interviews, Technical Rounds, System Design Interviews, and Architecture Deep-Dives  

---

## Master Table of Contents

### Section Summaries & Jump Links
- [Section 1: Most Important Questions (Q1 – Q20)](#section-1-most-important-questions)
- [Section 2: Project Understanding Questions (Q21 – Q30)](#section-2-project-understanding-questions)
- [Section 3: Architecture Questions (Q31 – Q41)](#section-3-architecture-questions)
- [Section 4: Spring Boot Questions (Q42 – Q61)](#section-4-spring-boot-questions)
- [Section 5: REST API Questions (Q62 – Q74)](#section-5-rest-api-questions)
- [Section 6: JWT Authentication — VERY IMPORTANT (Q75 – Q95)](#section-6-jwt-authentication--very-important)
- [Section 7: PostgreSQL Questions (Q96 – Q114)](#section-7-postgresql-questions)
- [Section 8: Redis Questions (Q115 – Q130)](#section-8-redis-questions)
- [Section 9: Docker Questions (Q131 – Q142)](#section-9-docker-questions)
- [Section 10: LangGraph — HIGH PRIORITY (Q143 – Q162)](#section-10-langgraph--high-priority)
- [Section 11: Multi-Agent System Questions (Q163 – Q174)](#section-11-multi-agent-system-questions)
- [Section 12: Gemini API Questions (Q175 – Q188)](#section-12-gemini-api-questions)
- [Section 13: RAG — EXTREMELY IMPORTANT (Q189 – Q210)](#section-13-rag--extremely-important)
- [Section 14: Security of Private Financial Data (Q211 – Q222)](#section-14-security-of-private-financial-data)
- [Section 15: React Questions (Q223 – Q236)](#section-15-react-questions)
- [Section 16: Full-Stack Integration Questions (Q237 – Q245)](#section-16-full-stack-integration-questions)
- [Section 17: Advanced Questions (Q246 – Q261)](#section-17-advanced-questions)
- [Section 18: Questions Comparing Technologies (Comparisons 1 – 9)](#section-18-questions-comparing-technologies)
- [Section 19: Top 25 Questions to Master](#section-19-top-25-questions-to-master)

---

### Detailed Index of All 261 Questions
'''

    toc_lines = []
    for full_q, title in q_matches:
        # Create anchor link
        q_num = re.match(r'Q(\d+)', full_q).group(1)
        clean_anchor = re.sub(r'[^a-zA-Z0-9\s-]', '', full_q).strip().lower()
        clean_anchor = re.sub(r'\s+', '-', clean_anchor)
        toc_lines.append(f"- [Q{q_num}: {title}](#{clean_anchor})")

    toc_str = '\n'.join(toc_lines)

    comp_toc_lines = ["\n### Detailed Index of Technology Comparisons\n"]
    for full_c, title in comp_matches:
        comp_num = re.match(r'Comparison (\d+)', full_c).group(1)
        clean_anchor = re.sub(r'[^a-zA-Z0-9\s-]', '', full_c).strip().lower()
        clean_anchor = re.sub(r'\s+', '-', clean_anchor)
        comp_toc_lines.append(f"- [Comparison {comp_num}: {title}](#{clean_anchor})")

    comp_toc_str = '\n'.join(comp_toc_lines)

    complete_document = f"{header}\n{toc_str}\n{comp_toc_str}\n\n---\n\n{full_body}"

    target_path = 'VittSaathi_Interview_Answers.md'
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(complete_document)

    print(f"Master file successfully assembled at: {target_path}")
    print(f"Total characters: {len(complete_document)}")

if __name__ == '__main__':
    build_master_file()

# -*- coding: utf-8 -*-
with open('vittsaathi_clean_questions_list.txt', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
for line in lines[:100]:
    print(line)

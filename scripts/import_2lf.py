#!/usr/bin/env python3
"""
Script to import 2LF questions into the database.
Parses markdown files and inserts questions via Supabase.
"""

import re
import sys

# Database IDs
FACULTY_2LF_ID = 'f35cac2d-799a-4b0f-8700-bbddd4067b41'
SUBJECT_BIOLOGY_ID = '73d9d5a4-5b52-4daf-9728-4e4e53092107'

CATEGORY_MAPPING = {
    'Biologie člověka': 'abfb7dba-ac86-41fb-8f39-0d169c6fc19e',
    'Biologie rostlin a hub': '8915ad72-9703-4e1b-8f76-95cc3c23f7bb',  # Botanika
    'Biologie živočichů': 'c7ac38d0-0084-4de0-9cff-fc5ce4aff0a8',  # Zoologie
    'Buněčná biologie': 'b44e2240-71c0-4252-9835-eb873e97ad4b',  # Cytologie
    'Ekologie': 'c8b191cb-f201-4a04-92a3-ffc6edcd26ed',
    'Evoluční biologie': '82a3044e-9475-4252-9539-975b5b57d10f',  # Evoluce
    'Molekulární biologie': '812b99e9-c015-465a-9d34-1c6a76358a01',  # Genetika
    'Obecná a populační genetika': '812b99e9-c015-465a-9d34-1c6a76358a01',  # Genetika
    'Úvod do biologie': 'abfb7dba-ac86-41fb-8f39-0d169c6fc19e',  # Biologie člověka
    'Historie medicíny': '87aba960-3e79-41b6-92dd-050c3646c907',
}

def parse_questions(content):
    """Parse questions from markdown content."""
    questions = []
    lines = content.split('\n')
    
    current_question = None
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip headers and empty lines
        if not line or line.startswith('#'):
            i += 1
            continue
        
        # Check for question start (number followed by dot)
        question_match = re.match(r'^(\d+)\.\s+(.+)', line)
        if question_match:
            # Save previous question
            if current_question and 'question_text' in current_question:
                questions.append(current_question)
            
            # Start new question
            current_question = {
                'question_number': question_match.group(1),
                'question_text': question_match.group(2),
                'options': {},
                'correct_answers': []
            }
            i += 1
            continue
        
        # Parse options
        option_match = re.match(r'^([a-e])\s*\)\s*(.+)', line, re.IGNORECASE)
        if option_match and current_question:
            option_letter = option_match.group(1).lower()
            option_text = option_match.group(2)
            current_question['options'][option_letter] = option_text
            i += 1
            continue
        
        # Parse correct answers
        correct_match = re.match(r'^correct:\s*(.+)', line, re.IGNORECASE)
        if correct_match and current_question:
            answers_str = correct_match.group(1)
            # Split by comma and clean
            answers = [a.strip().lower() for a in answers_str.split(',')]
            current_question['correct_answers'] = answers
            i += 1
            continue
        
        i += 1
    
    # Don't forget the last question
    if current_question and 'question_text' in current_question:
        questions.append(current_question)
    
    return questions

def escape_sql_string(s):
    """Escape string for SQL."""
    if s is None:
        return 'NULL'
    # Replace single quotes with two single quotes
    s = s.replace("'", "''")
    return f"'{s}'"

def generate_insert_sql(questions, category_id):
    """Generate SQL INSERT statements."""
    sql_statements = []
    
    for q in questions:
        question_text = escape_sql_string(q['question_text'])
        option_a = escape_sql_string(q['options'].get('a', ''))
        option_b = escape_sql_string(q['options'].get('b', ''))
        option_c = escape_sql_string(q['options'].get('c', ''))
        option_d = escape_sql_string(q['options'].get('d', ''))
        option_e = escape_sql_string(q['options'].get('e')) if 'e' in q['options'] else 'NULL'
        
        # Build correct_answers array
        correct_arr = '{' + ','.join(q['correct_answers']) + '}'
        
        sql = f"""INSERT INTO questions (
    question_text, option_a, option_b, option_c, option_d, option_e,
    correct_answers, subject_id, category_id, faculty_id, is_ai_generated
) VALUES (
    {question_text}, {option_a}, {option_b}, {option_c}, {option_d}, {option_e},
    '{correct_arr}', '{SUBJECT_BIOLOGY_ID}', '{category_id}', '{FACULTY_2LF_ID}', false
);"""
        sql_statements.append(sql)
    
    return '\n'.join(sql_statements)

# File mappings
FILE_MAPPINGS = [
    ('2LF_-_Biologie_člověka.md', 'Biologie člověka'),
    ('2LF_-_Biologie_rostlin_a_hub.md', 'Biologie rostlin a hub'),
    ('2LF_-_Biologie_živočichů.md', 'Biologie živočichů'),
    ('2LF_-_Buněčná_biologie.md', 'Buněčná biologie'),
    ('2LF_-_Ekologie.md', 'Ekologie'),
    ('2LF_-_Evoluční_biologie.md', 'Evoluční biologie'),
    ('2LF_-_Molekulární_biologie.md', 'Molekulární biologie'),
    ('2LF_-_Obecná_a_populační_genetika.md', 'Obecná a populační genetika'),
    ('2LF_-_Úvod_do_biologie.md', 'Úvod do biologie'),
    ('2LF_-_Historie_medicíny.md', 'Historie medicíny'),
]

def main():
    print("2LF Questions Import Script")
    print("=" * 50)
    
    for filename, category_name in FILE_MAPPINGS:
        print(f"\nProcessing: {filename}")
        print(f"Category: {category_name}")
        
        # Read file (this would be from user-uploads:// in actual implementation)
        # For now, just show the structure
        category_id = CATEGORY_MAPPING[category_name]
        print(f"Category ID: {category_id}")
        print(f"Faculty ID: {FACULTY_2LF_ID}")
        print(f"Subject ID: {SUBJECT_BIOLOGY_ID}")

if __name__ == '__main__':
    main()

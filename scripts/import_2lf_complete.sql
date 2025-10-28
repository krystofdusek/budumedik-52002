-- Import 2LF questions
-- This file contains all questions from the 2nd Medical Faculty entrance exam prep materials
-- Categories are mapped to existing database categories
-- All questions are marked as manually added (is_ai_generated = false)

-- NOTE: Due to the large number of questions (~3000+), this file should be executed
-- in batches or using a migration tool

-- Faculty: 2. lékařská fakulta UK (2LF)
-- Subject: Biologie
-- is_ai_generated: false (manually added questions)

-- The complete SQL will be generated in multiple parts due to size constraints
-- This is a template showing the structure

-- Example structure for each category:
/*
INSERT INTO questions (
    question_text, option_a, option_b, option_c, option_d, option_e,
    correct_answers, subject_id, category_id, faculty_id, is_ai_generated, year
) VALUES
('Question text', 'Option A', 'Option B', 'Option C', 'Option D', NULL,
 '{a}', '73d9d5a4-5b52-4daf-9728-4e4e53092107', 'category-uuid', 
 'f35cac2d-799a-4b0f-8700-bbddd4067b41', false, 606);
*/

-- Category IDs:
-- Biologie člověka: abfb7dba-ac86-41fb-8f39-0d169c6fc19e
-- Botanika (Biologie rostlin a hub): 8915ad72-9703-4e1b-8f76-95cc3c23f7bb
-- Zoologie (Biologie živočichů): c7ac38d0-0084-4de0-9cff-fc5ce4aff0a8
-- Cytologie (Buněčná biologie): b44e2240-71c0-4252-9835-eb873e97ad4b
-- Ekologie: c8b191cb-f201-4a04-92a3-ffc6edcd26ed
-- Evoluce (Evoluční biologie): 82a3044e-9475-4252-9539-975b5b57d10f
-- Genetika (Molekulární + Obecná genetika): 812b99e9-c015-465a-9d34-1c6a76358a01
-- Historie medicíny: 87aba960-3e79-41b6-92dd-050c3646c907

-- Due to file size, the actual SQL will be generated programmatically
-- Please use the Python script 'import_2lf_processor.py' to generate the complete SQL

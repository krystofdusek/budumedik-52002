import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/integrations/supabase/types';

const SUPABASE_URL = 'https://jcabdfmvjblzulnvvuso.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYWJkZm12amJsenVsbnZ2dXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODU3MzcsImV4cCI6MjA3NjY2MTczN30.k-95ZKmMdYCj5q2kRlcnlXcVVW_71ArgnXMhm7aYg10';

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

// IDs from database
const FACULTY_2LF_ID = 'f35cac2d-799a-4b0f-8700-bbddd4067b41';
const SUBJECT_BIOLOGY_ID = '73d9d5a4-5b52-4daf-9728-4e4e53092107';

const CATEGORY_MAPPING: Record<string, string> = {
  'Biologie člověka': 'abfb7dba-ac86-41fb-8f39-0d169c6fc19e',
  'Biologie rostlin a hub': '8915ad72-9703-4e1b-8f76-95cc3c23f7bb', // Botanika
  'Biologie živočichů': 'c7ac38d0-0084-4de0-9cff-fc5ce4aff0a8', // Zoologie
  'Buněčná biologie': 'b44e2240-71c0-4252-9835-eb873e97ad4b', // Cytologie
  'Ekologie': 'c8b191cb-f201-4a04-92a3-ffc6edcd26ed',
  'Evoluční biologie': '82a3044e-9475-4252-9539-975b5b57d10f', // Evoluce
  'Molekulární biologie': '812b99e9-c015-465a-9d34-1c6a76358a01', // Genetika (closest match)
  'Obecná a populační genetika': '812b99e9-c015-465a-9d34-1c6a76358a01', // Genetika
  'Úvod do biologie': 'abfb7dba-ac86-41fb-8f39-0d169c6fc19e', // Biologie člověka (general)
  'Historie medicíny': '87aba960-3e79-41b6-92dd-050c3646c907',
};

interface ParsedQuestion {
  questionNumber: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctAnswers: string[];
}

function parseQuestions(content: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  const lines = content.split('\n');
  
  let currentQuestion: Partial<ParsedQuestion> | null = null;
  let collectingAnswer = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and headers
    if (!line || line.startsWith('#')) continue;
    
    // New question starts with number and dot
    const questionMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion && currentQuestion.questionText) {
        questions.push(currentQuestion as ParsedQuestion);
      }
      
      currentQuestion = {
        questionNumber: questionMatch[1],
        questionText: questionMatch[2],
        correctAnswers: []
      };
      collectingAnswer = '';
      continue;
    }
    
    // Parse options
    const optionMatch = line.match(/^([a-e])\s*\)\s*(.+)/i);
    if (optionMatch && currentQuestion) {
      const optionLetter = optionMatch[1].toLowerCase();
      const optionText = optionMatch[2];
      
      switch (optionLetter) {
        case 'a':
          currentQuestion.optionA = optionText;
          break;
        case 'b':
          currentQuestion.optionB = optionText;
          break;
        case 'c':
          currentQuestion.optionC = optionText;
          break;
        case 'd':
          currentQuestion.optionD = optionText;
          break;
        case 'e':
          currentQuestion.optionE = optionText;
          break;
      }
      collectingAnswer = '';
      continue;
    }
    
    // Parse correct answers
    const correctMatch = line.match(/^correct:\s*(.+)/i);
    if (correctMatch && currentQuestion) {
      const answers = correctMatch[1].split(',').map(a => a.trim().toLowerCase());
      currentQuestion.correctAnswers = answers;
      collectingAnswer = '';
      continue;
    }
    
    // Continue multiline text
    if (currentQuestion && line && !line.startsWith('correct:')) {
      if (collectingAnswer) {
        collectingAnswer += ' ' + line;
      }
    }
  }
  
  // Save last question
  if (currentQuestion && currentQuestion.questionText) {
    questions.push(currentQuestion as ParsedQuestion);
  }
  
  return questions;
}

async function importQuestions(filePath: string, categoryName: string) {
  console.log(`\nImporting questions from ${filePath} to category ${categoryName}...`);
  
  const categoryId = CATEGORY_MAPPING[categoryName];
  if (!categoryId) {
    console.error(`Category ${categoryName} not found in mapping!`);
    return;
  }
  
  // Read file content (this would need to be replaced with actual file reading)
  // For now, this is a template
  
  console.log(`Category ID: ${categoryId}`);
  console.log(`Faculty ID: ${FACULTY_2LF_ID}`);
  console.log(`Subject ID: ${SUBJECT_BIOLOGY_ID}`);
}

async function main() {
  const fileMappings = [
    { file: '2LF_-_Biologie_člověka.md', category: 'Biologie člověka' },
    { file: '2LF_-_Biologie_rostlin_a_hub.md', category: 'Biologie rostlin a hub' },
    { file: '2LF_-_Biologie_živočichů.md', category: 'Biologie živočichů' },
    { file: '2LF_-_Buněčná_biologie.md', category: 'Buněčná biologie' },
    { file: '2LF_-_Ekologie.md', category: 'Ekologie' },
    { file: '2LF_-_Evoluční_biologie.md', category: 'Evoluční biologie' },
    { file: '2LF_-_Molekulární_biologie.md', category: 'Molekulární biologie' },
    { file: '2LF_-_Obecná_a_populační_genetika.md', category: 'Obecná a populační genetika' },
    { file: '2LF_-_Úvod_do_biologie.md', category: 'Úvod do biologie' },
    { file: '2LF_-_Historie_medicíny.md', category: 'Historie medicíny' },
  ];
  
  for (const mapping of fileMappings) {
    await importQuestions(mapping.file, mapping.category);
  }
}

main().catch(console.error);

export { parseQuestions, CATEGORY_MAPPING, FACULTY_2LF_ID, SUBJECT_BIOLOGY_ID };

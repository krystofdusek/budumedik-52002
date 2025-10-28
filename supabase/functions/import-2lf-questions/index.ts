import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Database IDs
const FACULTY_2LF_ID = 'f35cac2d-799a-4b0f-8700-bbddd4067b41'
const SUBJECT_BIOLOGY_ID = '73d9d5a4-5b52-4daf-9728-4e4e53092107'
const SUBJECT_CHEMISTRY_ID = '195658f1-3f71-46b1-a8ef-b0aba4a9458d'
const SUBJECT_PHYSICS_ID = '65c8e4c6-0257-47f0-8523-663bfefc9d91'

const CATEGORY_MAPPING: Record<string, { categoryId: string; subjectId: string }> = {
  'Biologie člověka': { categoryId: 'abfb7dba-ac86-41fb-8f39-0d169c6fc19e', subjectId: SUBJECT_BIOLOGY_ID },
  'Biologie rostlin a hub': { categoryId: '8915ad72-9703-4e1b-8f76-95cc3c23f7bb', subjectId: SUBJECT_BIOLOGY_ID },
  'Biologie živočichů': { categoryId: 'c7ac38d0-0084-4de0-9cff-fc5ce4aff0a8', subjectId: SUBJECT_BIOLOGY_ID },
  'Buněčná biologie': { categoryId: 'b44e2240-71c0-4252-9835-eb873e97ad4b', subjectId: SUBJECT_BIOLOGY_ID },
  'Ekologie': { categoryId: 'c8b191cb-f201-4a04-92a3-ffc6edcd26ed', subjectId: SUBJECT_BIOLOGY_ID },
  'Evoluční biologie': { categoryId: '82a3044e-9475-4252-9539-975b5b57d10f', subjectId: SUBJECT_BIOLOGY_ID },
  'Molekulární biologie': { categoryId: '812b99e9-c015-465a-9d34-1c6a76358a01', subjectId: SUBJECT_BIOLOGY_ID },
  'Obecná a populační genetika': { categoryId: '812b99e9-c015-465a-9d34-1c6a76358a01', subjectId: SUBJECT_BIOLOGY_ID },
  'Úvod do biologie': { categoryId: 'abfb7dba-ac86-41fb-8f39-0d169c6fc19e', subjectId: SUBJECT_BIOLOGY_ID },
  'Historie medicíny': { categoryId: '87aba960-3e79-41b6-92dd-050c3646c907', subjectId: SUBJECT_BIOLOGY_ID },
  'Mikrobiologie a virologie': { categoryId: '66826462-beeb-4676-8941-42d4522a704f', subjectId: SUBJECT_BIOLOGY_ID },
  'Anorganická chemie': { categoryId: '46eb7ac6-0111-46aa-9d93-b01aff59d606', subjectId: SUBJECT_CHEMISTRY_ID },
  'Biochemie': { categoryId: '6410a98c-f8d2-4b00-8f7d-1e1d3a371f3f', subjectId: SUBJECT_CHEMISTRY_ID },
  'Obecná chemie': { categoryId: 'f58ff025-d94f-4593-974a-353da0b9d783', subjectId: SUBJECT_CHEMISTRY_ID },
  'Organická chemie': { categoryId: 'a8f5b465-3d9a-4e5b-8cd3-5ffd6f9f0968', subjectId: SUBJECT_CHEMISTRY_ID },
  'Chemické výpočty': { categoryId: 'd9b81f90-860b-48f9-9c4d-ebe7e1377d56', subjectId: SUBJECT_CHEMISTRY_ID },
  'Atomová fyzika': { categoryId: 'cc2e10d5-0c52-44c8-b087-b40d04c1e842', subjectId: SUBJECT_PHYSICS_ID },
  'Elektřina a magnetismus': { categoryId: 'ac5ca3f7-0049-4c7f-ba23-3fde1b9466b5', subjectId: SUBJECT_PHYSICS_ID },
  'Elektromagnetické vlnění': { categoryId: 'deb90928-96e7-44e1-8f48-b41e8fd82cd3', subjectId: SUBJECT_PHYSICS_ID },
  'Kmitání vlnění a akustika': { categoryId: '9adc850a-6d15-40ee-abe7-62f4b56dda08', subjectId: SUBJECT_PHYSICS_ID },
  'Molekulová fyzika': { categoryId: 'e2c645ac-f143-4042-a332-695664cb17f3', subjectId: SUBJECT_PHYSICS_ID },
  'Optika': { categoryId: '986c5ff9-c5f2-4939-8dae-a5e63b3730f5', subjectId: SUBJECT_PHYSICS_ID },
  'Termika': { categoryId: 'e2c645ac-f143-4042-a332-695664cb17f3', subjectId: SUBJECT_PHYSICS_ID },
}

function normalizeCategoryName(name: string): string {
  const trimmed = (name || '').trim();
  if (CATEGORY_MAPPING[trimmed]) return trimmed;
  try {
    const bytes = new Uint8Array([...trimmed].map(c => c.charCodeAt(0)));
    const fixed = new TextDecoder('utf-8').decode(bytes);
    if (CATEGORY_MAPPING[fixed]) return fixed;
    const stripped = fixed.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const key of Object.keys(CATEGORY_MAPPING)) {
      const keyStripped = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (keyStripped === stripped) return key;
    }
    return fixed;
  } catch {
    return trimmed;
  }
}

interface ParsedQuestion {
  question_number: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e?: string
  correct_answers: string[]
}

function parseQuestions(content: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  const lines = content.split('\n')
  
  let currentQuestion: Partial<ParsedQuestion> = {}
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines and headers
    if (!line || line.startsWith('#')) continue
    
    // New question starts with number and dot
    const questionMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (questionMatch) {
      // Save previous question if valid
      if (currentQuestion.question_text) {
        questions.push(currentQuestion as ParsedQuestion)
      }
      
      currentQuestion = {
        question_number: parseInt(questionMatch[1]),
        question_text: questionMatch[2],
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answers: []
      }
      continue
    }
    
    // Parse options
    const optionMatch = line.match(/^([a-e])\s*\)\s*(.+)/i)
    if (optionMatch && currentQuestion) {
      const optionLetter = optionMatch[1].toLowerCase()
      const optionText = optionMatch[2]
      
      switch (optionLetter) {
        case 'a':
          currentQuestion.option_a = optionText
          break
        case 'b':
          currentQuestion.option_b = optionText
          break
        case 'c':
          currentQuestion.option_c = optionText
          break
        case 'd':
          currentQuestion.option_d = optionText
          break
        case 'e':
          currentQuestion.option_e = optionText
          break
      }
      continue
    }
    
    // Parse correct answers
    const correctMatch = line.match(/^correct:\s*(.+)/i)
    if (correctMatch && currentQuestion) {
      const answers = correctMatch[1].split(',').map(a => a.trim().toLowerCase())
      currentQuestion.correct_answers = answers
      continue
    }
  }
  
  // Save last question
  if (currentQuestion.question_text) {
    questions.push(currentQuestion as ParsedQuestion)
  }
  
  return questions
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { fileContents } = await req.json()
    
    if (!fileContents || !Array.isArray(fileContents)) {
      throw new Error('Invalid request: fileContents array is required')
    }

    const results = []
    
    for (const fileData of fileContents) {
      const { content, categoryName } = fileData
      
      console.log('Received categoryName:', categoryName, 'Type:', typeof categoryName)
      console.log('Available keys:', Object.keys(CATEGORY_MAPPING))
      console.log('Exact match exists:', categoryName in CATEGORY_MAPPING)

      const normalizedCategory = normalizeCategoryName(categoryName)
      console.log('Normalized category:', normalizedCategory)
      
      const mapping = CATEGORY_MAPPING[normalizedCategory]
      if (!mapping) {
        results.push({
          category: categoryName,
          error: `Category not found in mapping (normalized to "${normalizedCategory}"). Available categories: ${Object.keys(CATEGORY_MAPPING).join(', ')}`
        })
        continue
      }
      
      const questions = parseQuestions(content)
      
      // Insert questions in batches of 100
      const batchSize = 100
      let inserted = 0
      
      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize)
        
        const questionsToInsert = batch.map(q => ({
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          option_e: q.option_e || null,
          correct_answers: q.correct_answers,
          subject_id: mapping.subjectId,
          category_id: mapping.categoryId,
          faculty_id: FACULTY_2LF_ID,
          is_ai_generated: false,
          year: q.question_number
        }))
        
        const { error } = await supabaseClient
          .from('questions')
          .insert(questionsToInsert)
        
        if (error) {
          throw error
        }
        
        inserted += batch.length
      }
      
      results.push({
        category: categoryName,
        questionsImported: inserted
      })
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

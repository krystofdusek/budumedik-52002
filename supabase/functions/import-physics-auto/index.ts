import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FACULTY_2LF_ID = 'f35cac2d-799a-4b0f-8700-bbddd4067b41'
const SUBJECT_PHYSICS_ID = '65c8e4c6-0257-47f0-8523-663bfefc9d91'

const CATEGORY_MAPPING: Record<string, string> = {
  'Atomová fyzika': 'cc2e10d5-0c52-44c8-b087-b40d04c1e842',
  'Elektřina a magnetismus': 'ac5ca3f7-0049-4c7f-ba23-3fde1b9466b5',
  'Elektromagnetické vlnění': 'deb90928-96e7-44e1-8f48-b41e8fd82cd3',
  'Kmitání vlnění a akustika': '9adc850a-6d15-40ee-abe7-62f4b56dda08',
  'Molekulová fyzika': 'e2c645ac-f143-4042-a332-695664cb17f3',
  'Optika': '986c5ff9-c5f2-4939-8dae-a5e63b3730f5',
  'Termika': 'e2c645ac-f143-4042-a332-695664cb17f3',
}

const FILES = [
  { path: 'Atomová_fyzika.md', category: 'Atomová fyzika' },
  { path: 'Elektřina_a_magnetismus.md', category: 'Elektřina a magnetismus' },
  { path: 'Elektromagnetické_vlnění.md', category: 'Elektromagnetické vlnění' },
  { path: 'Kmitání_vlnění_a_akustika.md', category: 'Kmitání vlnění a akustika' },
  { path: 'Molekulová_fyzika.md', category: 'Molekulová fyzika' },
  { path: 'Optika.md', category: 'Optika' },
  { path: 'Termika.md', category: 'Termika' }
]

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
    
    if (!line || line.startsWith('#')) continue
    
    const questionMatch = line.match(/^(\d+\.\d+)\s+(.+)/)
    if (questionMatch) {
      if (currentQuestion.question_text) {
        questions.push(currentQuestion as ParsedQuestion)
      }
      
      currentQuestion = {
        question_number: parseFloat(questionMatch[1]),
        question_text: questionMatch[2],
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answers: []
      }
      continue
    }
    
    const optionMatch = line.match(/^([a-e])\s*[):]\s*(.+)/i)
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
    
    const correctMatch = line.match(/^correct:\s*(.+)/i)
    if (correctMatch && currentQuestion) {
      const answers = correctMatch[1].split(',').map(a => a.trim().toLowerCase())
      currentQuestion.correct_answers = answers
      continue
    }
  }
  
  if (currentQuestion.question_text) {
    questions.push(currentQuestion as ParsedQuestion)
  }
  
  return questions
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting automatic physics import...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const results = []
    
    for (const file of FILES) {
      try {
        console.log(`Processing ${file.category}...`)
        
        // Read file from public directory
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/data/2lf/${file.path}`)
        
        if (!response.ok) {
          // Try reading from local file system as fallback
          const localPath = `/var/task/public/data/2lf/${file.path}`
          let content: string
          try {
            content = await Deno.readTextFile(localPath)
          } catch {
            console.error(`Failed to load ${file.category} from both storage and local`)
            results.push({
              category: file.category,
              error: 'File not found'
            })
            continue
          }
          
          const questions = parseQuestions(content)
          
          const categoryId = CATEGORY_MAPPING[file.category]
          if (!categoryId) {
            results.push({
              category: file.category,
              error: 'Category not found in mapping'
            })
            continue
          }
          
          let inserted = 0
          const batchSize = 100
          
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
              subject_id: SUBJECT_PHYSICS_ID,
              category_id: categoryId,
              faculty_id: FACULTY_2LF_ID,
              is_ai_generated: false,
              year: Math.floor(q.question_number)
            }))
            
            const { error } = await supabaseClient
              .from('questions')
              .insert(questionsToInsert)
            
            if (error) {
              console.error(`Error inserting batch for ${file.category}:`, error)
              throw error
            }
            
            inserted += batch.length
          }
          
          results.push({
            category: file.category,
            questionsImported: inserted
          })
          
          console.log(`✓ Imported ${inserted} questions from ${file.category}`)
        }
      } catch (error) {
        console.error(`Error processing ${file.category}:`, error)
        results.push({
          category: file.category,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Import error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

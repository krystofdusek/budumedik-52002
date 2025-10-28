import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Database IDs
const FACULTY_3LF_ID = 'f4fd996d-ea36-4515-b4e5-d451edfb0d57'
const SUBJECT_CHEMISTRY_ID = '195658f1-3f71-46b1-a8ef-b0aba4a9458d'

// Category mapping with keywords
const CATEGORIES: Record<string, { id: string; keywords: string[] }> = {
  'Kyseliny, zásady a pufry': {
    id: 'd9b81f90-860b-48f9-9c4d-ebe7e1377d56',
    keywords: ['pH', 'pufr', 'kyselina', 'zásada', 'base', 'neutralizace', 'titr', 'Brønsted', 'Lowry', 'acidobazický', 'H3O', 'NaOH', 'HCl', 'H2SO4']
  },
  'Organická chemie': {
    id: 'a8f5b465-3d9a-4e5b-8cd3-5ffd6f9f0968',
    keywords: ['organická', 'ester', 'alkohol', 'aldehyd', 'keton', 'karboxyl', 'amid', 'izomer', 'chirální', 'geometrický', 'cis', 'trans', 'benzen', 'thiol', 'sulfon', 'aceton', 'methanol', 'ethanol', 'glykol', 'perfluor', 'diamin']
  },
  'Biochemie': {
    id: '6410a98c-f8d2-4b00-8f7d-1e1d3a371f3f',
    keywords: ['protein', 'albumin', 'kolagen', 'glykogen', 'celulóza', 'sacharid', 'glukóza', 'fruktóza', 'laktóza', 'sacharóza', 'lipid', 'triacylglycerol', 'cholesterol', 'aminokyselina', 'peptid', 'cystein', 'taurin', 'methionin', 'lysin', 'tryptofan', 'prolin', 'purin', 'pyrimidin', 'adenin', 'guanin', 'cytosin', 'hypoxantin', 'Aspartam', 'kyselina olejová', 'kyselina stearová', 'kyselina linolenová', 'kyselina linolová', 'kyselina arachidonová', 'amfifilní', 'amfipatický', 'kalomel', 'kobalamin', 'kreatinin', 'hemoglobin', 'cytochrom']
  },
  'Anorganická chemie': {
    id: '46eb7ac6-0111-46aa-9d93-b01aff59d606',
    keywords: ['selenid', 'sulfid', 'Na2', 'K2', 'iont', 'kationt', 'aniont', 'jodičná', 'manganistan', 'KMnO4', 'železo', 'draslík', 'fluor', 'rajský plyn', 'N2O']
  },
  'Redoxní děje a elektrochemie': {
    id: '981987d5-d941-426b-b49a-d808f263be30',
    keywords: ['redukce', 'oxidace', 'redukován', 'oxidován', 'elektron', 'redox', 'redukční činidlo', 'oxidační činidlo', 'K2Cr2O7']
  },
  'Roztoky a koncentrace': {
    id: 'fd1a33b2-d1db-41ed-ba39-2c7ae6e557a9',
    keywords: ['koncentrace', 'roztok', 'hmotnostní procent', 'molární', 'rozpustnost', 'osmotický tlak', 'mol', 'gram', 'objem']
  },
  'Fyzikální chemie': {
    id: 'd2fb8114-6efa-4d7a-85ea-8a60d601fd93',
    keywords: ['ideální plyn', 'tlak', 'teplota', 'objem', 'plynová konstanta', 'částice']
  },
  'Chemická rovnováha': {
    id: '78a925dc-8901-4a7a-9d98-43a6000e7371',
    keywords: ['rovnováha', 'exotermická', 'endotermická', 'reaktant', 'produkt', 'posun rovnováhy']
  },
  'Obecná chemie': {
    id: 'f58ff025-d94f-4593-974a-353da0b9d783',
    keywords: ['polární', 'elektronegativita', 'perioda', 'periodická tabulka', 'molekula', 'vazba', 'izotop', 'deuterium', 'tritium', 'protium', 'neutron', 'proton']
  }
}

function categorizeQuestion(text: string): string {
  const lowerText = text.toLowerCase()
  let bestMatch = 'Obecná chemie'
  let maxScore = 0

  for (const [categoryName, data] of Object.entries(CATEGORIES)) {
    let score = 0
    for (const keyword of data.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score++
      }
    }
    if (score > maxScore) {
      maxScore = score
      bestMatch = categoryName
    }
  }

  return CATEGORIES[bestMatch].id
}

interface ParsedQuestion {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answers: string[]
  category_id: string
}

function parseQuestions(content: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  const blocks = content.split(/\n\n\n+/).filter(b => b.trim())
  
  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l)
    
    if (lines.length < 6) continue
    
    let questionText = ''
    let optionA = '', optionB = '', optionC = '', optionD = ''
    let correctAnswer = ''
    
    let i = 0
    // Parse question text (may be multiple lines)
    while (i < lines.length && !lines[i].match(/^[1-4]\)/)) {
      if (questionText) questionText += ' '
      questionText += lines[i]
      i++
    }
    
    // Parse options
    while (i < lines.length) {
      const line = lines[i]
      
      if (line.match(/^1\)/)) {
        optionA = line.replace(/^1\)\s*/, '')
      } else if (line.match(/^2\)/)) {
        optionB = line.replace(/^2\)\s*/, '')
      } else if (line.match(/^3\)/)) {
        optionC = line.replace(/^3\)\s*/, '')
      } else if (line.match(/^4\)/)) {
        optionD = line.replace(/^4\)\s*/, '')
      } else if (line.match(/^correct:/i)) {
        correctAnswer = line.replace(/^correct:\s*/i, '').trim()
      }
      
      i++
    }
    
    if (questionText && optionA && optionB && optionC && optionD && correctAnswer) {
      // Normalize correct answer - handle both numeric (1,2,3,4) and letter (a,b,c,d) formats
      let normalizedAnswer: string
      if (correctAnswer.match(/^[1-4]$/)) {
        // Numeric format - convert to letter
        const mapping: Record<string, string> = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' }
        normalizedAnswer = mapping[correctAnswer]
      } else if (correctAnswer.match(/^[a-d]$/i)) {
        // Letter format - normalize to lowercase
        normalizedAnswer = correctAnswer.toLowerCase()
      } else if (correctAnswer === 'cc') {
        // Handle special case 'cc' -> 'c'
        normalizedAnswer = 'c'
      } else {
        console.log('Unknown answer format:', correctAnswer)
        continue
      }
      
      const categoryId = categorizeQuestion(questionText)
      
      questions.push({
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_answers: [normalizedAnswer],
        category_id: categoryId
      })
    }
  }
  
  return questions
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { content } = await req.json()
    
    if (!content) {
      throw new Error('Invalid request: content is required')
    }

    const questions = parseQuestions(content)
    console.log(`Parsed ${questions.length} questions`)
    
    // Group by category for logging
    const byCategory: Record<string, number> = {}
    for (const q of questions) {
      const categoryName = Object.keys(CATEGORIES).find(
        name => CATEGORIES[name].id === q.category_id
      ) || 'Unknown'
      byCategory[categoryName] = (byCategory[categoryName] || 0) + 1
    }
    console.log('Distribution by category:', byCategory)

    // Insert questions in batches
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
        option_e: null,
        correct_answers: q.correct_answers,
        subject_id: SUBJECT_CHEMISTRY_ID,
        category_id: q.category_id,
        faculty_id: FACULTY_3LF_ID,
        is_ai_generated: false,
        year: null
      }))
      
      const { error } = await supabaseClient
        .from('questions')
        .insert(questionsToInsert)
      
      if (error) {
        console.error('Insert error:', error)
        throw error
      }
      
      inserted += batch.length
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        questionsImported: inserted,
        distribution: byCategory
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

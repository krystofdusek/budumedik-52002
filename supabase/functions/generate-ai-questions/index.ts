import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subjectId, categoryId, facultyId, count = 10 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token || '');
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Fetch user's weak areas (categories with low success rate)
    const { data: userAnswers } = await supabase
      .from('user_answers')
      .select(`
        is_correct,
        question_id,
        questions!inner(category_id, subject_id, faculty_id)
      `)
      .eq('user_id', user.id);

    // Fetch subject, category, and faculty details
    const { data: subject } = await supabase
      .from('subjects')
      .select('name, type')
      .eq('id', subjectId)
      .single();

    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', categoryId)
      .single();

    const { data: faculty } = await supabase
      .from('faculties')
      .select('name, code, has_option_e, allows_multiple_correct')
      .eq('id', facultyId)
      .single();

    // Fetch sample questions from database for context
    const { data: sampleQuestions } = await supabase
      .from('questions')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('category_id', categoryId)
      .eq('faculty_id', facultyId)
      .limit(3);

    // Calculate weak areas
    const categoryStats: Record<string, { correct: number; total: number }> = {};
    userAnswers?.forEach((answer: any) => {
      const catId = answer.questions.category_id;
      if (!categoryStats[catId]) {
        categoryStats[catId] = { correct: 0, total: 0 };
      }
      categoryStats[catId].total++;
      if (answer.is_correct) categoryStats[catId].correct++;
    });

    const weakAreas = Object.entries(categoryStats)
      .filter(([_, stats]) => stats.total > 0 && stats.correct / stats.total < 0.7)
      .map(([catId]) => catId);

    // Create AI prompt
    const systemPrompt = `Jsi expert na tvorbu přijímacích otázek na lékařské fakulty v České republice. 
Tvým úkolem je vytvořit autentické a náročné otázky, které odpovídají reálným přijímacím zkouškám.

SPECIFIKACE FAKULTY ${faculty?.code}:
- Název: ${faculty?.name}
- Možnost E: ${faculty?.has_option_e ? 'ANO' : 'NE'}
- Více správných odpovědí: ${faculty?.allows_multiple_correct ? 'ANO' : 'NE'}

PŘEDMĚT: ${subject?.name} (typ: ${subject?.type})
KATEGORIE: ${category?.name}

${subject?.name === 'Fyzika' && (faculty?.code === '3LF' || faculty?.code === 'LFHK') ? 
  'DŮLEŽITÉ: Pro tuto fakultu jsou fyzikální otázky velmi náročné a obsahují složité výpočty a příklady. Zaměř se na matematicky náročné úlohy.' : ''}

${sampleQuestions && sampleQuestions.length > 0 ? 
  `PŘÍKLADY EXISTUJÍCÍCH OTÁZEK PRO INSPIRACI:\n${sampleQuestions.map((q: any, i: number) => 
    `${i + 1}. ${q.question_text}\n   A) ${q.option_a}\n   B) ${q.option_b}\n   C) ${q.option_c}\n   D) ${q.option_d}${q.option_e ? `\n   E) ${q.option_e}` : ''}\n   Správné: ${q.correct_answers.join(', ')}`
  ).join('\n\n')}` : ''}

${weakAreas.length > 0 ? `SLABÉ STRÁNKY UŽIVATELE: Zaměř se více na kategorie, kde má student problémy.` : ''}

Vytvoř ${count} originálních otázek. Každá otázka musí být:
1. Autentická a odpovídající reálným přijímačkám
2. S jednou nebo více správnými odpověďmi (podle specifikace fakulty)
3. S vysvětlením správné odpovědi
4. Vhodné obtížnosti pro medicínské studium

Pro fyziku na 3LF/LFHK vytvárej hlavně složité příklady s výpočty.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Vytvoř ${count} otázek ve formátu JSON array s těmito poli: question_text, option_a, option_b, option_c, option_d${faculty?.has_option_e ? ', option_e' : ''}, correct_answers (array), explanation` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_questions",
              description: "Generate medical entrance exam questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_text: { type: "string" },
                        option_a: { type: "string" },
                        option_b: { type: "string" },
                        option_c: { type: "string" },
                        option_d: { type: "string" },
                        option_e: { type: "string" },
                        correct_answers: { 
                          type: "array",
                          items: { type: "string" }
                        },
                        explanation: { type: "string" }
                      },
                      required: ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_answers", "explanation"]
                    }
                  }
                },
                required: ["questions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_questions" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const generatedQuestions = JSON.parse(toolCall.function.arguments).questions;

    console.log(`Generated ${generatedQuestions.length} questions`);

    return new Response(
      JSON.stringify({ questions: generatedQuestions }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-ai-questions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
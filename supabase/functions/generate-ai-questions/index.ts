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
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user has admin role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !userRole) {
      console.warn(`Unauthorized AI generation attempt by user: ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`AI question generation initiated by admin: ${user.id}`);

    // Fetch user's weak areas (categories with low success rate)
    const { data: userAnswers } = await supabase
      .from('user_answers')
      .select(`
        is_correct,
        question_id,
        questions!inner(category_id, subject_id, faculty_id)
      `)
      .eq('user_id', user.id);

    // Fetch faculty details (required)
    const { data: faculty } = await supabase
      .from('faculties')
      .select('name, code, has_option_e, allows_multiple_correct')
      .eq('id', facultyId)
      .single();

    if (!faculty) {
      throw new Error('Faculty not found');
    }

    // Fetch all subjects if no specific subject selected
    let subjects: any[] = [];
    if (!subjectId) {
      const { data: allSubjects } = await supabase
        .from('subjects')
        .select('id, name, type');
      subjects = allSubjects || [];
    } else {
      const { data: subject } = await supabase
        .from('subjects')
        .select('id, name, type')
        .eq('id', subjectId)
        .single();
      if (subject) subjects = [subject];
    }

    // Fetch categories for all subjects or specific subject
    let subjectCategoriesMap: Record<string, any[]> = {};
    if (!subjectId) {
      // If no specific subject, fetch categories for all subjects
      for (const subject of subjects) {
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name, subject_id')
          .eq('subject_id', subject.id);
        if (cats && cats.length > 0) {
          subjectCategoriesMap[subject.id] = cats;
        }
      }
    } else if (!categoryId) {
      // If subject selected but no category, fetch all categories for that subject
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name, subject_id')
        .eq('subject_id', subjectId);
      if (cats) {
        subjectCategoriesMap[subjectId] = cats;
      }
    }

    // Fetch sample questions from database for context (reduced for speed)
    let sampleQuestionsQuery = supabase
      .from('questions')
      .select('*')
      .eq('faculty_id', facultyId);

    if (subjectId) {
      sampleQuestionsQuery = sampleQuestionsQuery.eq('subject_id', subjectId);
    }
    
    if (categoryId) {
      sampleQuestionsQuery = sampleQuestionsQuery.eq('category_id', categoryId);
    }

    const { data: sampleQuestions } = await sampleQuestionsQuery.limit(1);

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
    let subjectInfo = '';
    if (subjects.length === 1) {
      subjectInfo = `PŘEDMĚT: ${subjects[0].name} (typ: ${subjects[0].type})`;
    } else if (subjects.length > 1) {
      subjectInfo = `PŘEDMĚTY: Rovnoměrně distribuuj otázky mezi tyto předměty:\n${subjects.map(s => `- ${s.name} (${s.type})`).join('\n')}`;
    }

    let categoryInfo = '';
    if (categoryId) {
      // Fetch the specific category name
      const { data: cat } = await supabase
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .single();
      if (cat) {
        categoryInfo = `KATEGORIE: ${cat.name}`;
      }
    } else {
      // Get all categories for the prompt
      const allCats = Object.values(subjectCategoriesMap).flat();
      if (allCats.length > 0) {
        categoryInfo = `KATEGORIE: Rovnoměrně distribuuj otázky mezi tyto kategorie:\n${allCats.map((c: any) => `- ${c.name}`).join('\n')}`;
      }
    }

    const systemPrompt = `Jsi expert na tvorbu přijímacích otázek na lékařské fakulty v ČR.

FAKULTA: ${faculty.name} (${faculty.code})
- Možnost E: ${faculty.has_option_e ? 'ANO' : 'NE'}
- Více správných: ${faculty.allows_multiple_correct ? 'ANO' : 'NE'}

${subjectInfo}
${categoryInfo}

${subjects.some(s => s.name === 'Fyzika') && (faculty.code === '3LF' || faculty.code === 'LFHK') ? 
  'DŮLEŽITÉ: Fyzika - náročné výpočty a příklady.' : ''}

${!subjectId && !categoryId ? 
  'DŮLEŽITÉ: Rovnoměrně distribuuj otázky mezi všechny předměty a kategorie.' : ''}

Vytvoř ${count} originálních otázek:
- Autentické, odpovídající reálným přijímačkám
- S vysvětlením správné odpovědi
- Vhodné obtížnosti pro medicínu
${!subjectId ? '- Rovnoměrně mezi předměty' : ''}
${!categoryId && subjectId ? '- Rovnoměrně mezi kategorie' : ''}`;

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
          { role: 'user', content: `Vytvoř ${count} otázek ve formátu JSON array: question_text, option_a, option_b, option_c, option_d${faculty.has_option_e ? ', option_e' : ''}, correct_answers (array), explanation` }
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

    // Distribute questions across subjects and categories
    const questionsToInsert = [];
    const questionsPerSubject = Math.ceil(count / Math.max(subjects.length, 1));
    
    for (let i = 0; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i];
      
      // Distribute across subjects if multiple
      const subjectIndex = subjects.length > 1 ? Math.floor(i / questionsPerSubject) % subjects.length : 0;
      const selectedSubject = subjects[subjectIndex] || subjects[0];
      
      // Get categories for this subject
      let availableCategories = subjectCategoriesMap[selectedSubject.id] || [];
      
      // If we have a specific categoryId, use it
      let finalCategoryId = categoryId;
      
      // Otherwise distribute across available categories
      if (!categoryId && availableCategories.length > 0) {
        const categoryIndex = i % availableCategories.length;
        finalCategoryId = availableCategories[categoryIndex].id;
      }
      
      // If still no category, fetch first available for this subject
      if (!finalCategoryId) {
        const { data: firstCat } = await supabase
          .from('categories')
          .select('id')
          .eq('subject_id', selectedSubject.id)
          .limit(1)
          .single();
        
        if (firstCat) {
          finalCategoryId = firstCat.id;
        } else {
          console.error(`No category found for subject ${selectedSubject.id}`);
          continue; // Skip this question if no category exists
        }
      }

      questionsToInsert.push({
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        option_e: q.option_e || null,
        correct_answers: q.correct_answers,
        explanation: q.explanation || null,
        subject_id: selectedSubject.id,
        category_id: finalCategoryId,
        faculty_id: facultyId,
        is_ai_generated: true,
        is_active: true
      });
    }

    // Insert questions into database
    const { data: insertedQuestions, error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting questions:', insertError);
      throw insertError;
    }

    console.log(`Inserted ${insertedQuestions.length} AI questions into database`);

    return new Response(
      JSON.stringify({ questions: insertedQuestions }),
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
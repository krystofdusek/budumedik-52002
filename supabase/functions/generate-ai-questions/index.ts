import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY is not set');
      return new Response(JSON.stringify({
        error: 'Lovable AI API key not configured'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userId = user.id;

    const body = await req.json();
    const { facultyId, subjectId, categoryId, count = 10, personalizedForUser = false } = body;

    if (!facultyId) {
      return new Response(JSON.stringify({
        error: 'Missing facultyId'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`🚀 Generating ${count} questions for faculty ${facultyId}, subject ${subjectId || 'ALL'}, category ${categoryId || 'ALL'}, personalized: ${personalizedForUser}`);

    const { data: faculty } = await supabase
      .from('faculties')
      .select('name')
      .eq('id', facultyId)
      .maybeSingle();

    if (!faculty) {
      return new Response(JSON.stringify({
        error: 'Invalid faculty'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const facultyName = faculty.name;
    const is2LF = facultyName === '2. lékařská fakulta UK';
    const is3LF = facultyName === '3. lékařská fakulta UK';
    const isBrno = facultyName === 'Lékařská fakulta MU';

    console.log(`🏥 Faculty: ${facultyName}`);
    console.log(`🔢 is2LF: ${is2LF}, is3LF: ${is3LF}, isBrno: ${isBrno}`);

    let subjectsToGenerate: any[] = [];
    if (subjectId && categoryId) {
      const { data: subject } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .maybeSingle();
      const { data: category } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .maybeSingle();
      if (subject && category) {
        subjectsToGenerate = [
          {
            id: subject.id,
            name: subject.name,
            categories: [category]
          }
        ];
      }
    } else if (subjectId && !categoryId) {
      const { data: subject } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .maybeSingle();
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('subject_id', subjectId)
        .order('name');
      if (subject && categories && categories.length > 0) {
        subjectsToGenerate = [
          {
            id: subject.id,
            name: subject.name,
            categories: categories
          }
        ];
      }
    } else {
      const { data: allSubjects } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      const { data: allCategories } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (allSubjects && allCategories) {
        const subjectMap = new Map();
        allSubjects.forEach((s: any) => {
          subjectMap.set(s.id, {
            ...s,
            categories: []
          });
        });
        allCategories.forEach((c: any) => {
          if (subjectMap.has(c.subject_id)) {
            subjectMap.get(c.subject_id).categories.push(c);
          }
        });
        subjectsToGenerate = Array.from(subjectMap.values()).filter((s: any) => s.categories.length > 0);
      }
    }

    if (subjectsToGenerate.length === 0) {
      return new Response(JSON.stringify({
        error: 'No subjects/categories found for given filters'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`📚 Will generate for ${subjectsToGenerate.length} subject(s)`);

    let personalizationContext = '';
    let weakAreaDetails = '';
    let hasRelevantHistory = false;
    
    if (personalizedForUser) {
      console.log('🎯 Building personalization context for user', user.id);
      let wrongAnswersQuery = supabase
        .from('user_answers')
        .select('question_id, is_correct, questions(id, question_text, option_a, option_b, option_c, option_d, option_e, correct_answers, explanation, subject_id, category_id, subjects(name), categories(name))')
        .eq('user_id', user.id)
        .eq('is_correct', false);
      
      // Filter by current filters (subject/category)
      if (subjectId) {
        wrongAnswersQuery = wrongAnswersQuery.eq('questions.subject_id', subjectId);
      }
      if (categoryId) {
        wrongAnswersQuery = wrongAnswersQuery.eq('questions.category_id', categoryId);
      }
      
      const { data: wrongAnswers } = await wrongAnswersQuery
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Check if we have relevant history for the current filters
      if (wrongAnswers && wrongAnswers.length > 0) {
        hasRelevantHistory = true;
        console.log(`✅ Found ${wrongAnswers.length} wrong answers for personalization`);
        
        const errorPatterns = wrongAnswers
          .map((wa: any) => {
            const q = wa.questions;
            if (!q) return null;
            return {
              subject: q.subjects?.name,
              category: q.categories?.name,
              text: q.question_text,
              optionA: q.option_a,
              optionB: q.option_b,
              optionC: q.option_c,
              optionD: q.option_d,
              optionE: q.option_e,
              correctAnswer: q.correct_answers ? q.correct_answers.join('+') : 'N/A',
              explanation: q.explanation
            };
          })
          .filter(Boolean);
        
        if (errorPatterns.length > 0) {
          const categoryCount = new Map();
          errorPatterns.forEach((p: any) => {
            if (p?.category) {
              categoryCount.set(p.category, (categoryCount.get(p.category) || 0) + 1);
            }
          });
          
          const topErrorCategories = Array.from(categoryCount.entries())
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 3)
            .map(([cat, cnt]) => `${cat} (${cnt}x)`);
          
          const errorExamples = errorPatterns
            .slice(0, 5)
            .map((p: any, i: number) => `\n━━━ CHYBNÁ OTÁZKA #${i + 1} ━━━
${p?.subject} → ${p?.category}
Otázka: ${p?.text}
A) ${p?.optionA}
B) ${p?.optionB}
C) ${p?.optionC}
D) ${p?.optionD}${p?.optionE ? `\nE) ${p.optionE}` : ''}
✓ Správně: ${p?.correctAnswer}
💡 ${p?.explanation || 'Bez vysvětlení'}`)
            .join('\n');
          
          personalizationContext = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ČÁSTEČNÁ PERSONALIZACE (volitelná inspirace)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Student měl problémy v těchto kategoriích: ${topErrorCategories.join(', ')}

Zde jsou příklady chybných odpovědí:${errorExamples}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 INSTRUKCE PRO PERSONALIZACI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Vytvoř RŮZNORODÉ otázky pokrývající CELOU kategorii
✅ NĚKTERÉ otázky mohou testovat podobné koncepty jako chybné (30-40%)
✅ VĚTŠINA otázek by měla být standardní pro danou kategorii (60-70%)
⚠️ NEOMEZUJ se pouze na témata z chybných odpovědí!
⚠️ Zachovej ŠIROKÝ ZÁBĚR celé kategorie!`;
        }
      } else {
        console.log(`ℹ️ No wrong answers found for current filters - using standard generation`);
      }
    }

    let allGeneratedQuestions: any[] = [];
    const totalSubjects = subjectsToGenerate.length;
    const questionsPerSubject = Math.floor(count / totalSubjects);
    const subjectRemainder = count % totalSubjects;
    const generationPromises = [];
    let subjectIndex = 0;
    for (const subject of subjectsToGenerate) {
      const questionsForSubject = questionsPerSubject + (subjectIndex < subjectRemainder ? 1 : 0);
      subjectIndex++;
      const categoriesInSubject = subject.categories.length;
      const questionsPerCategory = Math.floor(questionsForSubject / categoriesInSubject);
      const categoryRemainder = questionsForSubject % categoriesInSubject;
      let categoryIndex = 0;
      for (const category of subject.categories) {
        const questionsForThis = questionsPerCategory + (categoryIndex < categoryRemainder ? 1 : 0);
        categoryIndex++;
        if (questionsForThis === 0) continue;
        console.log(`📝 Generating ${questionsForThis} questions for ${subject.name} - ${category.name}`);
        const { data: realQuestions } = await supabase
          .from('questions')
          .select('question_text, option_a, option_b, option_c, option_d, option_e, correct_answers, explanation')
          .eq('faculty_id', facultyId)
          .eq('subject_id', subject.id)
          .eq('category_id', category.id)
          .eq('is_ai_generated', false)
          .limit(15);
        let inspirationContext = '';
        if (realQuestions && realQuestions.length > 0) {
          const examples = realQuestions
            .map((q: any, i: number) => {
              const correctAns = q.correct_answers ? q.correct_answers.join('+') : q.correct_answer;
              const isMulti = Array.isArray(q.correct_answers) && q.correct_answers.length > 1;
              return `━━━ REÁLNÁ OTÁZKA #${i + 1} (z minulých přijímaček) ━━━
Otázka: ${q.question_text}
A) ${q.option_a}
B) ${q.option_b}
C) ${q.option_c}
D) ${q.option_d}${q.option_e ? `\nE) ${q.option_e}` : ''}
✓ Správně: ${correctAns}${isMulti ? ' (více správných!)' : ''}
💡 Vysvětlení: ${q.explanation || 'N/A'}`;
            })
            .join('\n\n');
          inspirationContext = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 VZOROVÉ OTÁZKY Z REÁLNÝCH PŘIJÍMAČEK (${facultyName})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${examples}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 TVŮJ ÚKOL: Vytvoř nové otázky které jsou:
✅ STEJNĚ formulované (použij podobný jazyk, terminologii)
✅ STEJNĚ náročné (stejná úroveň detailů a znalostí)
✅ STEJNÉHO STYLU (pokud jsou otázky faktografické/výpočtové/kazuistiky, drž se toho)
✅ S PODOBNOU STRUKTUROU odpovědí
✅ S KVALITNÍM vysvětlením správné odpovědi

⚠️ NEOPISUJ otázky! Vytvoř NOVÉ, ale ve STEJNÉM stylu!`;
        }
        let physicsRequirement = '';
        if (is3LF && subject.name === 'Fyzika') {
          physicsRequirement = '\n\n🧮 SPECIÁLNÍ POŽADAVEK 3. LF: Pro fyziku vytvoř složité výpočtové příklady s konkrétními čísly, vzorci a jednotkami. 90% otázek musí být numerické výpočty.';
        }
        const facultySpecs: Record<string, string> = {
          '2. lékařská fakulta UK': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔢 KRITICKÉ SPECIFIKUM 2. LF UK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 2. LF používá systém s VÍCE SPRÁVNÝMI ODPOVĚĎMI!

Pravidla:
✅ Otázky MŮŽOU mít 1, 2, 3 nebo 4 správné odpovědi
✅ Pokud má více správných → vrať ["A","B"] nebo ["A","C","D"] (pole)
✅ Pokud má pouze jednu → vrať "A" (string)
✅ Možnosti pouze A, B, C, D (NIKDY E)
✅ Student může vždy vybrat více odpovědí, i když je správná jen jedna!

Příklady:
• Jednoduchá: "A"
• Multi: ["A","C"]
• Multi: ["B","C","D"]

🎯 DŮLEŽITÉ: Ke každé otázce napiš "Správná odpověď může být jedna i více." aby student věděl, že může zaškrtnout více možností!

📊 Doporučení: Vytvoř alespoň 30-40% otázek s více správnými odpověďmi!`,
          '3. lékařská fakulta UK': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 KRITICKÉ SPECIFIKUM 3. LF UK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pravidla:
✅ Standardní otázky s JEDNOU správnou odpovědí
✅ Velmi NÁROČNÉ otázky (vysoká úroveň detailů)
✅ Možnosti pouze A, B, C, D (NIKDY E)
✅ Zvláštní důraz na FYZIKU: 90% výpočtů!

Formát odpovědi: "A" (pouze string, NIKDY pole)`,
          'Lékařská fakulta MU': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ KRITICKÉ SPECIFIKUM LF MUNI BRNO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ BRNO má speciální možnost E) "Žádná odpověď není správná"

Pravidla:
✅ KAŽDÁ otázka MUSÍ mít možnost E) "Žádná odpověď není správná"
✅ Možnost E jako správnou použij POUZE když A-D jsou opravdu VŠECHNY špatně
✅ VŽDY pouze JEDNA správná odpověď → vrať "A" nebo "E" (string, NIKDY pole!)
✅ NIKDY nepoužívej více správných odpovědí → NIKDY ["A","B"] nebo ["C","E"]

Příklady:
• Jednoduchá: "B"
• Správná je E: "E"
• Správná je C: "C"

❌ ZAKÁZÁNO: ["A","D"] nebo ["B","E"] - NIKDY nepoužívej pole!

📊 Doporučení: ~90% otázek má správnou v A-D, ~10% s E jako správnou`
        };
        const facultySpec = facultySpecs[facultyName] || 'Standardní formát s jednou správnou odpovědí, možnosti A-D.';
        const prompt = `Jsi expert na tvorbu přijímacích testů pro lékařské fakulty v ČR. Vytvoř ${questionsForThis} MAXIMÁLNĚ REALISTICKÝCH otázek.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏥 CÍLOVÁ FAKULTA: ${facultyName}
📖 PŘEDMĚT: ${subject.name}
🎯 KATEGORIE: ${category.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${facultySpec}${physicsRequirement}${inspirationContext}${personalizationContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📏 FORMÁTOVACÍ POŽADAVKY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Otázky by měly být STRUČNÉ a JASNÉ
✅ Vyhni se zbytečně dlouhým formulacím
✅ Odpovědi by měly být KONKRÉTNÍ a KRÁTKÉ
❌ Nepiš často dlouhé otázky s nadbytečnými detaily

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 HIERARCHIE PRIORITY (NEJDŮLEŽITĚJŠÍ NAHOŘE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🔴 KRITICKÉ: Respektuj SPECIFIKUM fakulty (multi-answer pro 2LF, option E pro MUNI)
2. 🔴 KRITICKÉ: Pokud máš VZOROVÉ OTÁZKY z reálných testů, vytvoř otázky ve STEJNÉM STYLU a STEJNÉ NÁROČNOSTI
3. 🟡 DŮLEŽITÉ: Pokud je personalizace, využij ji ČÁSTEČNĚ (30-40% otázek), ale vytvoř RŮZNORODÝ test
4. 🟡 DŮLEŽITÉ: Použij odbornou terminologii a přesnost
5. 🟡 DŮLEŽITÉ: Poskytni kvalitní vysvětlení správné odpovědi

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${is2LF ? `🔢 2. LF UK - KRITICKÉ UPOZORNĚNÍ:
• Vytvoř MINIMÁLNĚ 30-40% otázek kde jsou 2+ správné odpovědi!
• Pro multi-answer MUSÍŠ vrátit POLE: ["A","C"] nebo ["B","D"]
• Pro single-answer vrať STRING: "A"
• Příklady správných formátů:
  ✓ "correct_answer": ["A","B","D"]  (3 správné)
  ✓ "correct_answer": ["A","C"]      (2 správné)
  ✓ "correct_answer": "B"            (1 správná)` : ''}
${isBrno ? `✅ LF MUNI BRNO - KRITICKÉ UPOZORNĚNÍ:
• KAŽDÁ otázka MUSÍ mít option_e: "Žádná odpověď není správná"
• Možnost E použij jako správnou jen když A-D jsou VŠECHNY špatně
• VŽDY pouze JEDNA správná odpověď → vrať STRING "A" nebo "E"
• NIKDY nepoužívej pole ["A","B"] - pouze string!
• Příklady správných formátů:
  ✓ "correct_answer": "E"        (single)
  ✓ "correct_answer": "B"        (single)
  ❌ "correct_answer": ["A","D"]  (ŠPATNĚ - pole zakázáno!)` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 VRAŤ POUZE validní JSON (bez komentářů, bez markdown):
{
  "questions": [
    {
      "question_text": "Text otázky",
      "option_a": "Odpověď A",
      "option_b": "Odpověď B",
      "option_c": "Odpověď C",
      "option_d": "Odpověď D",
      "option_e": ${isBrno ? '"Žádná odpověď není správná"' : 'null'},
      "correct_answer": ${is2LF ? '["A","C"] nebo "B"' : isBrno ? '"E" nebo "A"' : '"A"'},
      "explanation": "Vysvětlení"
    }
  ]
}

${is2LF ? '⚠️ PŘIPOMENUTÍ 2LF: 30-40% otázek = POLE ["A","B"], zbytek = STRING "A"' : ''}
${isBrno ? '⚠️ PŘIPOMENUTÍ BRNO: VŽDY option_e, POUZE STRING "E" nebo "A" (NIKDY pole!)' : ''}`;
        const generatePromise = fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lovableApiKey}`
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `Jsi ODBORNÝ PEDAGOG a EXPERT na přípravu přijímacích testů na lékařské fakulty v České republice.

Tvoje hlavní dovednosti:
• Důvěrná znalost SKUTEČNÝCH testů z minulých let
• Schopnost napodobit PŘESNÝ STYL reálných přijímaček (terminologie, formulace, struktura)
• Expertní znalost medicínských předmětů (biologie, chemie, fyzika)
• Tvorba otázek s VÍCE SPRÁVNÝMI odpověďmi (pro 2. LF UK)
• Tvorba otázek s možností E) "Žádná odpověď není správná" (pro LF MUNI Brno)

${is2LF ? `━━━ 2. LF UK REŽIM AKTIVOVÁN ━━━
⚠️ POVINNĚ vytvářej 30-40% otázek s více správnými odpověďmi!
⚠️ Pro multi-answer MUSÍŠ vrátit POLE: ["A","C"] nebo ["B","D"]
⚠️ Pro single-answer vrať STRING: "A"
⚠️ NIKDY option_e (null)` : ''}

${isBrno ? `━━━ LF MUNI BRNO REŽIM AKTIVOVÁN ━━━
⚠️ KAŽDÁ otázka MUSÍ mít option_e: "Žádná odpověď není správná"
⚠️ Možnost E jako správnou dávej jen když A-D jsou VŠECHNY špatně
⚠️ VŽDY pouze JEDNA správná odpověď → vrať STRING "A" nebo "E"
⚠️ NIKDY nepoužívej pole ["A","B"] - pouze string!` : ''}

${is3LF ? `━━━ 3. LF UK REŽIM AKTIVOVÁN ━━━
⚠️ Standardní otázky s JEDNOU správnou odpovědí (STRING "A")
⚠️ Velmi NÁROČNÉ otázky
⚠️ NIKDY option_e (null)` : ''}

PRAVIDLA:
✅ Vracíš POUZE validní JSON (bez markdown, bez komentářů)
✅ Otázky jsou ODBORNĚ PŘESNÉ a použitelné na skutečných přijímačkách
✅ Otázky jsou STRUČNÉ, ale mohou být i delší pokud je to nutné
✅ Pokud dostaneš VZOROVÉ otázky z reálných testů, vytvoříš nové VE STEJNÉM STYLU a STEJNÉ NÁROČNOSTI
✅ Pokud dostaneš personalizaci, využiješ ji ČÁSTEČNĚ (30-40% otázek), zbytek bude standardní
✅ Vytvoř RŮZNORODÝ test pokrývající CELOU kategorii
✅ Respektuješ SPECIFIKUM každé fakulty (multi-answer, option E) - viz výše`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            response_format: {
              type: 'json_object'
            }
          })
        })
          .then(async (openaiResponse) => {
            if (!openaiResponse.ok) {
              const errorText = await openaiResponse.text();
              console.error('❌ OpenAI API error for', subject.name, category.name, ':', errorText);
              return [];
            }
            try {
              const aiResponse = await openaiResponse.json();
              const content = aiResponse.choices[0].message.content;
              const parsed = JSON.parse(content);
              const questions = parsed.questions || [];
              console.log(`✅ Generated ${questions.length} questions for ${subject.name} - ${category.name}`);
              return questions.map((q: any, idx: number) => {
              let hasMultipleAnswers = false;
              let correctAnswersArray: string[] = [];
              
              if (Array.isArray(q.correct_answer)) {
                correctAnswersArray = q.correct_answer.map((a: any) => a.toString().toUpperCase().trim());
                hasMultipleAnswers = correctAnswersArray.length > 1;
                console.log(`🔢 Q${idx + 1} Answers (array):`, correctAnswersArray);
              } else if (typeof q.correct_answer === 'string') {
                const answerStr = q.correct_answer.toString().toUpperCase().trim();
                if (answerStr.includes(',') || answerStr.includes('+') || answerStr.includes(' ')) {
                  const parts = answerStr.split(/[,+\s]+/).filter((p: string) => p.length > 0);
                  correctAnswersArray = parts;
                  hasMultipleAnswers = parts.length > 1;
                  console.log(`🔢 Q${idx + 1} Answers (parsed string):`, correctAnswersArray);
                } else {
                  correctAnswersArray = [answerStr];
                  console.log(`✓ Q${idx + 1} Single answer:`, correctAnswersArray);
                }
              }
              
              let finalOptionE = q.option_e || null;
              if (isBrno && !finalOptionE) {
                finalOptionE = 'Žádná odpověď není správná';
                console.log(`⚠️ Q${idx + 1} MUNI - Adding missing option_e`);
              }
              
              return {
                faculty_id: facultyId,
                subject_id: subject.id,
                category_id: category.id,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                option_e: finalOptionE,
                correct_answers: correctAnswersArray,
                explanation: q.explanation,
                is_ai_generated: true
              };
              });
            } catch (err) {
              console.error('❌ Failed to parse OpenAI response for', subject.name, category.name, ':', err);
              return [];
            }
          })
          .catch((err) => {
            console.error('❌ Error generating questions for', subject.name, category.name, ':', err);
            return [];
          });
        generationPromises.push(generatePromise);
      }
    }
    console.log(`🔄 Generating questions in parallel for ${generationPromises.length} category combinations...`);
    const results = await Promise.all(generationPromises);
    allGeneratedQuestions = results.flat();
    if (allGeneratedQuestions.length === 0) {
      return new Response(JSON.stringify({
        error: 'Failed to generate any questions',
        details: 'OpenAI returned no valid questions'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`💾 Inserting ${allGeneratedQuestions.length} questions into database...`);
    const { data: insertedQuestions, error: insertError } = await supabase
      .from('questions')
      .insert(allGeneratedQuestions)
      .select();
    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      return new Response(JSON.stringify({
        error: 'Failed to save questions to database',
        details: insertError.message,
        code: insertError.code
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`✅ Successfully inserted ${insertedQuestions?.length || 0} questions`);
    return new Response(JSON.stringify({
      success: true,
      questions: insertedQuestions,
      count: insertedQuestions?.length || 0,
      personalized: hasRelevantHistory,
      weakAreas: hasRelevantHistory ? 'Částečná personalizace na základě chybných odpovědí' : null
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error in edge function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

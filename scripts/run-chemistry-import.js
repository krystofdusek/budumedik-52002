// Simple script to import chemistry questions
// Run this in browser console on the Lovable app page

const EDGE_FUNCTION_URL = 'https://jcabdfmvjblzulnvvuso.supabase.co/functions/v1/import-2lf-questions';

const files = [
  { path: '/data/2lf/Anorganická_chemie.md', category: 'Anorganická chemie' },
  { path: '/data/2lf/Biochemie.md', category: 'Biochemie' },
  { path: '/data/2lf/Chemické_výpočty.md', category: 'Chemické výpočty' },
  { path: '/data/2lf/Obecná_chemie.md', category: 'Obecná chemie' },
  { path: '/data/2lf/Organická_chemie.md', category: 'Organická chemie' }
];

async function importChemistryQuestions() {
  console.log('Starting chemistry questions import...');
  
  try {
    const fileContents = [];
    
    for (const file of files) {
      console.log(`Loading ${file.category}...`);
      const response = await fetch(file.path);
      if (!response.ok) {
        throw new Error(`Failed to load ${file.category}`);
      }
      const content = await response.text();
      fileContents.push({ content, categoryName: file.category });
      console.log(`✓ Loaded ${file.category} (${content.length} characters)`);
    }
    
    console.log('Calling edge function...');
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileContents })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Edge function error: ${error}`);
    }
    
    const data = await response.json();
    console.log('Import results:', data);
    
    const total = data.results?.reduce((sum, r) => sum + (r.questionsImported || 0), 0) || 0;
    console.log(`✅ Import completed! Total questions imported: ${total}`);
    
    return data;
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// Auto-run
importChemistryQuestions();
// Import physics questions for 2LF
// Run this in browser console on any page of the app

const EDGE_FUNCTION_URL = 'https://jcabdfmvjblzulnvvuso.supabase.co/functions/v1/import-2lf-questions';

const files = [
  { path: '/data/2lf/Atomová_fyzika.md', category: 'Atomová fyzika' },
  { path: '/data/2lf/Elektřina_a_magnetismus.md', category: 'Elektřina a magnetismus' },
  { path: '/data/2lf/Elektromagnetické_vlnění.md', category: 'Elektromagnetické vlnění' },
  { path: '/data/2lf/Kmitání_vlnění_a_akustika.md', category: 'Kmitání vlnění a akustika' },
  { path: '/data/2lf/Molekulová_fyzika.md', category: 'Molekulová fyzika' },
  { path: '/data/2lf/Optika.md', category: 'Optika' },
  { path: '/data/2lf/Termika.md', category: 'Termika' }
];

async function importPhysics() {
  console.log('Starting physics import...');
  
  const fileContents = [];
  
  for (const file of files) {
    console.log(`Loading ${file.category}...`);
    const response = await fetch(file.path);
    if (!response.ok) {
      console.error(`Failed to load ${file.category}`);
      continue;
    }
    const content = await response.text();
    fileContents.push({ content, categoryName: file.category });
    console.log(`✓ Loaded ${file.category} (${content.length} characters)`);
  }
  
  console.log('Importing to database...');
  
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({ fileContents })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Edge function error:', error);
    return;
  }
  
  const data = await response.json();
  
  console.log('✅ Import completed!');
  console.log('Results:', data.results);
}

importPhysics();

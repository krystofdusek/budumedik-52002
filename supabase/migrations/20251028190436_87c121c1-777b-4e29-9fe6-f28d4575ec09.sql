-- Přesun všech otázek z kategorie "Evoluce" do "Evoluce a fylogeneze"
UPDATE questions 
SET category_id = '638566a7-45a5-4875-b40b-d89e2a0be506'
WHERE category_id = '82a3044e-9475-4252-9539-975b5b57d10f';

-- Smazání staré kategorie "Evoluce"
DELETE FROM categories 
WHERE id = '82a3044e-9475-4252-9539-975b5b57d10f';
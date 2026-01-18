-- Script pour modifier la contrainte CHECK sur la colonne difficulty
-- pour accepter à la fois 'debutant' et 'débutant'

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE videos_new DROP CONSTRAINT IF EXISTS videos_new_difficulty_check;

-- 2. Créer une nouvelle contrainte qui accepte les deux variantes
ALTER TABLE videos_new 
ADD CONSTRAINT videos_new_difficulty_check 
CHECK (difficulty IN (
  'debutant', 
  'débutant',  -- Ajout de la variante avec accent
  'intermediaire', 
  'avance', 
  'beginner', 
  'intermediate', 
  'advanced'
));

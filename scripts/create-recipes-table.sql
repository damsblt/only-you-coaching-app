-- Création de la table recipes pour Only You Coaching
-- Compatible avec l'interface Recipe définie dans types/cms.ts

CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image TEXT, -- URL de l'image principale
  images JSONB DEFAULT '[]'::jsonb, -- Array d'URLs des images de la galerie
  category VARCHAR(50) NOT NULL CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack', 'vegetarian')),
  prep_time INTEGER NOT NULL, -- en minutes
  servings INTEGER NOT NULL DEFAULT 1,
  is_vegetarian BOOLEAN DEFAULT false,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags JSONB DEFAULT '[]'::jsonb, -- Array de tags
  ingredients JSONB DEFAULT '[]'::jsonb, -- Array d'ingrédients
  instructions TEXT, -- Instructions en HTML ou Markdown
  nutrition_info JSONB, -- Objet avec calories, protein, carbs, fat
  is_premium BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_is_published ON recipes(is_published);
CREATE INDEX IF NOT EXISTS idx_recipes_is_premium ON recipes(is_premium);
CREATE INDEX IF NOT EXISTS idx_recipes_published_at ON recipes(published_at);
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);

-- Index GIN pour la recherche dans les arrays JSONB
CREATE INDEX IF NOT EXISTS idx_recipes_tags_gin ON recipes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_recipes_ingredients_gin ON recipes USING GIN (ingredients);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recipes_updated_at 
  BEFORE UPDATE ON recipes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Politique d'accès
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Politique : Tous les utilisateurs authentifiés peuvent lire les recettes publiées
CREATE POLICY "Users can view published recipes" ON recipes
  FOR SELECT USING (is_published = true);

-- Politique : Les recettes premium nécessitent un abonnement actif
-- (Cette politique sera gérée côté application via ProtectedContent)

-- Commentaires sur la table
COMMENT ON TABLE recipes IS 'Table des recettes pour Only You Coaching';
COMMENT ON COLUMN recipes.images IS 'Array JSON des URLs des images de la galerie';
COMMENT ON COLUMN recipes.tags IS 'Array JSON des tags (ex: ["sans-gluten", "vegan", "protéines"])';
COMMENT ON COLUMN recipes.ingredients IS 'Array JSON des ingrédients';
COMMENT ON COLUMN recipes.nutrition_info IS 'Objet JSON avec calories, protein, carbs, fat';
COMMENT ON COLUMN recipes.instructions IS 'Instructions en HTML ou Markdown';
COMMENT ON COLUMN recipes.prep_time IS 'Temps de préparation en minutes';
COMMENT ON COLUMN recipes.servings IS 'Nombre de portions';

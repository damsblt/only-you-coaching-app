-- Table pour stocker les descriptions éditable des régions de programmes
CREATE TABLE IF NOT EXISTS program_region_descriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region_slug VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_program_region_descriptions_region_slug ON program_region_descriptions(region_slug);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_program_region_descriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_program_region_descriptions_updated_at
  BEFORE UPDATE ON program_region_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_program_region_descriptions_updated_at();

-- Insérer les régions par défaut avec leurs noms d'affichage
INSERT INTO program_region_descriptions (region_slug, display_name, description) VALUES
  ('abdos', 'Abdos', 'Renforcez vos abdominaux avec des exercices ciblés'),
  ('brule-graisse', 'Brûle Graisse', 'Programme intensif pour brûler les graisses'),
  ('haute-intensite', 'Haute Intensité', 'Entraînements cardio haute intensité'),
  ('machine', 'Machine', 'Exercices avec machines spécialisées'),
  ('pectoraux', 'Pectoraux', 'Développez votre poitrine et vos pectoraux'),
  ('rehabilitation-dos', 'Réhabilitation du Dos', 'Exercices thérapeutiques pour le dos'),
  ('special-femme', 'Spécial Femme', 'Programmes adaptés aux femmes'),
  ('cuisses-abdos-fessiers', 'Cuisses, Abdos, Fessiers', 'Tonifiez le bas du corps'),
  ('dos-abdos', 'Dos & Abdos', 'Renforcez le tronc complet'),
  ('femmes', 'Femmes', 'Programmes spécialement conçus pour les femmes'),
  ('homme', 'Homme', 'Programmes adaptés aux hommes'),
  ('jambes', 'Jambes', 'Renforcez et tonifiez vos jambes'),
  ('cuisses-abdos', 'Cuisses & Abdos', 'Ciblez cuisses et abdominaux')
ON CONFLICT (region_slug) DO NOTHING;



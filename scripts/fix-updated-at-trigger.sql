-- Script pour corriger le trigger updatedAt dans Neon
-- Ce script crée une fonction séparée pour les tables avec camelCase (updatedAt)
-- et met à jour le trigger pour videos_new

-- Créer la fonction pour camelCase
CREATE OR REPLACE FUNCTION update_updated_at_camelcase()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS update_videos_new_updated_at ON videos_new;

-- Créer le nouveau trigger avec la bonne fonction
CREATE TRIGGER update_videos_new_updated_at 
  BEFORE UPDATE ON videos_new 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_camelcase();

-- Vérifier que le trigger est bien créé
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'videos_new';













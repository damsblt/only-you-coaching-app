-- Script pour supprimer les chiffres au début des titres de vidéos
-- Cette requête met à jour les titres qui commencent par un chiffre suivi d'un espace

-- Avant de lancer la mise à jour, on peut vérifier combien de titres seront affectés
SELECT 
  id, 
  title AS "ancien_titre",
  regexp_replace(title, '^[0-9]+\s+', '', 'g') AS "nouveau_titre"
FROM videos_new
WHERE title ~ '^[0-9]+\s+'
ORDER BY title;

-- Mettre à jour les titres dans videos_new
UPDATE videos_new
SET title = regexp_replace(title, '^[0-9]+\s+', '', 'g'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE title ~ '^[0-9]+\s+';

-- Afficher un résumé des changements
SELECT COUNT(*) as "titres_modifies"
FROM videos_new
WHERE title ~ '^[0-9]+\s+';



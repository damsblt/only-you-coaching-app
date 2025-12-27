-- Ajouter la colonne password à la table users si elle n'existe pas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Index pour les recherches par email (déjà existant mais on le vérifie)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);






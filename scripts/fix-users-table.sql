-- Script pour corriger la structure de la table users
-- Ce script ajoute les colonnes manquantes et corrige les problèmes de schéma

-- Ajouter les colonnes manquantes à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50) DEFAULT 'essentiel',
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Renommer les colonnes si elles existent avec des noms différents
DO $$ 
BEGIN
    -- Renommer 'name' vers 'full_name' si 'name' existe et 'full_name' n'existe pas
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE users RENAME COLUMN name TO full_name;
    END IF;
    
    -- Renommer 'planId' vers 'plan_id' si 'planId' existe et 'plan_id' n'existe pas
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'planId') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'plan_id') THEN
        ALTER TABLE users RENAME COLUMN "planId" TO plan_id;
    END IF;
    
    -- Renommer 'createdAt' vers 'created_at' si 'createdAt' existe et 'created_at' n'existe pas
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'createdAt') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users RENAME COLUMN "createdAt" TO created_at;
    END IF;
    
    -- Renommer 'updatedAt' vers 'updated_at' si 'updatedAt' existe et 'updated_at' n'existe pas
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updatedAt') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
END $$;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON users(subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);

-- Afficher la structure finale de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

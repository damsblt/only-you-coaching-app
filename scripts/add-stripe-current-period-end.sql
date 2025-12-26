-- Ajouter la colonne stripeCurrentPeriodEnd si elle n'existe pas
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS "stripeCurrentPeriodEnd" TIMESTAMP WITH TIME ZONE;

-- Mettre à jour les valeurs existantes de currentPeriodEnd vers stripeCurrentPeriodEnd si stripeCurrentPeriodEnd est null
UPDATE subscriptions 
SET "stripeCurrentPeriodEnd" = "currentPeriodEnd" 
WHERE "stripeCurrentPeriodEnd" IS NULL AND "currentPeriodEnd" IS NOT NULL;





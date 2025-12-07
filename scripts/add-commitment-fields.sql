-- Ajouter les colonnes nécessaires pour gérer les engagements
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS cancelAtPeriodEnd BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS commitmentEndDate TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS commitmentMonths INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS willCancelAfterCommitment BOOLEAN DEFAULT FALSE;

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_subscriptions_commitment_end 
ON subscriptions(commitmentEndDate) 
WHERE commitmentEndDate IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_cancel_period 
ON subscriptions(cancelAtPeriodEnd) 
WHERE cancelAtPeriodEnd = TRUE;

CREATE INDEX IF NOT EXISTS idx_subscriptions_will_cancel 
ON subscriptions(willCancelAfterCommitment) 
WHERE willCancelAfterCommitment = TRUE;

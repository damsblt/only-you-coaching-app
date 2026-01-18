-- =====================================================
-- 🎫 TABLE PROMO CODES
-- =====================================================
-- Cette table stocke les codes promotionnels pour les abonnements
-- =====================================================

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Code promo (ex: "NOEL2026", "WELCOME10")
  code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Type de réduction
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  
  -- Valeur de la réduction
  -- Si percentage: 10, 20, 50 (représente %)
  -- Si fixed_amount: 1000, 2000 (en centimes pour CHF)
  discount_value INTEGER NOT NULL,
  
  -- ID du coupon Stripe associé (synchronisation)
  stripe_coupon_id VARCHAR(255),
  
  -- Limites d'utilisation
  max_uses INTEGER, -- Nombre max d'utilisations (NULL = illimité)
  current_uses INTEGER DEFAULT 0, -- Compteur d'utilisations
  max_uses_per_user INTEGER DEFAULT 1, -- Limite par utilisateur
  
  -- Plans éligibles (NULL = tous les plans)
  eligible_plans TEXT[], -- ['essentiel', 'premium', 'starter']
  
  -- Dates de validité
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  
  -- État
  is_active BOOLEAN DEFAULT true,
  
  -- Métadonnées
  description TEXT, -- Description interne pour l'admin
  created_by UUID REFERENCES users(id), -- Admin qui a créé le code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_until ON promo_codes(valid_until);
CREATE INDEX IF NOT EXISTS idx_promo_codes_stripe_coupon ON promo_codes(stripe_coupon_id);

-- =====================================================
-- 🎫 TABLE PROMO CODE USAGE (historique d'utilisation)
-- =====================================================

CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id VARCHAR(255), -- Stripe subscription ID
  
  -- Réduction appliquée
  discount_amount INTEGER NOT NULL, -- Montant en centimes
  original_amount INTEGER NOT NULL, -- Montant original
  final_amount INTEGER NOT NULL, -- Montant final après réduction
  
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique pour éviter qu'un utilisateur utilise plusieurs fois le même code
  UNIQUE(promo_code_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_usage_promo_code ON promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_user ON promo_code_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_subscription ON promo_code_usage(subscription_id);

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE promo_codes IS 'Codes promotionnels avec limites et validité';
COMMENT ON TABLE promo_code_usage IS 'Historique d''utilisation des codes promo';
COMMENT ON COLUMN promo_codes.discount_type IS 'Type: percentage (%) ou fixed_amount (CHF)';
COMMENT ON COLUMN promo_codes.discount_value IS 'Valeur: 10-100 pour %, centimes pour montant fixe';
COMMENT ON COLUMN promo_codes.stripe_coupon_id IS 'ID du coupon synchronisé avec Stripe';

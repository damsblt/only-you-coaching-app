-- =====================================================
-- 🗄️ COMPLETE DATABASE SCHEMA FOR NEON POSTGRESQL
-- =====================================================
-- This script creates all necessary tables for the Pilates Coaching App
-- Run this in Neon SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'COACH')),
  subscription_status VARCHAR(50) CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
  subscription_plan VARCHAR(50) CHECK (subscription_plan IN ('free', 'monthly', 'yearly', 'essentiel', 'premium')),
  planid VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- 2. VIDEOS_NEW TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS videos_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "videoUrl" TEXT,
  thumbnail TEXT,
  duration INTEGER,
  difficulty VARCHAR(50) CHECK (difficulty IN ('debutant', 'intermediaire', 'avance', 'beginner', 'intermediate', 'advanced')),
  category VARCHAR(100),
  region VARCHAR(100),
  "muscleGroups" TEXT[],
  "startingPosition" TEXT,
  movement TEXT,
  intensity VARCHAR(50),
  theme TEXT,
  series TEXT,
  constraints TEXT,
  targeted_muscles TEXT[],
  exo_title TEXT,
  "videoType" VARCHAR(50) CHECK ("videoType" IN ('MUSCLE_GROUPS', 'PROGRAMMES')),
  "isPublished" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_new_is_published ON videos_new("isPublished");
CREATE INDEX IF NOT EXISTS idx_videos_new_video_type ON videos_new("videoType");
CREATE INDEX IF NOT EXISTS idx_videos_new_region ON videos_new(region);
CREATE INDEX IF NOT EXISTS idx_videos_new_difficulty ON videos_new(difficulty);
CREATE INDEX IF NOT EXISTS idx_videos_new_title ON videos_new(title);

-- =====================================================
-- 3. SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "stripeSubscriptionId" VARCHAR(255) UNIQUE,
  "stripeCustomerId" VARCHAR(255),
  "planId" VARCHAR(100),
  status VARCHAR(50) CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  "currentPeriodStart" TIMESTAMP WITH TIME ZONE,
  "currentPeriodEnd" TIMESTAMP WITH TIME ZONE,
  "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions("stripeSubscriptionId");

-- =====================================================
-- 4. RECIPES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  category VARCHAR(50) NOT NULL CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack', 'vegetarian')),
  prep_time INTEGER NOT NULL,
  servings INTEGER NOT NULL DEFAULT 1,
  is_vegetarian BOOLEAN DEFAULT false,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags JSONB DEFAULT '[]'::jsonb,
  ingredients JSONB DEFAULT '[]'::jsonb,
  instructions TEXT,
  nutrition_info JSONB,
  pdf_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_is_published ON recipes(is_published);
CREATE INDEX IF NOT EXISTS idx_recipes_is_premium ON recipes(is_premium);
CREATE INDEX IF NOT EXISTS idx_recipes_published_at ON recipes(published_at);
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);
CREATE INDEX IF NOT EXISTS idx_recipes_tags_gin ON recipes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_recipes_ingredients_gin ON recipes USING GIN (ingredients);

-- =====================================================
-- 5. AUDIOS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS audios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) CHECK (category IN ('meditation', 'coaching_mental', 'meditation_guidee')),
  "audioUrl" TEXT,
  s3key VARCHAR(500),
  thumbnail TEXT,
  duration INTEGER,
  "isPublished" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audios_category ON audios(category);
CREATE INDEX IF NOT EXISTS idx_audios_is_published ON audios("isPublished");

-- =====================================================
-- 6. PROGRAMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "durationWeeks" INTEGER,
  level VARCHAR(50),
  "isPremium" BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_level ON programs(level);
CREATE INDEX IF NOT EXISTS idx_programs_is_premium ON programs("isPremium");

-- =====================================================
-- 7. PROGRAM_REGIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS program_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "programId" UUID REFERENCES programs(id) ON DELETE CASCADE,
  region VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_regions_program_id ON program_regions("programId");

-- =====================================================
-- 8. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
-- Function to update updated_at timestamp (for tables with snake_case)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update updatedAt timestamp (for tables with camelCase)
CREATE OR REPLACE FUNCTION update_updated_at_camelcase()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to subscriptions table
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to recipes table
CREATE TRIGGER update_recipes_updated_at 
  BEFORE UPDATE ON recipes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to videos_new table (uses camelCase "updatedAt")
CREATE TRIGGER update_videos_new_updated_at 
  BEFORE UPDATE ON videos_new 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_camelcase();

-- Apply trigger to audios table (uses camelCase "updatedAt")
CREATE TRIGGER update_audios_updated_at 
  BEFORE UPDATE ON audios 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_camelcase();

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Check created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


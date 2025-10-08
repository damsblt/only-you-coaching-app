# 📋 Brief Technique - Only You Coaching V2

> **Projet** : Plateforme de coaching Pilates en ligne  
> **Client** : Marie-Line - Only You Coaching  
> **Version** : 2.0  
> **Date** : Octobre 2025

---

## 🎯 Vision du Projet

Créer une **plateforme premium de coaching Pilates** offrant :
- Streaming vidéo haute qualité avec interface TikTok-style
- Programmes d'entraînement personnalisés
- Méditations guidées et coaching mental
- Système d'abonnements et de paiements
- Dashboard administrateur complet

---

## 🏗️ Stack Technique

### **Core Framework**
```json
{
  "framework": "Next.js 14+",
  "language": "TypeScript",
  "runtime": "Node.js 18+",
  "package_manager": "npm"
}
```

### **Frontend**
- **UI Library** : React 18+
- **Styling** : Tailwind CSS 3+ avec design system personnalisé
- **Icons** : Lucide React
- **Fonts** : Inter (Google Fonts)
- **Theme** : next-themes (dark mode support)
- **Forms** : React Hook Form + Zod validation
- **State Management** : React Context + Hooks

### **Backend & Database**
- **Database** : Supabase (PostgreSQL)
- **ORM** : Prisma (optionnel, actuellement direct Supabase client)
- **Authentication** : NextAuth.js v4
- **API** : Next.js API Routes
- **CMS** : Strapi (Headless CMS pour gestion contenu par Marie-Line)

### **Storage & Media**
- **Video Storage** : AWS S3 (eu-north-1)
- **Video Processing** : AWS Lambda + FFmpeg
- **CDN** : CloudFront (recommandé)

### **Payments**
- **Provider** : Stripe
- **Features** : Subscriptions, one-time payments, webhooks

### **Deployment**
- **Hosting** : Vercel
- **Domain** : À configurer
- **CI/CD** : GitHub Actions + Vercel auto-deploy

---

## 🗄️ Configuration Environnement

### **Variables d'Environnement (.env.local)**

```bash
# ==========================================
# DATABASE - Supabase PostgreSQL
# ==========================================
DATABASE_URL="postgresql://postgres:tIwji3-gergiv-mihsew@db.otqyrsmxdtcvhueriwzp.supabase.co:5432/postgres"

# ==========================================
# SUPABASE
# ==========================================
NEXT_PUBLIC_SUPABASE_URL="https://otqyrsmxdtcvhueriwzp.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90cXlyc214ZHRjdmh1ZXJpd3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjM0NzAsImV4cCI6MjA3MzU5OTQ3MH0.d5jzLsK3V_rHWGN7xNK1g8dTKm7DXuGEbFOrURGM0s4"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90cXlyc214ZHRjdmh1ZXJpd3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjM0NzAsImV4cCI6MjA3MzU5OTQ3MH0.d5jzLsK3V_rHWGN7xNK1g8dTKm7DXuGEbFOrURGM0s4"

# ==========================================
# NEXTAUTH.JS - Authentication
# ==========================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
# 🔑 Générer avec: openssl rand -base64 32

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
# 📝 Obtenir sur: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ==========================================
# AWS S3 - Video Storage
# ==========================================
AWS_REGION="eu-north-1"
AWS_ACCESS_KEY_ID="your_aws_access_key_here"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key_here"
AWS_S3_BUCKET_NAME="only-you-coaching"

# ==========================================
# STRIPE - Payments (⚠️ À CONFIGURER)
# ==========================================
STRIPE_PUBLISHABLE_KEY="pk_test_..."
# 📝 Obtenir sur: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
# 📝 Généré lors de la création du webhook endpoint

# Production Keys (⚠️ NE PAS COMMITTER)
# STRIPE_PUBLISHABLE_KEY="pk_live_..."
# STRIPE_SECRET_KEY="sk_live_..."

# ==========================================
# STRAPI CMS (⚠️ À CONFIGURER APRÈS INSTALLATION)
# ==========================================
NEXT_PUBLIC_STRAPI_URL="http://localhost:1337"
# Production: "https://cms.only-you-coaching.com"
STRAPI_API_TOKEN="[GENERATE_IN_STRAPI_ADMIN]"
# 📝 Générer dans: Strapi Admin > Settings > API Tokens

# ==========================================
# OPTIONAL - Analytics & Monitoring
# ==========================================
NEXT_PUBLIC_GA_ID=""
SENTRY_DSN=""
```

### **Production Environment Variables**
```bash
# ⚠️ À configurer dans Vercel Dashboard
NEXTAUTH_URL="https://only-you-coaching.com"
# OU le domaine de production réel
NEXTAUTH_SECRET="[GENERATE_NEW_SECRET_WITH: openssl rand -base64 32]"
NODE_ENV="production"

# Stripe Production Keys (⚠️ IMPORTANT)
STRIPE_PUBLISHABLE_KEY="pk_live_[YOUR_LIVE_KEY]"
STRIPE_SECRET_KEY="sk_live_[YOUR_LIVE_KEY]"
STRIPE_WEBHOOK_SECRET="whsec_[GENERATED_BY_STRIPE]"

# Strapi Production
NEXT_PUBLIC_STRAPI_URL="https://cms.only-you-coaching.com"
# OU l'URL de votre instance Strapi en production
STRAPI_API_TOKEN="[PRODUCTION_TOKEN]"
```

---

## 🎨 Design System

### **Palette de Couleurs**

```javascript
// tailwind.config.js - Colors
colors: {
  primary: {
    50: '#F5E6E0',   // Beige/Crème - Fond principal
    500: '#F5E6E0',  // Main color
  },
  secondary: {
    500: '#C8A0A0',  // Rose poudré principal
  },
  accent: {
    500: '#D4888C',  // Rose corail - Boutons, liens
  },
  burgundy: {
    500: '#A65959',  // Bordeaux - Header/Footer
    600: '#9D4F4F',
  },
  // Dark mode colors
  gray: {
    50-900: '...',   // Palette complète pour dark mode
  }
}
```

### **Typography**
```javascript
fontFamily: {
  sans: ['Inter', 'sans-serif'],
}
```

### **Design Tokens**

#### **Bordures & Courbes**
- `rounded-lg` : 0.5rem (boutons standards)
- `rounded-xl` : 0.75rem (cartes)
- `rounded-2xl` : 1rem (cartes premium)
- `curved-card` : Bordures asymétriques (2rem 1rem 2rem 1rem)
- `curved-button` : Boutons organiques (2rem 0.5rem 2rem 0.5rem)

#### **Ombres**
- `shadow-sm` : Subtile
- `shadow-md` : Cartes normales
- `shadow-lg` : Cartes flottantes
- `shadow-curved` : Custom organiques
- `shadow-floating` : Éléments au survol

#### **Animations**
- `transition-colors` : 200ms
- `transition-all` : 300ms
- `animate-float` : 6s ease-in-out infinite
- `animate-pulse-slow` : 4s cubic-bezier

### **Composants UI**

#### **Header**
```tsx
Structure:
├── Barre supérieure bordeaux (email + téléphone)
├── Navigation principale (desktop)
├── Logo centré
├── Actions (ThemeToggle + User)
├── Menu mobile (hamburger)
└── Courbe SVG bottom (clip-path ellipse)
```

#### **Footer**
```tsx
Structure:
├── Courbe SVG top (clip-path ellipse inversé)
├── 3 Colonnes:
│   ├── Marque (logo + description + social)
│   ├── Liens rapides (navigation)
│   └── Contact (email + téléphone + adresse)
└── Copyright + Legal links
```

#### **Courbes Élégantes**
```css
/* Header curve */
clip-path: ellipse(75% 100% at 50% 0%);
transform: translateY(50%);

/* Footer curve */
clip-path: ellipse(75% 100% at 50% 100%);
transform: translateY(-50%);
```

### **Dark Mode**
- Système : `class` based (next-themes)
- Toggle : Icônes Sun/Moon dans header
- Couleurs : 
  - Light : `bg-white`, textes `text-black`
  - Dark : `bg-gray-900`, textes `text-gray-100`
  - Transitions : `transition-colors`

---

## 📐 Architecture de l'Application

### **Structure des Dossiers**

```
pilates-coaching-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (routes)/
│   │   │   ├── page.tsx             # Homepage
│   │   │   ├── videos/              # Catalogue vidéos
│   │   │   ├── videos-mobile/       # Interface TikTok-style
│   │   │   ├── programmes/          # Programmes prédéfinis
│   │   │   ├── meditation/          # Audios & méditations
│   │   │   ├── subscriptions/       # Plans d'abonnement
│   │   │   ├── booking/             # Contact & réservation
│   │   │   └── profile/             # Profil utilisateur
│   │   ├── admin/                   # Dashboard admin
│   │   │   ├── page.tsx            # Overview
│   │   │   ├── videos/             # Gestion vidéos
│   │   │   ├── users/              # Gestion users
│   │   │   └── analytics/          # Statistiques
│   │   ├── auth/                    # Authentication
│   │   │   ├── signin/
│   │   │   └── signup/
│   │   ├── api/                     # API Routes
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── videos/
│   │   │   ├── users/
│   │   │   ├── subscriptions/
│   │   │   └── webhooks/stripe/
│   │   ├── layout.tsx               # Root layout
│   │   └── globals.css              # Global styles
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── ...
│   │   ├── video/
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── VideoCard.tsx
│   │   │   ├── VideoGrid.tsx
│   │   │   ├── UnifiedVideoPlayer.tsx
│   │   │   └── VideoControls.tsx
│   │   ├── audio/
│   │   │   ├── AudioPlayer.tsx
│   │   │   └── AudioList.tsx
│   │   ├── admin/
│   │   │   ├── VideoUpload.tsx
│   │   │   ├── UserTable.tsx
│   │   │   └── Analytics.tsx
│   │   └── providers/
│   │       └── ThemeProvider.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client
│   │   ├── prisma.ts               # Prisma client (optional)
│   │   ├── auth.ts                 # Auth utilities
│   │   ├── s3.ts                   # AWS S3 utilities
│   │   ├── stripe.ts               # Stripe integration
│   │   └── utils.ts                # Helpers
│   │
│   ├── hooks/
│   │   ├── useVideoPlayer.ts
│   │   ├── useVideos.ts
│   │   ├── useAuth.ts
│   │   └── useSubscription.ts
│   │
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   │
│   └── styles/
│       └── video-player.css
│
├── prisma/
│   └── schema.prisma               # Database schema
│
├── lambda/                          # AWS Lambda functions
│   ├── thumbnail-generator/
│   └── video-processor/
│
├── scripts/                         # Utility scripts
│   ├── migrate-data.js
│   ├── seed-database.js
│   └── deploy-lambda.sh
│
├── public/
│   ├── logo.png
│   ├── logo-oyc.png
│   └── ...
│
├── .env.local                      # Environment variables
├── .env.example                    # Template
├── next.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🗃️ Schéma de Base de Données

### **Tables Principales**

#### **Users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user', -- 'user' | 'admin' | 'coach'
  subscription_status VARCHAR(50), -- 'active' | 'canceled' | 'past_due'
  subscription_plan VARCHAR(50),   -- 'free' | 'monthly' | 'yearly'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Videos**
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER, -- en secondes
  s3_key VARCHAR(500) NOT NULL,
  s3_url TEXT NOT NULL,
  thumbnail_url TEXT,
  muscle_group VARCHAR(100), -- 'abdos' | 'biceps' | 'triceps' | ...
  level VARCHAR(50), -- 'debutant' | 'intermediaire' | 'avance'
  is_premium BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Programs**
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  level VARCHAR(50),
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE program_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  day_number INTEGER
);
```

#### **Audios**
```sql
CREATE TABLE audios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'meditation' | 'coaching_mental'
  duration INTEGER,
  s3_key VARCHAR(500) NOT NULL,
  s3_url TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **Subscriptions (Stripe)**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  plan_id VARCHAR(100),
  status VARCHAR(50),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **User Progress**
```sql
CREATE TABLE user_video_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  progress_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);
```

### **Indexes Recommandés**
```sql
CREATE INDEX idx_videos_muscle_group ON videos(muscle_group);
CREATE INDEX idx_videos_level ON videos(level);
CREATE INDEX idx_videos_is_premium ON videos(is_premium);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_user_progress_user_id ON user_video_progress(user_id);
```

---

## 🚀 Fonctionnalités par Module

### **1. Authentification**

#### **Features**
- ✅ Email/Password signup & signin
- ✅ OAuth (Google) - optionnel
- ✅ Session management (NextAuth)
- ✅ Password reset
- ✅ Email verification
- ✅ Role-based access (user/admin/coach)

#### **Routes API**
```
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/signout
POST /api/auth/reset-password
GET  /api/auth/[...nextauth]
```

#### **Pages**
```
/auth/signin
/auth/signup
/auth/reset-password
/auth/verify-email
```

---

### **2. Streaming Vidéo**

#### **Features**
- ✅ Lecteur vidéo HTML5 personnalisé
- ✅ Contrôles : play/pause, volume, fullscreen, quality
- ✅ Streaming adaptatif depuis S3
- ✅ Miniatures auto-générées (Lambda + FFmpeg)
- ✅ Interface TikTok-style mobile (scroll vertical)
- ✅ Catégories par groupes musculaires
- ✅ Filtres : niveau, durée, premium
- ✅ Favoris & progression
- ✅ Recherche & tags

#### **Groupes Musculaires**
```javascript
const muscleGroups = [
  'abdos',
  'biceps',
  'triceps',
  'cardio',
  'dos',
  'epaules',
  'fessiers-jambes',
  'stretching'
]
```

#### **Niveaux**
```javascript
const levels = [
  'debutant',
  'intermediaire',
  'avance'
]
```

#### **Routes API**
```
GET    /api/videos              # Liste paginée
GET    /api/videos/:id          # Détails
GET    /api/videos/:id/stream   # Streaming URL
POST   /api/videos              # Upload (admin)
PUT    /api/videos/:id          # Update (admin)
DELETE /api/videos/:id          # Delete (admin)
POST   /api/videos/:id/favorite # Toggle favori
POST   /api/videos/:id/progress # Update progression
```

#### **Pages**
```
/videos                 # Grille de vidéos
/videos/:id            # Détail vidéo
/videos-mobile         # Interface TikTok
/videos/category/:slug # Filtré par catégorie
```

---

### **3. Programmes Prédéfinis**

#### **Features**
- ✅ Programmes par objectifs (force, cardio, flexibilité)
- ✅ Durée : 2-12 semaines
- ✅ Planning jour par jour
- ✅ Progression tracking
- ✅ Certificat de completion

#### **Routes API**
```
GET  /api/programs           # Liste
GET  /api/programs/:id       # Détails
POST /api/programs/:id/enroll # S'inscrire
GET  /api/programs/:id/progress # Ma progression
```

#### **Pages**
```
/programmes
/programmes/:id
/programmes/:id/week/:week
```

---

### **4. Méditations & Audios**

#### **Features**
- ✅ Player audio personnalisé
- ✅ Catégories : méditation guidée, coaching mental
- ✅ Téléchargement offline (premium)
- ✅ Playlist personnalisées
- ✅ Timer & repeat

#### **Catégories**
```javascript
const audioCategories = {
  meditation_guidee: [
    'Anxiété',
    'Gratitude',
    'Valeurs',
    'Détente corporelle',
    'Lâcher prise',
    'Estime de soi',
    'Affirmation de soi',
    'Les couleurs',
    'Confiance',
    'Paysages'
  ],
  coaching_mental: [
    'Méditation sport CD1-4'
  ]
}
```

#### **Routes API**
```
GET  /api/audios
GET  /api/audios/:id
POST /api/audios/:id/play
```

#### **Pages**
```
/meditation
/meditation/:id
/meditation/category/:slug
```

---

### **5. Abonnements & Paiements**

#### **Plans d'Abonnement**

Only You Coaching propose **2 catégories** de plans avec **6 options** au total :

---

#### **🎯 Plans avec Accompagnement** (Coaching personnalisé)

##### **1. Essentiel - CHF 69/mois**
```javascript
{
  id: 'essentiel',
  category: 'accompagnement',
  name: 'Essentiel',
  price: 69,
  currency: 'CHF',
  interval: 'month',
  stripe_price_id: 'price_[GENERATE_IN_STRIPE]_essentiel_chf',
  // 📝 À créer dans Stripe Dashboard: Products > Add Product > Prix récurrent 69 CHF/mois
  features: [
    '✅ Accès à la bibliothèque de vidéos d\'exercices',
    '✅ Accès à "mes recettes"',
    '✅ Accès aux programmes prédéfinis',
    '✅ 3 Programmes d\'entraînement personnalisés',
    '✅ 1 appel de coaching par mois (30 min)',
    '✅ Vidéo des exercices et explicatif envoyé par mail',
    '✅ Assistance Messagerie SMS/Mail 5 jours/semaine'
  ],
  access: {
    videos: true,
    recipes: true,
    programs: true,
    audios: false,
    custom_programs: 3,
    coaching_calls: 1,
    email_support: true,
    nutrition: false,
    home_visit: false
  }
}
```

##### **2. Avancé - CHF 109/mois**
```javascript
{
  id: 'avance',
  category: 'accompagnement',
  name: 'Avancé',
  price: 109,
  currency: 'CHF',
  interval: 'month',
  stripe_price_id: 'price_[GENERATE_IN_STRIPE]_avance_chf',
  // 📝 À créer dans Stripe Dashboard: Prix récurrent 109 CHF/mois
  features: [
    '✅ Tous les avantages "ESSENTIEL"',
    '✅ Accès à la bibliothèque d\'audios guidés',
    '✅ Surveillance et conseil nutritionnel continue',
    '✅ Suivi des progrès personnalisé'
  ],
  access: {
    videos: true,
    recipes: true,
    programs: true,
    audios: true,
    custom_programs: 3,
    coaching_calls: 1,
    email_support: true,
    nutrition: true,
    progress_tracking: true,
    home_visit: false
  }
}
```

##### **3. Premium - CHF 149/mois**
```javascript
{
  id: 'premium',
  category: 'accompagnement',
  name: 'Premium',
  price: 149,
  currency: 'CHF',
  interval: 'month',
  stripe_price_id: 'price_[GENERATE_IN_STRIPE]_premium_chf',
  // 📝 À créer dans Stripe Dashboard: Prix récurrent 149 CHF/mois
  features: [
    '✅ Tous les avantages "AVANCÉ"',
    '✅ 1 Visite à domicile de présentation du programme'
  ],
  access: {
    videos: true,
    recipes: true,
    programs: true,
    audios: true,
    custom_programs: 3,
    coaching_calls: 1,
    email_support: true,
    nutrition: true,
    progress_tracking: true,
    home_visit: 1
  }
}
```

---

#### **🚀 Plans en Autonomie** (Sans accompagnement)

##### **4. Starter - CHF 35/mois (2 mois)**
```javascript
{
  id: 'starter',
  category: 'autonomie',
  name: 'Starter',
  price: 35,
  currency: 'CHF',
  interval: 'month',
  duration_months: 2,
  total_price: 70,
  stripe_price_id: 'price_[GENERATE_IN_STRIPE]_starter_chf',
  // 📝 À créer dans Stripe Dashboard: Prix récurrent 35 CHF/mois (durée fixe: 2 mois)
  features: [
    '✅ Accès à la bibliothèque de vidéos d\'exercices',
    '✅ Accès à la bibliothèque d\'audios guidés',
    '✅ Accès à "mes recettes"'
  ],
  access: {
    videos: true,
    recipes: true,
    programs: false,
    audios: true,
    custom_programs: 0,
    coaching_calls: 0,
    email_support: false
  }
}
```

##### **5. Pro - CHF 30/mois (4 mois)**
```javascript
{
  id: 'pro',
  category: 'autonomie',
  name: 'Pro',
  price: 30,
  currency: 'CHF',
  interval: 'month',
  duration_months: 4,
  total_price: 120,
  stripe_price_id: 'price_[GENERATE_IN_STRIPE]_pro_chf',
  // 📝 À créer dans Stripe Dashboard: Prix récurrent 30 CHF/mois (durée fixe: 4 mois)
  features: [
    '✅ Accès à la bibliothèque de vidéos d\'exercices',
    '✅ Accès aux programmes prédéfinis',
    '✅ Accès à la bibliothèque d\'audios guidés',
    '✅ Accès à "mes recettes"'
  ],
  access: {
    videos: true,
    recipes: true,
    programs: true,
    audios: true,
    custom_programs: 0,
    coaching_calls: 0,
    email_support: false
  }
}
```

##### **6. Expert - CHF 25/mois (6 mois)**
```javascript
{
  id: 'expert',
  category: 'autonomie',
  name: 'Expert',
  price: 25,
  currency: 'CHF',
  interval: 'month',
  duration_months: 6,
  total_price: 150,
  stripe_price_id: 'price_[GENERATE_IN_STRIPE]_expert_chf',
  // 📝 À créer dans Stripe Dashboard: Prix récurrent 25 CHF/mois (durée fixe: 6 mois)
  features: [
    '✅ Accès à la bibliothèque de vidéos d\'exercices',
    '✅ Accès aux programmes prédéfinis',
    '✅ Accès à la bibliothèque d\'audios guidés',
    '✅ Accès à "mes recettes"'
  ],
  access: {
    videos: true,
    recipes: true,
    programs: true,
    audios: true,
    custom_programs: 0,
    coaching_calls: 0,
    email_support: false
  }
}
```

---

#### **📊 Matrice d'Accès aux Contenus**

| Fonctionnalité | Essentiel | Avancé | Premium | Starter | Pro | Expert |
|----------------|-----------|--------|---------|---------|-----|--------|
| **Vidéos d'exercices** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Recettes** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Programmes prédéfinis** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Audios guidés** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Programmes personnalisés** | 3 | 3 | 3 | 0 | 0 | 0 |
| **Appels coaching (30min)** | 1/mois | 1/mois | 1/mois | ❌ | ❌ | ❌ |
| **Support SMS/Mail** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Conseil nutritionnel** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Suivi des progrès** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Visite à domicile** | ❌ | ❌ | 1 | ❌ | ❌ | ❌ |
| **Prix** | 69 CHF/mois | 109 CHF/mois | 149 CHF/mois | 35 CHF/mois | 30 CHF/mois | 25 CHF/mois |
| **Durée** | Récurrent | Récurrent | Récurrent | 2 mois | 4 mois | 6 mois |

#### **Routes API**
```
POST /api/stripe/create-checkout-session
POST /api/stripe/create-portal-session
POST /api/stripe/webhooks # Stripe webhooks
GET  /api/subscriptions/me
```

#### **Pages**
```
/subscriptions          # Plans & pricing
/subscriptions/checkout # Stripe checkout
/subscriptions/success  # Confirmation
/subscriptions/manage   # Stripe portal
```

---

### **6. Dashboard Admin**

#### **Features**
- ✅ Upload vidéos S3
- ✅ Gestion métadonnées
- ✅ Génération miniatures
- ✅ Gestion utilisateurs
- ✅ Analytics (vues, revenus, engagement)
- ✅ Modération contenu

#### **Pages**
```
/admin
/admin/videos
/admin/videos/upload
/admin/videos/:id/edit
/admin/programs
/admin/programs/create
/admin/users
/admin/analytics
/admin/settings
```

#### **Permissions**
```javascript
// Middleware protection
if (session?.user?.role !== 'admin') {
  redirect('/');
}
```

---

### **7. Profil Utilisateur**

#### **Features**
- ✅ Informations personnelles
- ✅ Historique de visionnage
- ✅ Programmes en cours
- ✅ Favoris
- ✅ Progression & statistiques
- ✅ Paramètres de compte
- ✅ Gérer abonnement

#### **Pages**
```
/profile
/profile/history
/profile/favorites
/profile/programs
/profile/settings
```

---

### **8. CMS - Strapi (Gestion de Contenu)**

#### **Pourquoi Strapi ?**

Strapi est le **CMS headless parfait** pour permettre à Marie-Line de gérer facilement le contenu sans toucher au code :

✅ **Interface visuelle intuitive** - Aucune compétence technique requise  
✅ **Headless Architecture** - API automatique pour Next.js  
✅ **Gestion de contenu riche** - Vidéos, textes, images, programmes, recettes  
✅ **Roles & Permissions** - Contrôle d'accès granulaire (admin, coach, editor)  
✅ **Media Library** - Upload et gestion de fichiers avec S3 integration  
✅ **Relations complexes** - Vidéos ↔ Programmes ↔ Catégories  
✅ **API REST & GraphQL** - Générées automatiquement  
✅ **Open source** - Pas de vendor lock-in, hébergement flexible  
✅ **Plugins extensibles** - Email, SEO, i18n, etc.  

#### **Architecture Strapi + Next.js**

```
┌─────────────────┐
│   Next.js App   │  ← Frontend (ce que voient les utilisateurs)
│  (Vercel)       │
└────────┬────────┘
         │ API calls
         ↓
┌─────────────────┐
│  Strapi CMS     │  ← Backend (gestion contenu par Marie-Line)
│  (VPS/Cloud)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  PostgreSQL     │  ← Database (Supabase ou Strapi DB)
│  + AWS S3       │     + Stockage médias
└─────────────────┘
```

#### **Content Types dans Strapi**

##### **1. Videos**
```javascript
// Collection Type: Video
{
  title: String (required),
  slug: UID (auto-generated),
  description: RichText,
  duration: Number,
  thumbnail: Media,
  video_file: Media,
  s3_url: String,
  muscle_group: Enumeration [
    'abdos', 'biceps', 'triceps', 'cardio', 
    'dos', 'epaules', 'fessiers-jambes', 'stretching'
  ],
  level: Enumeration ['debutant', 'intermediaire', 'avance'],
  is_premium: Boolean,
  tags: Relation (many-to-many) → Tag,
  programs: Relation (many-to-many) → Program,
  published_at: DateTime
}
```

##### **2. Programs**
```javascript
// Collection Type: Program
{
  title: String (required),
  slug: UID,
  description: RichText,
  cover_image: Media,
  duration_weeks: Number,
  level: Enumeration,
  videos: Relation (many-to-many) → Video,
  is_premium: Boolean,
  price: Number,
  published_at: DateTime
}
```

##### **3. Audios**
```javascript
// Collection Type: Audio
{
  title: String (required),
  slug: UID,
  description: RichText,
  category: Enumeration ['meditation_guidee', 'coaching_mental'],
  audio_file: Media,
  s3_url: String,
  duration: Number,
  thumbnail: Media,
  is_premium: Boolean,
  published_at: DateTime
}
```

##### **4. Recipes**
```javascript
// Collection Type: Recipe
{
  title: String (required),
  slug: UID,
  description: RichText,
  ingredients: Component (repeatable),
  instructions: RichText,
  image: Media,
  category: Enumeration ['breakfast', 'lunch', 'dinner', 'snack'],
  prep_time: Number,
  servings: Number,
  is_vegetarian: Boolean,
  published_at: DateTime
}
```

##### **5. Custom Programs (Programmes personnalisés)**
```javascript
// Collection Type: CustomProgram
{
  user: Relation (one-to-one) → User,
  title: String,
  description: RichText,
  weeks: Component (repeatable) {
    week_number: Number,
    days: Component (repeatable) {
      day_number: Number,
      exercises: Relation (many-to-many) → Video,
      notes: Text
    }
  },
  coach_notes: RichText,
  created_at: DateTime
}
```

##### **6. Blog Posts (Optionnel)**
```javascript
// Collection Type: BlogPost
{
  title: String (required),
  slug: UID,
  content: RichText,
  excerpt: Text,
  cover_image: Media,
  author: Relation (many-to-one) → Admin,
  category: Relation (many-to-one) → Category,
  tags: Relation (many-to-many) → Tag,
  seo: Component (SEO fields),
  published_at: DateTime
}
```

#### **Rôles & Permissions Strapi**

```javascript
// Strapi Roles
const strapiRoles = {
  admin: {
    // Marie-Line - Accès total
    permissions: ['create', 'read', 'update', 'delete', 'publish'],
    content: ['all']
  },
  
  coach: {
    // Coach assistant - Gestion programmes & support
    permissions: ['create', 'read', 'update', 'publish'],
    content: ['custom_programs', 'users', 'messages']
  },
  
  editor: {
    // Éditeur contenu - Blogs, recettes
    permissions: ['create', 'read', 'update'],
    content: ['blog_posts', 'recipes', 'videos', 'audios']
  },
  
  public: {
    // API publique (Next.js frontend)
    permissions: ['read'],
    content: ['videos:published', 'programs:published', 'audios:published']
  }
}
```

#### **API Endpoints Strapi**

```bash
# Videos
GET    /api/videos              # Liste vidéos publiées
GET    /api/videos/:id          # Détails vidéo
GET    /api/videos?filters[muscle_group][$eq]=abdos
GET    /api/videos?populate=*   # Avec relations

# Programs
GET    /api/programs
GET    /api/programs/:id?populate[videos][populate]=*

# Audios
GET    /api/audios
GET    /api/audios?filters[category][$eq]=meditation_guidee

# Recipes
GET    /api/recipes
GET    /api/recipes/:id

# Recherche globale
GET    /api/search?query=pilates

# Upload
POST   /api/upload              # Upload fichiers
```

#### **Integration Next.js ↔ Strapi**

##### **1. Fetch depuis Strapi**
```typescript
// lib/strapi.ts
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN

export async function fetchFromStrapi(endpoint: string) {
  const res = await fetch(`${STRAPI_URL}/api/${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${STRAPI_TOKEN}`,
    },
    next: { revalidate: 60 } // Cache 60s
  })
  
  if (!res.ok) throw new Error('Failed to fetch from Strapi')
  return res.json()
}

// Utilisation
const videos = await fetchFromStrapi('videos?populate=*')
```

##### **2. Page Vidéos (SSR)**
```typescript
// app/videos/page.tsx
import { fetchFromStrapi } from '@/lib/strapi'

export default async function VideosPage() {
  const { data: videos } = await fetchFromStrapi('videos?populate=*')
  
  return (
    <div>
      {videos.map(video => (
        <VideoCard key={video.id} video={video.attributes} />
      ))}
    </div>
  )
}
```

##### **3. Dynamic Routes**
```typescript
// app/videos/[slug]/page.tsx
export async function generateStaticParams() {
  const { data: videos } = await fetchFromStrapi('videos')
  
  return videos.map((video) => ({
    slug: video.attributes.slug,
  }))
}

export default async function VideoPage({ params }) {
  const { data } = await fetchFromStrapi(`videos?filters[slug][$eq]=${params.slug}&populate=*`)
  const video = data[0]
  
  return <VideoDetail video={video.attributes} />
}
```

#### **Configuration Strapi**

##### **Installation**
```bash
# Créer projet Strapi
npx create-strapi-app@latest strapi-cms
cd strapi-cms

# Installation avec PostgreSQL
npm run strapi install

# Configuration .env
DATABASE_CLIENT=postgres
DATABASE_HOST=your-supabase-host
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-password
DATABASE_SSL=true

# S3 Plugin pour médias
npm install @strapi/provider-upload-aws-s3
```

##### **Config S3 Upload**
```javascript
// config/plugins.js
module.exports = {
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
        params: {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
        },
      },
    },
  },
}
```

##### **CORS pour Next.js**
```javascript
// config/middlewares.js
module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https://only-you-coaching.s3.amazonaws.com'],
          'media-src': ["'self'", 'data:', 'blob:', 'https://only-you-coaching.s3.amazonaws.com'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://localhost:3000', 'https://only-you-coaching.com'],
      credentials: true,
    },
  },
  // ... autres middlewares
]
```

#### **Hébergement Strapi**

##### **Option 1 : VPS (Recommandé pour contrôle total)**
```bash
# DigitalOcean, Hetzner, OVH
# Droplet 2GB RAM + 50GB SSD
# ~10-20€/mois

# Deploy avec PM2
npm install -g pm2
pm2 start npm --name "strapi" -- start
pm2 save
pm2 startup
```

##### **Option 2 : Railway.app (Simple & rapide)**
```bash
# Gratuit pour commencer, puis ~5-20$/mois
# Auto-deploy depuis GitHub
# PostgreSQL inclus
```

##### **Option 3 : Strapi Cloud (Officiel)**
```bash
# Hébergement managé par Strapi
# À partir de 15$/mois
# Support inclus
```

#### **Workflow Marie-Line**

##### **1. Ajouter une nouvelle Vidéo**
```
1. Se connecter à Strapi (/admin)
2. Aller dans "Content Manager" > "Videos"
3. Cliquer "Create new entry"
4. Remplir:
   - Titre
   - Description
   - Upload thumbnail
   - Sélectionner groupe musculaire
   - Choisir niveau
   - Upload vidéo (auto-upload S3)
   - Cocher "premium" si payant
5. Cliquer "Save" puis "Publish"
6. ✅ Vidéo visible sur le site Next.js
```

##### **2. Créer un Programme**
```
1. Aller dans "Programs" > "Create new entry"
2. Remplir informations
3. Sélectionner vidéos existantes (drag & drop)
4. Définir l'ordre
5. Publish
6. ✅ Programme visible immédiatement
```

##### **3. Modifier du Contenu**
```
1. Trouver le contenu dans Content Manager
2. Modifier
3. Save + Publish
4. ✅ Changements en ligne en 60 secondes (cache)
```

#### **Avantages de cette Architecture**

| Aspect | Avantage |
|--------|----------|
| **Pour Marie-Line** | Interface visuelle simple, pas de code |
| **Pour les Développeurs** | API propre, typage TypeScript auto-généré |
| **Performance** | Cache intelligent, CDN-ready |
| **Flexibilité** | Ajouter types de contenu sans toucher Next.js |
| **Sécurité** | Permissions granulaires, API sécurisée |
| **SEO** | URLs propres, metadata gérée par Strapi |
| **Évolutivité** | Multi-langue, versioning, webhooks |

#### **Alternatives à Strapi**

Si Strapi ne convient pas, voici d'autres options :

| CMS | Avantages | Inconvénients |
|-----|-----------|---------------|
| **Sanity** | Excellent UX, temps réel, flexible | Payant dès 99$/mois |
| **Contentful** | Enterprise-grade, très stable | Cher, courbe d'apprentissage |
| **Payload CMS** | TypeScript natif, très moderne | Moins mature que Strapi |
| **KeystoneJS** | GraphQL natif, très puissant | Configuration complexe |
| **Directus** | Open-source, SQL-first | UI moins intuitive |

**Recommandation finale : Strapi** pour le meilleur équilibre simplicité/puissance/coût.

---

## 🔐 Sécurité & Permissions

### **Règles d'Accès**

```javascript
// Types de contenu
const contentAccess = {
  free: ['user', 'admin', 'coach'],
  premium: ['admin', 'coach', 'subscribed_user']
}

// Middleware exemple
export const requireAuth = async (req, res, next) => {
  const session = await getServerSession(authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

export const requireAdmin = async (req, res, next) => {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
```

### **S3 Security**
- URLs signées avec expiration (1h)
- CORS configuré
- Bucket policy restrictive
- Encryption at rest

### **API Security**
- Rate limiting
- CSRF protection
- Input validation (Zod)
- SQL injection prevention (Prisma/Supabase)

---

## 📊 Analytics & Monitoring

### **Métriques à Tracker**

```javascript
const analytics = {
  videos: {
    views: 'total_views',
    watch_time: 'avg_watch_duration',
    completion_rate: 'videos_completed / videos_started',
    popular: 'top_10_videos'
  },
  users: {
    active_users: 'daily/monthly_active',
    retention: '7day/30day_retention',
    churn_rate: 'cancellations / active_subs'
  },
  revenue: {
    mrr: 'monthly_recurring_revenue',
    arr: 'annual_recurring_revenue',
    ltv: 'lifetime_value'
  }
}
```

### **Tools**
- Google Analytics 4
- Stripe Dashboard
- Supabase Analytics
- Vercel Analytics
- Sentry (error tracking)

---

## 🚀 Déploiement & CI/CD

### **Pipeline**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: vercel/actions@v2
```

### **Environnements**

```
Development:  localhost:3000
Staging:      staging.only-you-coaching.vercel.app
Production:   only-you-coaching.com
```

### **Checklist Pre-Deploy**

- [ ] Tests passent (unit + e2e)
- [ ] Build réussit sans warnings
- [ ] Variables d'env configurées
- [ ] Database migrations appliquées
- [ ] S3 CORS configuré
- [ ] Stripe webhooks configurés
- [ ] DNS configuré
- [ ] SSL certificat
- [ ] Analytics activé
- [ ] Monitoring activé

---

## 📦 Migration de Contenu

### **Vidéos Existantes**

```bash
# Structure source
Dossier Cliente/Video/groupes-musculaires/
├── abdos/ (90 vidéos)
├── biceps/ (10 vidéos)
├── triceps/ (24 vidéos)
├── cardio/ (25 vidéos)
├── dos/ (68 vidéos)
├── épaule/ (20 vidéos)
├── fessiers-jambes/ (86 vidéos)
└── stretching/ (23 vidéos)

# Total: ~346 vidéos
```

### **Script de Migration**

```bash
# scripts/migrate-videos.sh
#!/bin/bash

# Upload vers S3
aws s3 sync "./Dossier Cliente/Video/" \
  s3://only-you-coaching/videos/ \
  --region eu-north-1

# Générer métadonnées
node scripts/extract-metadata.js

# Créer entrées DB
node scripts/seed-videos.js
```

### **Audios Existants**

```bash
Dossier Cliente/Audios/
├── coaching mental/ (4 fichiers)
└── méditation guidée/ (10 fichiers)

# Total: 14 audios
```

---

## 🎯 Roadmap V2

### **Phase 1 : Core (4 semaines)**
- [x] Setup technique
- [x] Design system + Dark mode
- [x] Header/Footer optimisés
- [ ] Authentication complète
- [ ] Vidéo player fonctionnel
- [ ] Base de données structurée

### **Phase 2 : Content (3 semaines)**
- [ ] Migration vidéos S3
- [ ] Génération thumbnails
- [ ] Interface vidéos desktop/mobile
- [ ] Programmes prédéfinis
- [ ] Section méditation

### **Phase 3 : Monetization (3 semaines)**
- [ ] Intégration Stripe
- [ ] Plans d'abonnement
- [ ] Gestion subscriptions
- [ ] Webhooks & paiements
- [ ] Emails transactionnels

### **Phase 4 : Admin (2 semaines)**
- [ ] Dashboard admin
- [ ] Upload vidéos
- [ ] Gestion users
- [ ] Analytics basiques
- [ ] Modération

### **Phase 5 : Polish (2 semaines)**
- [ ] Optimisations performance
- [ ] SEO complet
- [ ] Tests utilisateurs
- [ ] Bug fixes
- [ ] Documentation

### **Phase 6 : Launch (1 semaine)**
- [ ] Deploy production
- [ ] Monitoring
- [ ] Marketing ready
- [ ] Support ready

**Total : ~15 semaines (~3.5 mois)**

---

## 📚 Documentation & Resources

### **Documentation Technique**
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [Stripe Docs](https://stripe.com/docs)
- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)

### **Fichiers Internes**
- `README.md` - Getting started
- `DESIGN_UPDATE.md` - Design system V1
- `CURVED_DESIGN_UPDATE.md` - Courbes optimisées
- `SUPABASE_SETUP.md` - Setup Supabase
- `S3_SETUP_GUIDE.md` - Configuration S3
- `THUMBNAIL_AUTOMATION.md` - Génération thumbnails
- `VIDEO_PLAYER_MIGRATION.md` - Migration player

### **Scripts Utiles**

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build production
npm run lint             # ESLint
npm run type-check       # TypeScript check

# Database
npm run db:migrate       # Apply migrations
npm run db:seed          # Seed data
npm run db:reset         # Reset DB

# AWS
npm run s3:upload        # Upload videos
npm run s3:sync          # Sync files
npm run lambda:deploy    # Deploy Lambda

# Stripe
npm run stripe:listen    # Local webhooks
```

---

## 🆘 Support & Maintenance

### **Contacts**
- **Développeur** : [À définir]
- **Designer** : [À définir]
- **Client** : Marie-Line (Only You Coaching)

### **Support Channels**
- GitHub Issues
- Email support
- Documentation wiki
- Video tutorials

### **Maintenance Schedule**
- **Daily** : Monitoring & alerts
- **Weekly** : Performance review
- **Monthly** : Security updates
- **Quarterly** : Feature updates

---

## 🎉 Success Metrics

### **KPIs V2**

```javascript
const successMetrics = {
  technical: {
    uptime: '> 99.9%',
    page_load: '< 2s',
    video_start: '< 3s',
    error_rate: '< 0.1%'
  },
  business: {
    active_users: '> 1000',
    conversion_rate: '> 5%',
    mrr: '> €10,000',
    churn: '< 5%'
  },
  engagement: {
    daily_active: '> 20%',
    avg_watch_time: '> 15min',
    completion_rate: '> 60%',
    nps: '> 50'
  }
}
```

---

## ✅ Checklist de Lancement

### **Technique**
- [ ] Tests E2E passent
- [ ] Performance Score > 90
- [ ] Accessibilité Score > 95
- [ ] SEO Score > 90
- [ ] Security audit OK
- [ ] Load testing OK
- [ ] Backup strategy en place
- [ ] Monitoring configuré
- [ ] Error tracking actif
- [ ] CDN configuré

### **Business**
- [ ] Plans de pricing finalisés
- [ ] Stripe en mode production
- [ ] Emails transactionnels configurés
- [ ] CGU & Politique de confidentialité
- [ ] Support client prêt
- [ ] Analytics configuré
- [ ] Marketing pixels

### **Contenu**
- [ ] Toutes les vidéos uploadées
- [ ] Tous les audios uploadées
- [ ] Miniatures générées
- [ ] Métadonnées complètes
- [ ] Programmes créés
- [ ] Contenu gratuit défini
- [ ] Textes marketing prêts

---

**🚀 Ready to build V2!**

_Ce brief est un document vivant. Mettez-le à jour au fur et à mesure de l'avancement du projet._


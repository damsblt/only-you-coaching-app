# Configuration des Descriptions de Régions de Programmes

Ce script crée la table nécessaire pour stocker les descriptions éditable des régions de programmes.

## Installation

1. Connectez-vous à votre dashboard Supabase
2. Allez dans SQL Editor
3. Exécutez le script `create-program-regions-descriptions.sql` :

```bash
# Copiez le contenu du fichier scripts/create-program-regions-descriptions.sql
# et collez-le dans l'éditeur SQL de Supabase
```

## Structure de la table

La table `program_region_descriptions` contient :
- `id` : UUID (clé primaire)
- `region_slug` : Identifiant unique de la région (ex: "haute-intensite")
- `display_name` : Nom d'affichage (ex: "Haute Intensité")
- `description` : Description éditable (affichée sur la page)
- `created_at` : Date de création
- `updated_at` : Date de mise à jour

## Initialisation

Le script insère automatiquement les régions par défaut avec leurs descriptions initiales.

## Utilisation

Une fois la table créée :
1. Accédez à `/admin/program-regions` pour gérer les descriptions
2. Les descriptions sont automatiquement affichées sur les pages `/programmes/[region]`

## API

L'API est disponible à `/api/program-regions` :
- GET : Récupérer toutes les régions ou une région spécifique
- POST : Créer une nouvelle région
- PUT : Mettre à jour une région
- DELETE : Supprimer une région



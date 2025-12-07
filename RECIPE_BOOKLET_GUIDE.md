# Recipe Booklet Feature Guide

## Overview

The recipe section now supports displaying recipes in a beautiful **booklet format** with page-turning navigation, or as downloadable PDFs. This is perfect for recipes that come as a collection of images (like "Recettes Végétariennes Vol. I").

## Features

### 1. **Booklet Viewer Component**
- Displays recipe pages side-by-side (like an open book)
- Zoom controls (50% to 300%)
- Fullscreen mode
- Keyboard navigation (Arrow keys, Escape)
- Thumbnail strip for quick navigation
- Page counter

### 2. **PDF Support**
- Optional PDF storage alongside images
- Toggle between image gallery and PDF viewer
- Download PDF functionality
- Native browser PDF viewer

### 3. **Display Options**
- **Details View**: Traditional recipe card with ingredients, instructions, etc.
- **Booklet View**: Full-screen booklet viewer for browsing recipe pages

## Database Setup

Run the migration to add the `pdf_url` column:

```sql
-- Run this in your Supabase SQL editor
-- File: scripts/add-pdf-url-to-recipes.sql
```

Or manually:

```sql
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;
```

## Usage

### For End Users

1. Click on any recipe card
2. If the recipe has multiple images or a PDF, you'll see a **book icon** (📖) in the modal header
3. Click the book icon to switch to booklet view
4. In booklet view:
   - Use arrow keys or click arrows to navigate pages
   - Zoom in/out with controls
   - Enter fullscreen for immersive viewing
   - Download individual pages or the full PDF

### For Administrators

#### Option 1: Upload Individual Images (Current Method)

1. Upload recipe images to S3 or Supabase Storage
2. Store image URLs in the `images` JSONB array:
   ```sql
   UPDATE recipes 
   SET images = '["https://.../page1.png", "https://.../page2.png", ...]'
   WHERE id = 'recipe-id';
   ```

#### Option 2: Create and Upload PDF

**Creating PDF from Images (Python Example):**

```python
from PIL import Image
import os

def create_pdf_from_images(image_paths, output_pdf_path):
    """
    Convert a list of images to a single PDF
    
    Args:
        image_paths: List of paths to image files (sorted by page number)
        output_pdf_path: Path where PDF should be saved
    """
    images = []
    for path in sorted(image_paths):
        img = Image.open(path)
        # Convert to RGB if necessary (PDF requires RGB)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        images.append(img)
    
    if images:
        images[0].save(
            output_pdf_path,
            "PDF",
            resolution=100.0,
            save_all=True,
            append_images=images[1:]
        )
        print(f"PDF created: {output_pdf_path}")

# Example usage
image_files = [f"Recettes_Vol.I/{i}.png" for i in range(1, 28)]
create_pdf_from_images(image_files, "Recettes_Vegetariennes_Vol_I.pdf")
```

**Or using ImageMagick (Command Line):**

```bash
# Install ImageMagick first
# On macOS: brew install imagemagick
# On Linux: apt-get install imagemagick

convert Recettes_Vol.I/*.png Recettes_Vegetariennes_Vol_I.pdf
```

**Upload PDF to S3:**

```javascript
// Using your existing S3 upload function
const fs = require('fs');
const { uploadToS3 } = require('./lib/s3');

async function uploadRecipePDF(pdfPath, recipeSlug) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const key = `recipes/${recipeSlug}.pdf`;
  
  const result = await uploadToS3(
    pdfBuffer,
    key,
    'application/pdf',
    {
      recipe: recipeSlug,
      uploadedAt: new Date().toISOString()
    }
  );
  
  return result.location;
}
```

**Store PDF URL in Database:**

```sql
UPDATE recipes 
SET pdf_url = 'https://your-s3-bucket.s3.region.amazonaws.com/recipes/recettes-vegetariennes-vol-i.pdf'
WHERE slug = 'recettes-vegetariennes-vol-i';
```

## Recommended Approach

### Best Practice: **Both Methods Together**

1. **Store individual images** in the `images` array for:
   - Flexible viewing (users can jump to specific pages)
   - Better mobile experience (lazy loading)
   - Search engine optimization

2. **Also provide a PDF** for:
   - Easy download/print
   - Offline access
   - Professional presentation
   - Sharing with others

### Example Recipe Entry

```json
{
  "title": "Recettes Végétariennes - Volume I",
  "slug": "recettes-vegetariennes-vol-i",
  "images": [
    "https://s3.../recipes/vol1/page1.png",
    "https://s3.../recipes/vol1/page2.png",
    ...
    "https://s3.../recipes/vol1/page27.png"
  ],
  "pdfUrl": "https://s3.../recipes/recettes-vegetariennes-vol-i.pdf",
  "category": "vegetarian",
  "description": "Une collection de 27 recettes végétariennes délicieuses"
}
```

## API Endpoints

### GET /api/recipes
Returns all recipes including `pdfUrl` if available.

### GET /api/recipes/[id]
Returns a single recipe with `pdfUrl` if available.

### POST /api/recipes
Create a recipe (admin only):

```json
{
  "title": "Recipe Title",
  "images": ["url1", "url2"],
  "pdfUrl": "https://...",
  ...
}
```

## Component Structure

```
components/recipe/
├── RecipeCard.tsx           # Recipe card display
├── RecipeModal.tsx          # Recipe detail modal (with booklet toggle)
└── RecipeBookletViewer.tsx  # Booklet/PDF viewer component
```

## Future Enhancements

Possible improvements:
- [ ] Page-turning animation effects
- [ ] Print optimization mode
- [ ] Search within PDF
- [ ] Bookmarks/favorites for specific pages
- [ ] Sharing individual recipe pages
- [ ] Mobile swipe gestures for navigation

## Troubleshooting

### PDF not displaying?
- Check CORS settings on S3 bucket
- Ensure PDF URL is accessible (public or signed URL)
- Browser must support PDF viewing (Chrome, Firefox, Safari)

### Images not loading?
- Verify image URLs are correct
- Check S3 bucket permissions
- Ensure images are properly sized (optimize if needed)

### Booklet view not appearing?
- Recipe must have either:
  - Multiple images (`images.length > 1`), OR
  - A `pdfUrl` set

## Migration Checklist

- [x] Add `pdf_url` column to recipes table
- [x] Update Recipe TypeScript interface
- [x] Update API routes to include `pdf_url`
- [x] Create RecipeBookletViewer component
- [x] Add booklet toggle to RecipeModal
- [ ] Create script to convert images to PDF (optional)
- [ ] Upload existing recipe PDFs to S3
- [ ] Update database with PDF URLs


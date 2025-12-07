/**
 * Script to create PDF from recipe images
 * 
 * Usage:
 *   node scripts/create-pdf-from-images.js <image-directory> <output-pdf-path>
 * 
 * Example:
 *   node scripts/create-pdf-from-images.js "Dossier Cliente/recettes végétarienne/Recettes_Vol.I" "Recettes_Vegetariennes_Vol_I.pdf"
 * 
 * Requirements:
 *   npm install pdf-lib sharp
 *   OR use ImageMagick: brew install imagemagick
 */

const fs = require('fs');
const path = require('path');

// Try using pdf-lib first (recommended)
async function createPDFWithPdfLib(imageDir, outputPath) {
  try {
    const { PDFDocument } = require('pdf-lib');
    const sharp = require('sharp');

    console.log(`📚 Creating PDF from images in: ${imageDir}`);
    
    // Get all image files sorted numerically
    const files = fs.readdirSync(imageDir)
      .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
      .sort((a, b) => {
        // Extract numbers from filenames for proper sorting
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      })
      .map(file => path.join(imageDir, file));

    if (files.length === 0) {
      console.error('❌ No image files found in directory');
      process.exit(1);
    }

    console.log(`📄 Found ${files.length} images`);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();

    // Process each image
    for (let i = 0; i < files.length; i++) {
      const imagePath = files[i];
      console.log(`   Processing page ${i + 1}/${files.length}: ${path.basename(imagePath)}`);

      try {
        // Read and convert image to buffer
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Convert to PNG if needed (pdf-lib works better with PNG)
        let pngBuffer;
        if (path.extname(imagePath).toLowerCase() === '.png') {
          pngBuffer = imageBuffer;
        } else {
          pngBuffer = await sharp(imageBuffer).png().toBuffer();
        }

        // Embed image in PDF
        const image = await pdfDoc.embedPng(pngBuffer);
        const page = pdfDoc.addPage();
        
        // Get image dimensions
        const imgDims = image.scale(1);
        const pageWidth = page.getSize().width;
        const pageHeight = page.getSize().height;
        
        // Calculate scaling to fit page
        const scale = Math.min(
          pageWidth / imgDims.width,
          pageHeight / imgDims.height
        );
        
        // Center image on page
        const scaledWidth = imgDims.width * scale;
        const scaledHeight = imgDims.height * scale;
        const x = (pageWidth - scaledWidth) / 2;
        const y = (pageHeight - scaledHeight) / 2;
        
        page.drawImage(image, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
      } catch (error) {
        console.error(`   ⚠️  Error processing ${imagePath}:`, error.message);
      }
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    
    console.log(`✅ PDF created successfully: ${outputPath}`);
    console.log(`📊 File size: ${(pdfBytes.length / 1024 / 1024).toFixed(2)} MB`);
    
    return outputPath;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠️  pdf-lib not found, trying ImageMagick method...');
      return null;
    }
    throw error;
  }
}

// Fallback: Use ImageMagick (requires system installation)
async function createPDFWithImageMagick(imageDir, outputPath) {
  const { execSync } = require('child_process');
  
  try {
    console.log(`📚 Creating PDF using ImageMagick...`);
    
    // Check if ImageMagick is installed
    execSync('which convert', { stdio: 'ignore' });
    
    const imagePattern = path.join(imageDir, '*.png');
    const command = `convert ${imagePattern} "${outputPath}"`;
    
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ PDF created successfully: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('❌ ImageMagick not found or failed');
    console.error('   Install with: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)');
    throw error;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
📖 Recipe PDF Creator

Usage:
  node scripts/create-pdf-from-images.js <image-directory> <output-pdf-path>

Example:
  node scripts/create-pdf-from-images.js "Dossier Cliente/recettes végétarienne/Recettes_Vol.I" "Recettes_Vegetariennes_Vol_I.pdf"

Requirements:
  Option 1: npm install pdf-lib sharp
  Option 2: Install ImageMagick (brew install imagemagick)
    `);
    process.exit(1);
  }

  const imageDir = path.resolve(args[0]);
  const outputPath = path.resolve(args[1]);

  // Validate input directory
  if (!fs.existsSync(imageDir)) {
    console.error(`❌ Directory not found: ${imageDir}`);
    process.exit(1);
  }

  // Create output directory if needed
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Try pdf-lib first
    const result = await createPDFWithPdfLib(imageDir, outputPath);
    if (result) {
      return;
    }
    
    // Fallback to ImageMagick
    await createPDFWithImageMagick(imageDir, outputPath);
  } catch (error) {
    console.error('❌ Error creating PDF:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createPDFWithPdfLib, createPDFWithImageMagick };


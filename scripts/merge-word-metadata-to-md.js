#!/usr/bin/env node
/**
 * Script pour créer un fichier markdown unique regroupant tous les fichiers Word
 * Usage: node scripts/merge-word-metadata-to-md.js
 */

const fs = require('fs')
const path = require('path')
const mammoth = require('mammoth')
const AdmZip = require('adm-zip')

const METADATA_DIR = 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées'
const OUTPUT_FILE = 'Dossier Cliente/Video/groupes-musculaires/01-métadonnées/metadonnees-completes.md'

/**
 * Extract text from Word document
 */
async function extractTextFromWord(wordPath) {
  try {
    const result = await mammoth.extractRawText({ path: wordPath })
    return result.value
  } catch (error) {
    // Fallback to manual extraction
    try {
      const zip = new AdmZip(wordPath)
      const xmlContent = zip.readAsText('word/document.xml')
      const text = xmlContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return text
    } catch (error2) {
      throw new Error(`Failed to extract text: ${error2.message}`)
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Création du fichier markdown regroupé...\n')
  
  // Get all Word files
  const files = fs.readdirSync(METADATA_DIR)
    .filter(f => f.endsWith('.docx') && !f.startsWith('~$'))
    .sort()
  
  console.log(`📄 ${files.length} fichier(s) Word trouvé(s)\n`)
  
  let markdownContent = `# Métadonnées Complètes - Groupes Musculaires

Ce fichier regroupe toutes les métadonnées extraites des fichiers Word du dossier \`01-métadonnées\`.

**Date de génération :** ${new Date().toLocaleString('fr-FR')}
**Nombre de fichiers sources :** ${files.length}

---

`
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const filePath = path.join(METADATA_DIR, file)
    
    console.log(`📖 Traitement de: ${file}`)
    
    try {
      const text = await extractTextFromWord(filePath)
      
      // Add section header
      markdownContent += `\n## ${file.replace('.docx', '')}\n\n`
      markdownContent += `**Source :** \`${file}\`\n\n`
      markdownContent += `---\n\n`
      
      // Add content (preserve formatting)
      markdownContent += text
      
      // Add separator between files
      if (i < files.length - 1) {
        markdownContent += `\n\n---\n\n`
      }
      
      console.log(`   ✅ Texte extrait (${text.length} caractères)`)
    } catch (error) {
      console.error(`   ❌ Erreur: ${error.message}`)
      markdownContent += `\n**Erreur lors de l'extraction :** ${error.message}\n\n`
    }
  }
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, markdownContent, 'utf-8')
  
  console.log(`\n✅ Fichier créé: ${OUTPUT_FILE}`)
  console.log(`📊 Taille totale: ${(markdownContent.length / 1024).toFixed(2)} KB`)
  console.log(`\n✅ Terminé!`)
}

main().catch(console.error)






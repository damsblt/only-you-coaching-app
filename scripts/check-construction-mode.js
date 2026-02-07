/**
 * Script de diagnostic pour vérifier le mode construction
 */

console.log('🔍 Diagnostic du Mode Construction\n')

// Vérifier les variables d'environnement
console.log('Variables d\'environnement:')
console.log('  CONSTRUCTION_MODE:', process.env.CONSTRUCTION_MODE)
console.log('  CONSTRUCTION_JWT_SECRET:', process.env.CONSTRUCTION_JWT_SECRET ? '✅ Défini' : '❌ Non défini')
console.log('  NODE_ENV:', process.env.NODE_ENV)

// Vérifier si le mode est activé
const isActive = process.env.CONSTRUCTION_MODE === 'true'
console.log('\n📊 État:')
console.log('  Mode construction:', isActive ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ')

if (!isActive) {
  console.log('\n⚠️  Le mode construction n\'est PAS activé!')
  console.log('   Pour l\'activer, définissez CONSTRUCTION_MODE=true dans Vercel')
} else {
  console.log('\n✅ Le mode construction est activé')
  console.log('   Toutes les pages devraient être bloquées sauf pour les utilisateurs autorisés')
}

console.log('\n📝 Instructions:')
console.log('   1. Vérifiez dans Vercel Dashboard → Settings → Environment Variables')
console.log('   2. Assurez-vous que CONSTRUCTION_MODE=true est défini pour Production')
console.log('   3. Redéployez l\'application après modification')
console.log('   4. Vérifiez les logs du middleware dans Vercel Dashboard → Deployments → Logs')

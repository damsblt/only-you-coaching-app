import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeSecretKey, getStripePublishableKey, isProductionDomain } from '@/lib/get-site-url'

export async function GET(req: NextRequest) {
  const hostname = req.headers.get('host') || ''
  const isProd = isProductionDomain(hostname)
  
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    hostname: hostname,
    domainMode: isProd ? 'PRODUCTION (LIVE)' : 'TEST',
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'not set',
    checks: {}
  }

  const secretKey = getStripeSecretKey(hostname)
  const publishableKey = getStripePublishableKey(hostname)

  // Check 1: Environment variables
  diagnostics.checks.envVars = {
    STRIPE_SECRET_KEY: {
      exists: !!secretKey,
      length: secretKey?.length || 0,
      startsWithSk: secretKey?.startsWith('sk_') || false,
      isTestKey: secretKey?.startsWith('sk_test_') || false,
      isLiveKey: secretKey?.startsWith('sk_live_') || false,
      preview: secretKey ? 
        `${secretKey.substring(0, 12)}...${secretKey.substring(secretKey.length - 4)}` 
        : 'NOT_SET'
    },
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
      exists: !!publishableKey,
      length: publishableKey?.length || 0,
      startsWithPk: publishableKey?.startsWith('pk_') || false,
      preview: publishableKey || 'NOT_SET'
    }
  }

  // Check 2: Try to initialize Stripe
  if (secretKey) {
    try {
      const stripe = new Stripe(secretKey, {
        apiVersion: '2025-08-27.basil',
      })
      
      diagnostics.checks.stripeInit = {
        success: true,
        apiVersion: '2025-08-27.basil'
      }

      // Check 3: Try to list products (lightweight test)
      try {
        const products = await stripe.products.list({ limit: 1 })
        diagnostics.checks.stripeConnection = {
          success: true,
          canConnect: true,
          productsCount: products.data.length,
          hasMore: products.has_more
        }
      } catch (connectionError: any) {
        diagnostics.checks.stripeConnection = {
          success: false,
          canConnect: false,
          error: connectionError.message,
          type: connectionError.type,
          code: connectionError.code,
          statusCode: connectionError.statusCode
        }
      }

      // Check 4: Try to list prices for our products
      try {
        const productsToCheck = [
          'Essentiel - Accompagnement',
          'Avancé - Accompagnement',
          'Premium - Accompagnement',
          'Starter - Autonomie',
          'Pro - Autonomie',
          'Expert - Autonomie'
        ]
        
        const allProducts = await stripe.products.list({ active: true, limit: 100 })
        const foundProducts: any = {}
        
        for (const productName of productsToCheck) {
          const product = allProducts.data.find(p => p.name === productName)
          if (product) {
            const prices = await stripe.prices.list({ product: product.id, active: true })
            foundProducts[productName] = {
              found: true,
              productId: product.id,
              pricesCount: prices.data.length,
              firstPrice: prices.data[0] ? {
                id: prices.data[0].id,
                amount: prices.data[0].unit_amount,
                currency: prices.data[0].currency,
                recurring: prices.data[0].recurring
              } : null
            }
          } else {
            foundProducts[productName] = {
              found: false,
              error: 'Product not found in Stripe'
            }
          }
        }
        
        diagnostics.checks.products = {
          success: true,
          totalProducts: allProducts.data.length,
          ourProducts: foundProducts
        }
      } catch (productsError: any) {
        diagnostics.checks.products = {
          success: false,
          error: productsError.message,
          type: productsError.type
        }
      }

    } catch (initError: any) {
      diagnostics.checks.stripeInit = {
        success: false,
        error: initError.message,
        type: initError.type,
        code: initError.code
      }
    }
  } else {
    diagnostics.checks.stripeInit = {
      success: false,
      error: 'STRIPE_SECRET_KEY not set for this domain'
    }
  }

  // Summary
  const allChecksPass = 
    diagnostics.checks.envVars.STRIPE_SECRET_KEY.exists &&
    diagnostics.checks.stripeInit?.success &&
    diagnostics.checks.stripeConnection?.success

  diagnostics.summary = {
    allChecksPass,
    ready: allChecksPass,
    issues: []
  }

  if (!diagnostics.checks.envVars.STRIPE_SECRET_KEY.exists) {
    diagnostics.summary.issues.push('❌ STRIPE_SECRET_KEY not configured')
  }
  if (!diagnostics.checks.stripeInit?.success) {
    diagnostics.summary.issues.push('❌ Cannot initialize Stripe client')
  }
  if (!diagnostics.checks.stripeConnection?.success) {
    diagnostics.summary.issues.push('❌ Cannot connect to Stripe API')
  }

  return NextResponse.json(diagnostics, { 
    status: allChecksPass ? 200 : 500,
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}

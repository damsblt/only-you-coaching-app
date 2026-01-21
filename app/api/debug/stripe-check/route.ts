import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {}
  }

  // Check 1: Environment variables
  diagnostics.checks.envVars = {
    STRIPE_SECRET_KEY: {
      exists: !!process.env.STRIPE_SECRET_KEY,
      length: process.env.STRIPE_SECRET_KEY?.length || 0,
      startsWithSk: process.env.STRIPE_SECRET_KEY?.startsWith('sk_') || false,
      isTestKey: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false,
      isLiveKey: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') || false,
      preview: process.env.STRIPE_SECRET_KEY ? 
        `${process.env.STRIPE_SECRET_KEY.substring(0, 12)}...${process.env.STRIPE_SECRET_KEY.substring(process.env.STRIPE_SECRET_KEY.length - 4)}` 
        : 'NOT_SET'
    },
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
      exists: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      length: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.length || 0,
      startsWithPk: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_') || false,
      preview: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'NOT_SET'
    }
  }

  // Check 2: Try to initialize Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia',
      })
      
      diagnostics.checks.stripeInit = {
        success: true,
        apiVersion: '2024-12-18.acacia'
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
      error: 'STRIPE_SECRET_KEY not set'
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

import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const stripe = getStripe()
    // Get all active products
    const products = await stripe.products.list({ active: true })
    
    // Get prices for each product
    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({ 
          product: product.id, 
          active: true 
        })
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          prices: prices.data.map(price => ({
            id: price.id,
            amount: price.unit_amount,
            currency: price.currency,
            interval: price.recurring?.interval,
            intervalCount: price.recurring?.interval_count,
            nickname: price.nickname
          }))
        }
      })
    )

    return NextResponse.json({ 
      products: productsWithPrices,
      count: productsWithPrices.length
    })
  } catch (error: any) {
    console.error('Products fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

'use client'

export default function DebugEnvPage() {
  const envVars = {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT_SET',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>
      
      <div className="space-y-4">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="border rounded p-4">
            <h3 className="font-semibold text-lg">{key}:</h3>
            <p className="font-mono bg-gray-100 p-2 rounded mt-2">
              {value || 'NOT_SET'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Type: {typeof value} | Length: {value ? value.length : 0}
            </p>
          </div>
        ))}
        
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800">Note:</h3>
          <p className="text-yellow-700 text-sm mt-1">
            Make sure to set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env.local file
          </p>
        </div>
      </div>
    </div>
  )
}


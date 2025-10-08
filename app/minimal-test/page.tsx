"use client"

export default function MinimalTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Minimal Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Basic HTML5 Video</h2>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              src="https://only-you-coaching.s3.eu-north-1.amazonaws.com/Video/groupes-musculaires/abdos/gainage-planche-avec-mains-sur-ballon-h-mp4"
              poster="https://only-you-coaching.s3.eu-north-1.amazonaws.com/thumbnails/gainage-planche-avec-mains-sur-ballon-h-thumb.jpg"
              className="w-full h-full"
              controls
              playsInline
            />
          </div>
        </div>
      </div>
    </div>
  )
}

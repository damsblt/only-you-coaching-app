"use client"

import { useState, useEffect } from 'react'
import UnifiedVideoPlayer from '@/components/video/UnifiedVideoPlayer'

// Test video data from the database
const testVideo = {
  id: 'd140ef1d-80c7-4795-9579-14ebcf186e97',
  title: 'Gainage planche avec mains sur ballon h',
  description: 'Exercice de gainage avec ballon pour renforcer les abdominaux',
  detailedDescription: 'Cet exercice de gainage avec ballon permet de renforcer les abdominaux profonds tout en travaillant l\'équilibre et la stabilité.',
  thumbnail: 'https://only-you-coaching.s3.eu-north-1.amazonaws.com/thumbnails/gainage-planche-avec-mains-sur-ballon-h-thumb.jpg',
  videoUrl: 'https://only-you-coaching.s3.eu-north-1.amazonaws.com/Video/groupes-musculaires/abdos/gainage-planche-avec-mains-sur-ballon-h-mp4',
  duration: 300, // 5 minutes
  difficulty: 'INTERMEDIATE',
  category: 'Abdominaux',
  region: 'France',
  muscleGroups: ['Abdominaux', 'Épaules', 'Bras'],
  startingPosition: 'Planche sur les mains',
  movement: 'Mouvements de stabilisation',
  intensity: 'Moyenne',
  theme: 'Renforcement',
  series: 'Abdominaux',
  constraints: 'Ballon requis',
  tags: ['gainage', 'ballon', 'abdominaux'],
  isPublished: true
}

export default function TestVideoPlayerPage() {
  const [showPlayer, setShowPlayer] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  useEffect(() => {
    addTestResult('Page loaded')
    
    // Test the streaming API
    const testStreamingAPI = async () => {
      try {
        addTestResult('Testing streaming API...')
        const response = await fetch(`/api/videos/${testVideo.id}/stream`, { method: 'HEAD' })
        addTestResult(`Streaming API response: ${response.status} ${response.statusText}`)
        
        if (response.ok) {
          addTestResult('✅ Streaming API is working')
        } else {
          addTestResult('❌ Streaming API failed')
        }
      } catch (error) {
        addTestResult(`❌ Streaming API error: ${error}`)
      }
    }

    testStreamingAPI()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Video Player Test
        </h1>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                {result}
              </div>
            ))}
          </div>
        </div>

        {/* Video Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="aspect-video bg-gray-200 relative">
            <img
              src={testVideo.thumbnail}
              alt={testVideo.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <button
                onClick={() => {
                  addTestResult('Opening video player...')
                  setShowPlayer(true)
                }}
                className="bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-colors"
              >
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                Intermédiaire
              </span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">{testVideo.title}</h3>
            <p className="text-gray-600 text-sm mb-3">{testVideo.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{testVideo.category}</span>
              <span>{Math.floor(testVideo.duration / 60)} min</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Test Instructions</h2>
          <div className="space-y-2 text-blue-800">
            <div>1. Click the play button to open the video player</div>
            <div>2. Check if the video loads without errors</div>
            <div>3. Test mobile scroll behavior (use browser dev tools)</div>
            <div>4. Test video controls (play, pause, seek, volume)</div>
            <div>5. Check browser console for any errors</div>
          </div>
        </div>

        {/* Video Player Modal */}
        {showPlayer && (
          <UnifiedVideoPlayer
            video={testVideo}
            onClose={() => {
              addTestResult('Video player closed')
              setShowPlayer(false)
            }}
            variant="modal"
            autoPlay={true}
            muted={true}
            showDetails={true}
          />
        )}
      </div>
    </div>
  )
}

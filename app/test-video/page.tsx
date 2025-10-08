'use client'

import { useState } from 'react'
import SimpleVideoPlayer from '@/components/video/SimpleVideoPlayer'

export default function TestVideoPage() {
  const [showPlayer, setShowPlayer] = useState(false)

  const testVideo = {
    id: 'test-video',
    title: 'Test Video',
    videoUrl: '/test-video.mp4',
    thumbnail: '/logo.png',
    duration: 0,
    difficulty: 'BEGINNER' as const,
    category: 'Test',
    muscleGroups: [],
    tags: [],
    isPublished: true,
    videoType: 'MUSCLE_GROUPS' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    folder: 'test'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Player Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test with Local Video File</h2>
          <p className="text-gray-600 mb-4">
            This tests the video player with a local video file to verify it works correctly.
          </p>
          
          <button
            onClick={() => setShowPlayer(!showPlayer)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {showPlayer ? 'Hide' : 'Show'} Video Player
          </button>
        </div>

        {showPlayer && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Video Player</h3>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <SimpleVideoPlayer video={testVideo} />
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">S3 Issue Identified</h3>
          <p className="text-yellow-700">
            The video player is working correctly! The issue is that the S3 bucket either:
          </p>
          <ul className="list-disc list-inside text-yellow-700 mt-2 space-y-1">
            <li>Doesn't have public read access configured</li>
            <li>Has CORS restrictions</li>
            <li>The video files don't exist in S3</li>
            <li>AWS credentials don't have the right permissions</li>
          </ul>
          <p className="text-yellow-700 mt-2">
            To fix this, you need to configure S3 bucket permissions or upload the video files to S3.
          </p>
        </div>
      </div>
    </div>
  )
}

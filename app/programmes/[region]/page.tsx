"use client"

import { useState, useEffect, useRef, use } from "react"
import { useParams, useRouter } from "next/navigation"
import { Play, Clock, Star, Grid, List, ArrowLeft, ArrowRight, ArrowUpLeft, Filter, Lock, CheckCircle2 } from "lucide-react"
import SimpleVideoPlayer from "@/components/video/SimpleVideoPlayer"
import ComputerStreamPlayer from "@/components/video/ComputerStreamPlayer"
import MobileStreamPlayer from "@/components/video/MobileStreamPlayer"
import { Section } from "@/components/ui/Section"
import ProtectedContent from "@/components/ProtectedContent"
import { useSimpleAuth } from "@/components/providers/SimpleAuthProvider"
import { formatIntensity } from "@/utils/formatIntensity"

interface Video {
  id: string
  title: string
  description: string
  detailedDescription: string
  thumbnail: string
  videoUrl: string
  duration: number
  difficulty: string
  category: string
  region: string
  muscleGroups: string[]
  targeted_muscles?: string[]
  exo_title?: string
  startingPosition?: string
  movement?: string
  intensity?: string
  theme?: string
  series?: string
  constraints?: string
  tags: string[]
  isPublished: boolean
  updatedAt: string
}

interface RegionInfo {
  name: string
  displayName: string
  description: string
  color: string
}

export default function RegionPage() {
  const routeParams = useParams()
  const router = useRouter()
  // In Next.js 15, useParams() returns a synchronous object for client components
  // But we need to ensure we're not accessing it in a way that triggers warnings
  const regionName = (routeParams?.region || '') as string
  
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'feed' | 'mobile'>('grid')
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [screenWidth, setScreenWidth] = useState(0)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [regionInfo, setRegionInfo] = useState<RegionInfo>({
    name: regionName,
    displayName: getRegionDisplayName(regionName),
    description: getRegionDescription(regionName),
    color: getRegionColor(regionName)
  })
  const [videoProgress, setVideoProgress] = useState<Record<string, { completed: boolean; progressSeconds: number }>>({})
  const [completedVideos, setCompletedVideos] = useState<string[]>([])
  const [nextAvailableVideoIndex, setNextAvailableVideoIndex] = useState(0)
  const [expandedMetadata, setExpandedMetadata] = useState<Record<string, boolean>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Use the auth context instead of direct auth calls
  const { user, loading: authLoading } = useSimpleAuth()

  function getRegionDisplayName(region: string): string {
    const displayNames: { [key: string]: string } = {
      "abdos": "Abdos",
      "brule-graisse": "Brûle Graisse",
      "haute-intensite": "Haute Intensité",
      "machine": "Machine",
      "pectoraux": "Pectoraux",
      "rehabilitation-dos": "Réhabilitation du Dos",
      "special-femme": "Spécial Femme",
      "cuisses-abdos-fessiers": "Cuisses, Abdos, Fessiers",
      "dos-abdos": "Dos & Abdos",
      "femmes": "Femmes",
      "homme": "Homme",
      "jambes": "Jambes",
      "cuisses-abdos": "Cuisses & Abdos"
    }
    return displayNames[region] || region
  }

  function getRegionDescription(region: string): string {
    const descriptions: { [key: string]: string } = {
      "abdos": "Renforcez vos abdominaux avec des exercices ciblés",
      "brule-graisse": "Programme intensif pour brûler les graisses",
      "haute-intensite": "Entraînements cardio haute intensité",
      "machine": "Exercices avec machines spécialisées",
      "pectoraux": "Développez votre poitrine et vos pectoraux",
      "rehabilitation-dos": "Exercices thérapeutiques pour le dos",
      "special-femme": "Programmes adaptés aux femmes",
      "cuisses-abdos-fessiers": "Tonifiez le bas du corps",
      "dos-abdos": "Renforcez le tronc complet",
      "femmes": "Programmes spécialement conçus pour les femmes",
      "homme": "Programmes adaptés aux hommes",
      "jambes": "Renforcez et tonifiez vos jambes",
      "cuisses-abdos": "Ciblez cuisses et abdominaux"
    }
    return descriptions[region] || "Programme d'entraînement spécialisé"
  }

  function getRegionColor(region: string): string {
    // Use the footer color for all regions
    return ""
  }

  // Fetch region description from API
  useEffect(() => {
    async function fetchRegionDescription() {
      try {
        const response = await fetch(`/api/program-regions?region=${regionName}`)
        if (response.ok) {
          const data = await response.json()
          if (data) {
            setRegionInfo({
              name: regionName,
              displayName: data.display_name || getRegionDisplayName(regionName),
              description: data.description || getRegionDescription(regionName),
              color: getRegionColor(regionName)
            })
          }
        } else {
          // Fallback to hardcoded values if API fails
          console.warn('Failed to fetch region description, using defaults')
        }
      } catch (error) {
        console.error('Error fetching region description:', error)
        // Fallback to hardcoded values on error
      }
    }

    fetchRegionDescription()
  }, [regionName])

  // Fetch videos from API for this region
  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true)
        
        // Build query parameters
        const params = new URLSearchParams()
        params.set('videoType', 'programmes')
        params.set('region', regionName)

        const apiUrl = `/api/videos?${params.toString()}`
        console.log('🔍 Fetching videos from:', apiUrl)
        
        let response: Response
        try {
          response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // Add cache control to avoid stale responses
            cache: 'no-store'
          })
        } catch (fetchError) {
          console.error('❌ Network error during fetch:', {
            error: fetchError,
            message: fetchError instanceof Error ? fetchError.message : String(fetchError),
            stack: fetchError instanceof Error ? fetchError.stack : undefined,
            apiUrl
          })
          setVideos([])
          return
        }
        
        console.log('📡 Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          contentType: response.headers.get('content-type'),
          url: response.url
        })
        
        // Check if response has content before trying to parse
        const contentType = response.headers.get('content-type')
        const hasJsonContent = contentType && contentType.includes('application/json')
        
        if (response.ok) {
          if (hasJsonContent) {
            try {
              const data = await response.json()
              console.log(`✅ Fetched ${data.length} videos for region ${regionName}`)
              setVideos(data || [])
            } catch (jsonError) {
              console.error('❌ Failed to parse JSON response:', jsonError)
              setVideos([])
            }
          } else {
            // Response is OK but not JSON - might be empty
            console.warn('⚠️ Response OK but not JSON, treating as empty array')
            const text = await response.text()
            console.warn('Response body:', text.substring(0, 200))
            setVideos([])
          }
        } else {
          // Try to parse error response
          let errorData: any = {}
          let responseText = ''
          let textReadError: any = null
          
          try {
            responseText = await response.text()
            console.log('📄 Error response text length:', responseText.length)
            console.log('📄 Error response text (first 500):', responseText.substring(0, 500))
            
            if (responseText && responseText.trim()) {
              try {
                errorData = JSON.parse(responseText)
                console.log('✅ Parsed error data:', errorData)
              } catch (parseError) {
                console.warn('⚠️ Could not parse error response as JSON:', parseError)
                errorData = { 
                  raw: responseText.substring(0, 1000),
                  parseError: parseError instanceof Error ? parseError.message : String(parseError)
                }
              }
            } else {
              console.warn('⚠️ Response text is empty')
              errorData = { empty: true }
            }
          } catch (textError) {
            textReadError = textError
            console.error('❌ Could not read error response:', textError)
            errorData = { 
              readError: textError instanceof Error ? textError.message : String(textError)
            }
          }
          
          // Build error info with fallbacks to ensure we always have useful information
          const errorInfo: Record<string, any> = {
            status: response.status || 'unknown',
            statusText: response.statusText || 'unknown',
            url: response.url || apiUrl,
            contentType: contentType || 'unknown',
            hasResponseText: !!responseText,
            responseTextLength: responseText?.length || 0,
          }
          
          // Add error message with multiple fallbacks
          if (errorData?.error) errorInfo.error = errorData.error
          else if (errorData?.message) errorInfo.error = errorData.message
          else if (errorData?.raw) errorInfo.error = `Raw response: ${errorData.raw.substring(0, 200)}`
          else if (textReadError) errorInfo.error = `Failed to read response: ${textReadError instanceof Error ? textReadError.message : String(textReadError)}`
          else if (response.status) errorInfo.error = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`
          else errorInfo.error = 'Unknown error - no response details available'
          
          // Add details
          if (errorData?.details) errorInfo.details = errorData.details
          else if (errorData?.message && errorData.message !== errorInfo.error) errorInfo.details = errorData.message
          else if (errorData?.raw) errorInfo.details = errorData.raw.substring(0, 1000)
          else if (textReadError) errorInfo.details = String(textReadError)
          else errorInfo.details = 'No additional error details available'
          
          // Add full error data if available
          if (Object.keys(errorData).length > 0) {
            errorInfo.fullError = errorData
          }
          
          // Add response text preview
          if (responseText) {
            errorInfo.responseTextPreview = responseText.substring(0, 500)
          } else {
            errorInfo.responseTextPreview = '(empty)'
          }
          
          // Add text read error if any
          if (textReadError) {
            errorInfo.textReadError = textReadError instanceof Error ? textReadError.message : String(textReadError)
          }
          
          // Log with both structured and stringified versions
          console.error('❌ Failed to fetch region videos:')
          console.error('Error Info (object):', errorInfo)
          console.error('Error Info (JSON):', JSON.stringify(errorInfo, null, 2))
          console.error('Response object:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
          })
          
          setVideos([])
        }
      } catch (error) {
        console.error('Error fetching region videos:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          regionName
        })
        setVideos([])
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [regionName])

  // Fetch user progress for this program
  useEffect(() => {
    async function fetchProgress() {
      if (!user || !regionName) return

      try {
        const url = `/api/programmes/${regionName}/progress?userId=${user.id}`
        console.log('🔍 [CLIENT] Fetching progress from:', url)
        const response = await fetch(url)
        
        console.log('🔍 [CLIENT] Response status:', response.status, response.statusText)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📊 [CLIENT] Progress data received:', JSON.stringify({
            progressCount: Object.keys(data.progress || {}).length,
            completedVideos: data.completedVideos?.length || 0,
            nextAvailableIndex: data.nextAvailableVideoIndex,
            progress: data.progress,
            completedVideosList: data.completedVideos,
            progressKeys: Object.keys(data.progress || {}),
            firstVideoId: filteredVideos[0]?.id,
            progressForFirstVideo: data.progress?.[filteredVideos[0]?.id],
            fullResponse: data
          }, null, 2))
          setVideoProgress(data.progress || {})
          setCompletedVideos(data.completedVideos || [])
          setNextAvailableVideoIndex(data.nextAvailableVideoIndex || 0)
        } else {
          const errorText = await response.text()
          console.error('❌ [CLIENT] Failed to fetch progress:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          })
        }
      } catch (error: any) {
        console.error('❌ [CLIENT] Error fetching progress:', {
          message: error?.message,
          error: error
        })
      }
    }

    fetchProgress()
  }, [user, regionName, videos])

  // Check if a video is accessible (first video or previous videos are completed)
  const isVideoAccessible = (videoIndex: number): boolean => {
    if (videoIndex === 0) return true // First video is always accessible
    
    // Check if all previous videos are completed
    for (let i = 0; i < videoIndex; i++) {
      const prevVideo = filteredVideos[i]
      if (!prevVideo) {
        console.warn(`⚠️ Previous video at index ${i} not found`)
        return false
      }
      
      // Check if previous video is completed
      const prevProgress = videoProgress[prevVideo.id]
      const isCompleted = prevProgress?.completed || false
      
      console.log(`🔍 Checking video ${i} (${prevVideo.title}):`, {
        videoId: prevVideo.id,
        hasProgress: !!prevProgress,
        progressObject: prevProgress ? JSON.stringify(prevProgress) : null,
        completed: isCompleted,
        allProgressKeys: Object.keys(videoProgress),
        allProgressData: JSON.stringify(videoProgress, null, 2)
      })
      
      if (!isCompleted) {
        console.log(`🔒 Video ${videoIndex} is locked because video ${i} is not completed`)
        return false
      }
    }
    console.log(`✅ Video ${videoIndex} is accessible - all previous videos are completed`)
    return true
  }

  // Check if a video is completed
  const isVideoCompleted = (videoId: string): boolean => {
    return videoProgress[videoId]?.completed || false
  }

  const filteredVideos = videos

  console.log(`Region: ${regionName}, Total videos: ${videos.length}, Filtered videos: ${filteredVideos.length}`)
  console.log('📹 Video IDs:', JSON.stringify(filteredVideos.map(v => ({ id: v.id, title: v.title })), null, 2))
  console.log('📊 Current progress state:', JSON.stringify(videoProgress, null, 2))
  console.log('✅ Completed videos:', completedVideos)

  // Track screen width and mobile detection
  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth)
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    
    updateScreenWidth()
    window.addEventListener('resize', updateScreenWidth)
    return () => window.removeEventListener('resize', updateScreenWidth)
  }, [])

  // Handle touch events for swipe gestures (mobile only)
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only handle touch events, not mouse events
    if (e.type === 'touchstart') {
      e.preventDefault()
      setStartY(e.touches[0].clientY)
      setCurrentY(e.touches[0].clientY)
      setIsScrolling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isScrolling || e.type !== 'touchmove') return
    e.preventDefault()
    setCurrentY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isScrolling || e.type !== 'touchend') return
    e.preventDefault()
    setIsScrolling(false)
    
    const deltaY = startY - currentY
    const threshold = 50

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && currentVideoIndex < filteredVideos.length - 1) {
        // Swipe up - next video
        setCurrentVideoIndex(prev => prev + 1)
      } else if (deltaY < 0 && currentVideoIndex > 0) {
        // Swipe down - previous video
        setCurrentVideoIndex(prev => prev - 1)
      }
    }
  }

  // Handle mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setStartY(e.clientY)
    setCurrentY(e.clientY)
    setIsScrolling(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScrolling) return
    e.preventDefault()
    setCurrentY(e.clientY)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isScrolling) return
    e.preventDefault()
    setIsScrolling(false)
    
    const deltaY = startY - currentY
    const threshold = 50

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && currentVideoIndex < filteredVideos.length - 1) {
        // Swipe up - next video
        setCurrentVideoIndex(prev => prev + 1)
      } else if (deltaY < 0 && currentVideoIndex > 0) {
        // Swipe down - previous video
        setCurrentVideoIndex(prev => prev - 1)
      }
    }
  }

  const handleVideoClick = (videoId: string) => {
    const video = videos.find(v => v.id === videoId)
    if (!video) return

    // Check if video is accessible
    const videoIndex = filteredVideos.findIndex(v => v.id === videoId)
    if (videoIndex === -1 || !isVideoAccessible(videoIndex)) {
      // Show message that video is locked
      alert(`Cette vidéo est verrouillée. Veuillez compléter les vidéos précédentes pour y accéder.`)
      return
    }

    setLoadingVideoId(videoId)
    setSelectedVideo(video)
    setPlayingVideoId(videoId)
  }

  const handleClosePlayer = async () => {
    console.log('🚪 Closing video player')
    setSelectedVideo(null)
    setPlayingVideoId(null)
    setLoadingVideoId(null)
    
    // Refresh progress when player closes (in case video was completed)
    if (user && regionName) {
      try {
        // Wait a bit to ensure any pending saves are completed
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const response = await fetch(`/api/programmes/${regionName}/progress?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Progress refreshed after closing player:', JSON.stringify({
            completedCount: data.completedCount,
            nextAvailableIndex: data.nextAvailableVideoIndex,
            progress: data.progress,
            completedVideos: data.completedVideos,
            progressKeys: Object.keys(data.progress || {}),
            firstVideoId: filteredVideos[0]?.id,
            progressForFirstVideo: data.progress?.[filteredVideos[0]?.id]
          }, null, 2))
          setVideoProgress(data.progress || {})
          setCompletedVideos(data.completedVideos || [])
          setNextAvailableVideoIndex(data.nextAvailableVideoIndex || 0)
        }
      } catch (err) {
        console.error('Error refreshing progress:', err)
      }
    }
  }

  // Navigation functions
  const goToPrevious = () => {
    if (currentVideoIndex > 0) {
      // Pause and reset current video to beginning
      const currentVideo = document.querySelector(`video[data-video-id="${filteredVideos[currentVideoIndex].id}"]`) as HTMLVideoElement
      if (currentVideo) {
        currentVideo.pause()
        currentVideo.currentTime = 0
      }
      
      setCurrentVideoIndex(prev => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentVideoIndex < filteredVideos.length - 1) {
      // Pause and reset current video to beginning
      const currentVideo = document.querySelector(`video[data-video-id="${filteredVideos[currentVideoIndex].id}"]`) as HTMLVideoElement
      if (currentVideo) {
        currentVideo.pause()
        currentVideo.currentTime = 0
      }
      
      setCurrentVideoIndex(prev => prev + 1)
    }
  }

  const handleNextVideo = () => {
    goToNext()
  }

  const handlePrevVideo = () => {
    goToPrevious()
  }

  // Auto-play video when currentVideoIndex changes (feed mode only)
  useEffect(() => {
    if (viewMode !== 'feed' || filteredVideos.length === 0) return

    const currentVideo = filteredVideos[currentVideoIndex]
    if (!currentVideo) return

    // Set loading state
    setLoadingVideoId(currentVideo.id)
    setPlayingVideoId(null)

    // Small delay to ensure video element is rendered
    const timer = setTimeout(() => {
      const videoElement = document.querySelector(`video[data-video-id="${currentVideo.id}"]`) as HTMLVideoElement
      if (videoElement) {
        // Always reset video to beginning and play automatically
        videoElement.currentTime = 0
        
        // For mobile, ensure video is muted for auto-play
        if (isMobile) {
          videoElement.muted = true
        }
        
        // Check if video is ready to play
        if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
          const playPromise = videoElement.play()
          if (playPromise !== undefined) {
            playPromise.then(() => {
              setPlayingVideoId(currentVideo.id)
              setLoadingVideoId(null)
            }).catch(error => {
              console.log('Autoplay prevented:', error)
              setPlayingVideoId(null)
              setLoadingVideoId(null)
            })
          }
        } else {
          // Wait for video to be ready
          videoElement.addEventListener('canplay', () => {
            videoElement.play().then(() => {
              setPlayingVideoId(currentVideo.id)
              setLoadingVideoId(null)
            }).catch(error => {
              console.log('Autoplay prevented:', error)
              setPlayingVideoId(null)
              setLoadingVideoId(null)
            })
          }, { once: true })
        }
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [currentVideoIndex, viewMode, filteredVideos, isMobile])

  // Handle keyboard navigation for feed mode
  useEffect(() => {
    if (viewMode !== 'feed') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrevious()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentVideoIndex, filteredVideos.length, viewMode])

  // Hide global header/footer while in feed view
  useEffect(() => {
    if (viewMode === 'feed') {
      document.body.classList.add('hide-app-chrome')
    } else {
      document.body.classList.remove('hide-app-chrome')
    }

    return () => {
      document.body.classList.remove('hide-app-chrome')
    }
  }, [viewMode])

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des vidéos...</p>
        </div>
      </div>
    )
  }

  // Mobile view mode layout
  if (viewMode === 'mobile') {
    return (
      <ProtectedContent feature="predefinedPrograms" userId={user?.id}>
        <div className="h-screen w-screen bg-black relative overflow-hidden">
          <MobileStreamPlayer
            video={filteredVideos[currentVideoIndex]}
            onClose={() => setViewMode('grid')}
            onNext={currentVideoIndex < filteredVideos.length - 1 ? goToNext : undefined}
            onPrevious={currentVideoIndex > 0 ? goToPrevious : undefined}
            currentIndex={currentVideoIndex}
            totalVideos={filteredVideos.length}
            autoPlay={true}
            muted={true}
          />
        </div>
      </ProtectedContent>
    )
  }

  // Feed mode layout - Use ComputerStreamPlayer for desktop
  if (viewMode === 'feed') {
    return (
      <ProtectedContent feature="predefinedPrograms" userId={user?.id}>
        <div className="h-screen w-screen bg-black relative overflow-hidden hide-app-chrome" style={{ position: 'fixed', top: 0, left: 0 }}>
          <ComputerStreamPlayer
            video={filteredVideos[currentVideoIndex]}
            onClose={() => setViewMode('grid')}
            onNext={currentVideoIndex < filteredVideos.length - 1 ? goToNext : undefined}
            onPrevious={currentVideoIndex > 0 ? goToPrevious : undefined}
            currentIndex={currentVideoIndex}
            totalVideos={filteredVideos.length}
            autoPlay={true}
            muted={false}
          />
        </div>
      </ProtectedContent>
    )
  }

  if (selectedVideo) {
    console.log('🎬 Opening video player for:', {
      videoId: selectedVideo.id,
      title: selectedVideo.title,
      userId: user?.id
    })
    return (
        <SimpleVideoPlayer
          video={selectedVideo}
          onClose={handleClosePlayer}
          onVideoCompleted={async () => {
            // Refresh progress when video is completed
            console.log('🔄 Refreshing progress after video completion for video:', selectedVideo.id)
            if (user && regionName) {
              try {
                // Wait a bit longer in production to ensure the database has been updated
                // Use a longer delay and retry mechanism for production
                const maxRetries = 3
                let retryCount = 0
                let success = false
                
                while (retryCount < maxRetries && !success) {
                  // Wait progressively longer: 500ms, 1000ms, 1500ms
                  await new Promise(resolve => setTimeout(resolve, 500 + (retryCount * 500)))
                  
                  console.log(`🔄 Attempting to refresh progress (attempt ${retryCount + 1}/${maxRetries})...`)
                  
                  const response = await fetch(`/api/programmes/${regionName}/progress?userId=${user.id}`, {
                    cache: 'no-store', // Ensure we don't get cached data
                    headers: {
                      'Cache-Control': 'no-cache'
                    }
                  })
                  
                  if (response.ok) {
                    const data = await response.json()
                    const isVideoCompleted = data.completedVideos?.includes(selectedVideo.id) || data.progress?.[selectedVideo.id]?.completed
                    
                    console.log('✅ Progress refreshed after completion:', JSON.stringify({
                      completedCount: data.completedCount,
                      nextAvailableIndex: data.nextAvailableVideoIndex,
                      progress: data.progress,
                      completedVideos: data.completedVideos,
                      videoId: selectedVideo.id,
                      isVideoCompleted,
                      progressForThisVideo: data.progress?.[selectedVideo.id],
                      attempt: retryCount + 1
                    }, null, 2))
                    
                    // Only update state if video is actually marked as completed
                    if (isVideoCompleted) {
                      setVideoProgress(data.progress || {})
                      setCompletedVideos(data.completedVideos || [])
                      setNextAvailableVideoIndex(data.nextAvailableVideoIndex || 0)
                      success = true
                      console.log('✅ State updated successfully with completed video')
                    } else {
                      console.warn(`⚠️ Video not yet marked as completed in database (attempt ${retryCount + 1}), retrying...`)
                      retryCount++
                    }
                  } else {
                    console.error(`❌ Failed to refresh progress (attempt ${retryCount + 1}):`, response.status, response.statusText)
                    retryCount++
                  }
                }
                
                if (!success) {
                  console.error('❌ Failed to refresh progress after all retries')
                }
              } catch (err) {
                console.error('❌ Error refreshing progress:', err)
              }
            } else {
              console.warn('⚠️ Cannot refresh progress: missing user or regionName', { hasUser: !!user, hasRegion: !!regionName })
            }
          }}
        />
    )
  }

  return (
    <Section gradient="neutral">
      <ProtectedContent 
        feature="predefinedPrograms" 
        userId={user?.id}
      >
        {/* Header with Back Button */}
        <div className="text-white relative overflow-hidden rounded-2xl" style={{ backgroundColor: '#39334D' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/programmes')}
                  className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <ArrowUpLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold">{regionInfo.displayName}</h1>
                </div>
              </div>
            
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('feed' as const)}
                  className={`p-2 rounded-lg ${
                    (viewMode as string) === 'feed' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Feed View"
                >
                  <List className="h-5 w-5" />
                </button>
                {isMobile && (
                  <button
                    onClick={() => setViewMode('mobile' as const)}
                    className={`p-2 rounded-lg ${
                      (viewMode as string) === 'mobile' 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/60 hover:text-white'
                    }`}
                    title="Mobile View"
                  >
                    <Play className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {regionInfo.description && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed text-base md:text-lg whitespace-pre-line">
                  {regionInfo.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-gray-600">
              {filteredVideos.length} vidéo{filteredVideos.length !== 1 ? 's' : ''} trouvée{filteredVideos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {viewMode === 'grid' && (
          /* Grid View */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {filteredVideos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Filter className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune vidéo trouvée</h3>
                <p className="text-gray-500">Essayez de modifier vos filtres de recherche</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredVideos.map((video, index) => {
                  const isAccessible = isVideoAccessible(index)
                  const isCompleted = isVideoCompleted(video.id)
                  
                  return (
                    <div key={video.id} className="relative">
                      <div
                        className="curved-card bg-white dark:bg-gray-800 shadow-organic hover:shadow-floating transition-all cursor-pointer group overflow-hidden border border-gray-100 dark:border-gray-700"
                      >
                        {/* Thumbnail with Play Button */}
                        <div className="relative aspect-video bg-neutral-200 dark:bg-gray-700 overflow-hidden leading-none text-[0]">
                          <img
                            src={video.thumbnail || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"}
                            alt={video.title}
                            className="block w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"
                            }}
                          />
                          <div className="absolute inset-0 bg-accent-500/0 group-hover:bg-accent-500/20 transition-all duration-300 flex items-center justify-center">
                            <button 
                              onClick={() => handleVideoClick(video.id)} 
                              className="w-14 h-14 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-floating"
                            >
                              <Play className="w-6 h-6 text-secondary-500 ml-1" />
                            </button>
                          </div>
                          
                          {/* Difficulty Badge */}
                          <div className={`absolute top-3 left-3 px-3 py-1.5 curved-button text-xs font-medium bg-white/90 backdrop-blur-sm ${
                            video.difficulty === 'debutant' ? 'text-green-700' :
                            video.difficulty === 'intermediaire' ? 'text-yellow-700' :
                            'text-red-700'
                          }`}>
                            {video.difficulty === 'debutant' ? 'Débutant' :
                             video.difficulty === 'intermediaire' ? 'Intermédiaire' :
                             'Avancé'}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          {/* Title */}
                          <h3 className="font-semibold text-accent-500 dark:text-accent-400 mb-3 line-clamp-2 group-hover:text-secondary-500 dark:group-hover:text-secondary-400 transition-colors">
                            {video.title}
                          </h3>

                          {/* Metadata Section */}
                          <div className="space-y-3 mb-4 text-sm">
                            {/* Muscle cible */}
                            {((video.targeted_muscles && video.targeted_muscles.length > 0) || (video.muscleGroups && video.muscleGroups.length > 0)) && (
                              <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Muscle cible: </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {video.targeted_muscles && video.targeted_muscles.length > 0
                                    ? (Array.isArray(video.targeted_muscles) ? video.targeted_muscles.join(', ') : video.targeted_muscles)
                                    : (Array.isArray(video.muscleGroups) ? video.muscleGroups.join(', ') : video.muscleGroups)}
                                </span>
                              </div>
                            )}

                            {/* Position départ */}
                            {video.startingPosition && (
                              <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Position départ: </span>
                                <span className="text-gray-600 dark:text-gray-400">{video.startingPosition}</span>
                              </div>
                            )}

                            {/* Mouvement */}
                            {video.movement && (
                              <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Mouvement: </span>
                                <span className="text-gray-600 dark:text-gray-400">{video.movement}</span>
                              </div>
                            )}

                            {/* Intensité et Série */}
                            <div className="flex flex-wrap gap-4">
                              {video.intensity && (
                                <div>
                                  <span className="font-semibold text-gray-700 dark:text-gray-300">Intensité: </span>
                                  <span className="text-gray-600 dark:text-gray-400">{formatIntensity(video.intensity)}</span>
                                </div>
                              )}
                              {video.series && (
                                <div>
                                  <span className="font-semibold text-gray-700 dark:text-gray-300">Série: </span>
                                  <span className="text-gray-600 dark:text-gray-400">{video.series}</span>
                                </div>
                              )}
                            </div>

                            {/* Contre-indication */}
                            {video.constraints && video.constraints !== "Aucune" && (
                              <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Contre-indication: </span>
                                <span className="text-gray-600 dark:text-gray-400">{video.constraints}</span>
                              </div>
                            )}
                            {(!video.constraints || video.constraints === "Aucune") && (
                              <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Contre-indication: </span>
                                <span className="text-gray-600 dark:text-gray-400">Aucune</span>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => handleVideoClick(video.id)}
                            className="w-full curved-button text-white font-semibold py-3 px-6 text-center block hover:shadow-floating transition-all flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#39334D' }}
                          >
                            <Play className="w-4 h-4" />
                            Regarder
                          </button>
                        </div>
                      </div>
                      
                      {/* Lock overlay for locked videos */}
                      {!isAccessible && (
                        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 cursor-not-allowed">
                          <div className="text-center text-white p-6 max-w-xs">
                            {/* Lock icon with animated background circle */}
                            <div className="relative mb-4">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 bg-white/20 rounded-full animate-pulse"></div>
                              </div>
                              <div className="relative">
                                <Lock className="w-16 h-16 mx-auto drop-shadow-lg" strokeWidth={2.5} />
                              </div>
                            </div>
                            
                            {/* Main message */}
                            <p className="text-lg font-bold mb-2 drop-shadow-md">Vidéo verrouillée</p>
                            
                            {/* Instruction message */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mt-3 border border-white/20">
                              <p className="text-sm leading-relaxed">
                                <span className="font-semibold">Complétez les vidéos précédentes</span>
                                <br />
                                <span className="text-xs opacity-90 mt-1 block">pour débloquer cette vidéo</span>
                              </p>
                            </div>
                            
                            {/* Visual indicator arrow */}
                            <div className="mt-4 flex items-center justify-center gap-2 text-xs opacity-75">
                              <ArrowUpLeft className="w-4 h-4" />
                              <span>Commencez par la première vidéo</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Completed badge */}
                      {isCompleted && isAccessible && (
                        <div className="absolute top-4 right-4 z-10 bg-green-500 text-white rounded-full p-2 shadow-lg">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        </ProtectedContent>
      </Section>
    )
  }

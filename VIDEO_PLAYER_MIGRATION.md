# Video Player Migration Guide

## Overview

This guide explains how to migrate from the old video player components to the new `UnifiedVideoPlayer` component that uses `@vidstack/react` for better mobile performance and scroll handling.

## Problems Solved

### 1. Mobile Scroll Conflicts
- **Before**: Fixed positioning caused scroll conflicts on mobile devices
- **After**: Proper touch event handling and viewport management prevents scroll interference

### 2. Video Fetching Issues
- **Before**: Simple redirects that could fail without proper error handling
- **After**: Robust error handling with fallback mechanisms and proper HTTP status codes

### 3. Performance Issues
- **Before**: Multiple video player components with duplicated functionality
- **After**: Single unified component with optimized mobile performance

## New UnifiedVideoPlayer Component

### Features
- ✅ Mobile-optimized touch handling
- ✅ Prevents scroll conflicts on mobile
- ✅ Better error handling and fallback mechanisms
- ✅ Consistent UI across all platforms
- ✅ TypeScript support
- ✅ Accessibility features built-in

### Installation

The required dependencies are already installed:
```bash
npm install @vidstack/react
```

## Usage Examples

### 1. Modal Video Player (Fullscreen)

```tsx
import UnifiedVideoPlayer from '@/components/video/UnifiedVideoPlayer'

function VideoModal({ video, onClose }) {
  return (
    <UnifiedVideoPlayer
      video={video}
      onClose={onClose}
      variant="modal"
      autoPlay={true}
      muted={false}
    />
  )
}
```

### 2. Mobile Video Player with Navigation

```tsx
import UnifiedVideoPlayer from '@/components/video/UnifiedVideoPlayer'

function MobileVideoFeed({ videos, currentIndex, onNext, onPrevious, onClose }) {
  const currentVideo = videos[currentIndex]
  
  return (
    <UnifiedVideoPlayer
      video={currentVideo}
      onClose={onClose}
      onNext={onNext}
      onPrevious={onPrevious}
      currentIndex={currentIndex}
      totalVideos={videos.length}
      variant="modal"
      autoPlay={true}
      muted={true} // Mobile auto-play requires muted
    />
  )
}
```

### 3. Inline Video Player

```tsx
import UnifiedVideoPlayer from '@/components/video/UnifiedVideoPlayer'

function VideoCard({ video }) {
  return (
    <div className="video-card">
      <UnifiedVideoPlayer
        video={video}
        variant="inline"
        autoPlay={false}
        muted={true}
        showDetails={true}
      />
    </div>
  )
}
```

## Migration Steps

### Step 1: Replace Old Components

Replace these old components:
- `VideoPlayer`
- `ComputerStreamPlayer`
- `SimpleVideoPlayer`
- `EnhancedVideoPlayer`
- `MobileVideoPlayer`
- `MobileStreamPlayer`
- `ListingPlayer`

With `UnifiedVideoPlayer`:

```tsx
// Before
import MobileVideoPlayer from '@/components/video/MobileVideoPlayer'

<MobileVideoPlayer
  video={video}
  onClose={onClose}
  onNext={onNext}
  onPrevious={onPrevious}
  currentIndex={index}
  totalVideos={videos.length}
  autoPlay={true}
  muted={true}
/>

// After
import UnifiedVideoPlayer from '@/components/video/UnifiedVideoPlayer'

<UnifiedVideoPlayer
  video={video}
  onClose={onClose}
  onNext={onNext}
  onPrevious={onPrevious}
  currentIndex={index}
  totalVideos={videos.length}
  variant="modal"
  autoPlay={true}
  muted={true}
/>
```

### Step 2: Update Props

The new component uses these props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `video` | `Video` | - | Video object with all metadata |
| `onClose` | `() => void` | - | Close handler |
| `onNext` | `() => void` | - | Next video handler |
| `onPrevious` | `() => void` | - | Previous video handler |
| `currentIndex` | `number` | `0` | Current video index |
| `totalVideos` | `number` | `1` | Total number of videos |
| `className` | `string` | `""` | Additional CSS classes |
| `autoPlay` | `boolean` | `false` | Auto-play video |
| `muted` | `boolean` | `false` | Mute video (required for mobile auto-play) |
| `variant` | `'modal' \| 'inline' \| 'fullscreen'` | `'modal'` | Display variant |
| `showDetails` | `boolean` | `true` | Show video details |

### Step 3: Handle Mobile-Specific Behavior

The new component automatically handles mobile optimizations:

- **Touch Events**: Prevents scroll conflicts
- **Viewport Management**: Locks body scroll when video is playing
- **Auto-mute**: Automatically mutes video on mobile for auto-play compliance
- **Touch-friendly Controls**: Larger touch targets for mobile

### Step 4: Update CSS

The component includes mobile-optimized CSS in `src/styles/video-player.css`:

```css
/* Mobile-specific optimizations */
@media (max-width: 768px) {
  media-player {
    width: 100vw !important;
    height: 100vh !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    z-index: 9999 !important;
  }
  
  body.video-playing {
    overflow: hidden !important;
    position: fixed !important;
    width: 100% !important;
    height: 100% !important;
  }
}
```

## Benefits

### Performance Improvements
- **Reduced Bundle Size**: Single component instead of 6+ components
- **Better Mobile Performance**: Optimized for mobile devices
- **Faster Loading**: Better video streaming with proper headers

### User Experience
- **No Scroll Conflicts**: Smooth scrolling on mobile
- **Better Touch Handling**: Responsive touch controls
- **Consistent UI**: Same experience across all devices
- **Better Error Handling**: Clear error messages and retry options

### Developer Experience
- **TypeScript Support**: Full type safety
- **Single API**: One component for all use cases
- **Better Debugging**: Improved error logging
- **Maintainable Code**: Single source of truth

## Testing

### Mobile Testing
1. Test on various mobile devices (iOS, Android)
2. Test different screen sizes
3. Test touch gestures and scrolling
4. Test video loading and error states

### Desktop Testing
1. Test all three variants (modal, inline, fullscreen)
2. Test keyboard controls
3. Test mouse interactions
4. Test video quality and performance

## Troubleshooting

### Common Issues

1. **Video not loading**
   - Check video ID is valid
   - Check video is published
   - Check network connection
   - Check browser console for errors

2. **Mobile scroll issues**
   - Ensure `variant="modal"` or `variant="fullscreen"` is used
   - Check that CSS is properly loaded
   - Verify touch events are not being prevented elsewhere

3. **Auto-play not working**
   - Ensure `muted={true}` on mobile
   - Check browser auto-play policies
   - Verify user interaction before auto-play

### Debug Mode

Enable debug logging by setting:
```tsx
<UnifiedVideoPlayer
  video={video}
  onPlay={() => console.log('Video started playing')}
  onPause={() => console.log('Video paused')}
  onError={(error) => console.error('Video error:', error)}
  // ... other props
/>
```

## Next Steps

1. **Replace all old video players** with `UnifiedVideoPlayer`
2. **Test thoroughly** on mobile and desktop
3. **Remove old components** once migration is complete
4. **Update documentation** to reflect new component usage
5. **Monitor performance** and user feedback

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify video URLs are accessible
3. Test with different video formats
4. Check mobile device compatibility

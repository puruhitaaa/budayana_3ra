import { useState, useRef, useEffect } from "react"

/**
 * Background music component with autoplay policy handling
 * Browsers block autoplay unless: user has interacted OR audio is muted
 * Strategy: Start muted, then unmute on first user interaction
 */
export default function BackgroundMusic() {
  const audioRef = useRef(null)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Set volume (0.0 - 1.0 range)
    audio.volume = 0.3

    // Try to play (may fail due to autoplay policy)
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay was blocked - will play after user interaction
        console.log("Autoplay blocked, waiting for user interaction")
      })
    }

    // Handle user interaction to enable audio
    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true)
        audio.muted = false
        audio.play().catch(() => {})
      }
    }

    // Listen for any user interaction
    document.addEventListener("click", handleInteraction)
    document.addEventListener("keydown", handleInteraction)
    document.addEventListener("touchstart", handleInteraction)

    return () => {
      document.removeEventListener("click", handleInteraction)
      document.removeEventListener("keydown", handleInteraction)
      document.removeEventListener("touchstart", handleInteraction)
    }
  }, [hasInteracted])

  return (
    <audio
      ref={audioRef}
      src='/assets/budayana/music/Into the Wild.mp3'
      loop
      muted
    />
  )
}

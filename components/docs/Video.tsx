'use client'

import { useEffect, useRef, useState } from 'react'

export function Video({
  src,
  caption,
}: {
  src: string
  caption?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
    }
  }, [])

  return (
    <figure className="duik-video">
      <video
        ref={ref}
        src={src}
        controls
        preload="metadata"
        playsInline
        style={{ width: '100%', borderRadius: 8, display: 'block' }}
        onClick={() => {
          const el = ref.current
          if (!el) return
          if (el.paused) void el.play()
          else el.pause()
        }}
      />
      {!playing && (
        <button
          type="button"
          aria-label="播放视频"
          className="duik-video-play"
          onClick={() => void ref.current?.play()}
        >
          ▶
        </button>
      )}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}

'use client'

import { useRef, useState } from 'react'
import { captionParts, requestVideoPlay, videoInfo } from './video-policy.mjs'
import videoChecks from './video-status.json'

type VideoProps = { src: string; caption?: string }

export function Video(props: VideoProps) {
  // A new document/source owns a fresh loading and error state.
  return <VideoPlayer key={props.src} {...props} />
}

function VideoPlayer({src, caption}: VideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const info = videoInfo(src, videoChecks.videos)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(info.unavailable)
  const fail = () => {setFailed(true); setPlaying(false)}

  return (
    <figure className="duik-video" data-video-state={failed ? 'unavailable' : playing ? 'playing' : 'ready'}>
      {failed ? <div className="duik-video-unavailable" role="status">
        <strong>这段官方视频暂时无法在本站播放</strong>
        <p>{info.unavailable ? '原视频地址已失效或限制访问。' : '视频加载失败，可能是网络问题或来源限制。'}
          {info.officialPage ? '请前往官方课程页查看，访问条件以官方为准。下方图文步骤仍可阅读。' : '你可以打开原地址检查，或重试加载。'}</p>
        <div className="duik-video-links">
          {info.officialPage && <a href={info.officialPage} target="_blank" rel="noopener noreferrer">前往官方课程 ↗</a>}
          {info.url && <button type="button" onClick={() => setFailed(false)}>重试原地址</button>}
        </div>
      </div> : <div className="duik-video-frame">
        <video ref={ref} src={info.url || undefined} controls preload="metadata" playsInline
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={fail} />
        {!playing && <button type="button" aria-label="播放视频" className="duik-video-play"
          onClick={() => void requestVideoPlay(ref.current, fail)}>播放视频</button>}
      </div>}
      <figcaption>
        {caption && <span>{captionParts(caption).map((part: {text: string; href?: string | null}, i: number) =>
          part.href ? <a key={i} href={part.href} target="_blank" rel="noopener noreferrer">{part.text}</a> : <span key={i}>{part.text}</span>)}</span>}
        {info.url && (failed ? <details className="duik-video-source"><summary>原地址与状态</summary><code>{info.url}</code><span>当前无法播放；可尝试上方的“重试原地址”。</span></details>
          : <a className="duik-video-original" href={info.url} target="_blank" rel="noopener noreferrer">原视频链接 ↗</a>)}
      </figcaption>
    </figure>
  )
}

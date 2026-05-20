// src/components/YouTubeEmbed.jsx
// Acepta URL completa o ID de YouTube y renderiza el embed
// Formatos soportados:
//   https://www.youtube.com/watch?v=ID
//   https://youtu.be/ID
//   https://www.youtube.com/embed/ID
//   Solo el ID: dQw4w9WgXcQ

import React, { useState } from 'react'
import { Play } from 'lucide-react'

function extractYouTubeId(url) {
  if (!url) return null
  // Si ya es solo el ID (11 chars alfanumérico)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim()
  // Extraer de URL
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export default function YouTubeEmbed({ url, title = 'Video de la propiedad' }) {
  const [playing, setPlaying] = useState(false)
  const videoId = extractYouTubeId(url)

  if (!videoId) return null

  const thumbUrl  = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  const embedUrl  = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`

  return (
    <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-900">
      {!playing ? (
        // Thumbnail con botón play
        <div className="relative aspect-video cursor-pointer group" onClick={() => setPlaying(true)}>
          <img
            src={thumbUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
          />
          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
          {/* Botón play */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center
              justify-center shadow-xl transition-all group-hover:scale-110">
              <Play size={28} className="text-white ml-1" fill="white" />
            </div>
          </div>
          {/* Label */}
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
            🎬 {title}
          </div>
        </div>
      ) : (
        // Iframe embed
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}
    </div>
  )
}

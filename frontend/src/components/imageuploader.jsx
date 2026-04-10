import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, Image, Loader2, AlertCircle, Star } from 'lucide-react'
import api from '../lib/api'

// ─── Single image preview ─────────────────────────────────────────────────────
function ImagePreview({ image, index, onRemove, onSetMain, isMain }) {
  return (
    <div className="relative group aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
      <img
        src={image.url}
        alt={`Foto ${index + 1}`}
        className="w-full h-full object-cover"
      />
      {/* Main badge */}
      {isMain && (
        <div className="absolute top-1.5 left-1.5 bg-amber-500 text-stone-900 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Star size={8} className="fill-stone-900" /> Principal
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {!isMain && (
          <button
            type="button"
            onClick={() => onSetMain(index)}
            className="w-7 h-7 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center hover:bg-amber-400 transition-colors"
            title="Establecer como principal"
          >
            <Star size={12} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-400 transition-colors"
          title="Eliminar"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── Drop zone ────────────────────────────────────────────────────────────────
function DropZone({ onFiles, disabled, maxReached }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled || maxReached) return
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) onFiles(files)
  }, [onFiles, disabled, maxReached])

  const handleChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length) onFiles(files)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!maxReached) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && !maxReached && inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
        ${dragging ? 'border-amber-400 bg-amber-50' : 'border-stone-200 hover:border-stone-300 bg-stone-50'}
        ${(disabled || maxReached) ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
        disabled={disabled || maxReached}
      />
      <Upload size={22} className={`mx-auto mb-2 ${dragging ? 'text-amber-500' : 'text-stone-400'}`} />
      <p className="text-sm font-medium text-stone-700">
        {maxReached ? 'Límite de fotos alcanzado' : 'Arrastra fotos aquí o haz click'}
      </p>
      <p className="text-xs text-stone-400 mt-1">JPG, PNG o WebP · Máx. 5MB por imagen</p>
    </div>
  )
}

// ─── Main ImageUploader component ─────────────────────────────────────────────
export default function ImageUploader({ value = [], onChange, maxImages = 10 }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  // value = [{ url, public_id }]  ← lo que se guarda en el form
  const images = value
  const mainIndex = 0  // La primera imagen siempre es la principal

  const uploadFiles = async (files) => {
    const remaining = maxImages - images.length
    const toUpload = files.slice(0, remaining)
    if (!toUpload.length) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      toUpload.forEach(f => formData.append('files', f))

      const { data } = await api.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const newImages = data.images.map(img => ({
        url: img.url,
        public_id: img.public_id,
      }))

      onChange([...images, ...newImages])
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al subir las imágenes. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (index) => {
    const img = images[index]
    // Eliminar de Cloudinary en segundo plano
    if (img.public_id) {
      api.delete(`/upload/image?public_id=${encodeURIComponent(img.public_id)}`).catch(() => {})
    }
    const updated = images.filter((_, i) => i !== index)
    onChange(updated)
  }

  const setMainImage = (index) => {
    // Mover la imagen seleccionada al inicio
    const updated = [...images]
    const [selected] = updated.splice(index, 1)
    updated.unshift(selected)
    onChange(updated)
  }

  const maxReached = images.length >= maxImages

  return (
    <div className="space-y-3">

      {/* Grid de previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, i) => (
            <ImagePreview
              key={img.public_id || img.url}
              image={img}
              index={i}
              onRemove={removeImage}
              onSetMain={setMainImage}
              isMain={i === mainIndex}
            />
          ))}

          {/* Slot de carga dentro del grid */}
          {uploading && (
            <div className="aspect-square rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center">
              <Loader2 size={20} className="text-amber-500 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Drop zone */}
      {!maxReached && (
        <DropZone
          onFiles={uploadFiles}
          disabled={uploading}
          maxReached={maxReached}
        />
      )}

      {/* Estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {uploading && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600">
              <Loader2 size={12} className="animate-spin" /> Subiendo…
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1.5 text-xs text-rose-600">
              <AlertCircle size={12} /> {error}
            </span>
          )}
        </div>
        <span className="text-xs text-stone-400">
          <span className={images.length >= maxImages ? 'text-amber-600 font-medium' : ''}>
            {images.length}
          </span>
          /{maxImages} fotos
        </span>
      </div>

      {images.length > 0 && (
        <p className="text-[11px] text-stone-400 flex items-center gap-1">
          <Star size={10} className="text-amber-400" />
          La primera imagen es la foto principal. Pasa el cursor sobre una foto para cambiarla.
        </p>
      )}
    </div>
  )
}
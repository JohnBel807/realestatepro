// src/components/ImageUploader.jsx
import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, AlertCircle, Star } from 'lucide-react'
import { uploadAPI } from '../lib/api'

function ImagePreview({ image, index, onRemove, onSetMain, isMain }) {
  return (
    <div className="relative group aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
      <img src={image.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
      {isMain && (
        <div className="absolute top-1.5 left-1.5 bg-amber-500 text-stone-900 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Star size={8} className="fill-stone-900" /> Principal
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {!isMain && (
          <button type="button" onClick={() => onSetMain(index)}
            className="w-7 h-7 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center hover:bg-amber-400"
            title="Foto principal">
            <Star size={12} />
          </button>
        )}
        <button type="button" onClick={() => onRemove(index)}
          className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-400"
          title="Eliminar">
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

export default function ImageUploader({ value = [], onChange, maxImages = 10 }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = useCallback(async (files) => {
    if (!files?.length) return
    const remaining = maxImages - value.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (!toUpload.length) return

    setUploading(true)
    setError(null)
    try {
      const { data } = await uploadAPI.uploadImages(toUpload)
      const newImages = data.images.map(img => ({ url: img.url, public_id: img.public_id }))
      onChange([...value, ...newImages])
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al subir. Verifica que las imágenes sean JPG/PNG menores a 5MB.')
    } finally {
      setUploading(false)
    }
  }, [value, onChange, maxImages])

  const removeImage = async (index) => {
    const img = value[index]
    if (img.public_id) {
      uploadAPI.deleteImage(img.public_id).catch(() => {})
    }
    onChange(value.filter((_, i) => i !== index))
  }

  const setMainImage = (index) => {
    const updated = [...value]
    const [selected] = updated.splice(index, 1)
    updated.unshift(selected)
    onChange(updated)
  }

  const maxReached = value.length >= maxImages

  return (
    <div className="space-y-3">
      {/* Grid de previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((img, i) => (
            <ImagePreview key={img.public_id || img.url || i}
              image={img} index={i}
              onRemove={removeImage} onSetMain={setMainImage}
              isMain={i === 0} />
          ))}
          {uploading && (
            <div className="aspect-square rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 flex items-center justify-center">
              <Loader2 size={20} className="text-amber-500 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Drop zone — siempre visible si no se alcanzó el máximo */}
      {!maxReached && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
            ${dragOver ? 'border-amber-400 bg-amber-50 scale-[1.01]' : 'border-stone-300 hover:border-amber-300 hover:bg-stone-50'}
            ${uploading ? 'opacity-60 cursor-wait' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
            disabled={uploading}
          />
          {uploading ? (
            <>
              <Loader2 size={28} className="mx-auto mb-2 text-amber-500 animate-spin" />
              <p className="text-sm font-medium text-stone-600">Subiendo imágenes…</p>
            </>
          ) : (
            <>
              <Upload size={28} className={`mx-auto mb-2 ${dragOver ? 'text-amber-500' : 'text-stone-400'}`} />
              <p className="text-sm font-medium text-stone-700">
                {dragOver ? '¡Suelta aquí!' : 'Arrastra fotos o haz click para seleccionar'}
              </p>
              <p className="text-xs text-stone-400 mt-1">JPG, PNG o WebP · Máx. 5MB · Hasta {maxImages} fotos</p>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2.5 rounded-lg">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Contador + hint */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-stone-400">
          {value.length > 0 && '★ Pasa el cursor sobre una foto para cambiar la principal o eliminarla'}
        </p>
        <span className="text-xs text-stone-400">
          <span className={value.length >= maxImages ? 'text-amber-600 font-medium' : ''}>{value.length}</span>
          /{maxImages}
        </span>
      </div>
    </div>
  )
}
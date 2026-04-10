// src/components/ImageUploader.jsx
// Upload DIRECTO al preset unsigned de Cloudinary desde el navegador.
// No pasa por el backend — elimina 100% el problema de firma.

import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, AlertCircle, Star } from 'lucide-react'

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'realestate_unsigned'
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_MB   = 5

async function uploadToCloudinary(file, folder = 'realestate-pro') {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)
  form.append('folder', folder)

  const res = await fetch(UPLOAD_URL, { method: 'POST', body: form })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error?.message || 'Error al subir imagen')
  }
  return { url: data.secure_url, public_id: data.public_id }
}

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
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [error, setError]           = useState(null)
  const [dragOver, setDragOver]     = useState(false)
  const inputRef                    = useRef(null)

  const handleFiles = useCallback(async (files) => {
    if (!files?.length) return

    // Validaciones locales
    const validFiles = Array.from(files).filter(f => {
      if (!ALLOWED.includes(f.type)) {
        setError(`"${f.name}" no es un formato válido. Usa JPG, PNG o WebP.`)
        return false
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`"${f.name}" supera los ${MAX_MB}MB.`)
        return false
      }
      return true
    })

    if (!validFiles.length) return

    const remaining = maxImages - value.length
    const toUpload  = validFiles.slice(0, remaining)

    if (!CLOUD_NAME) {
      setError('Falta configurar VITE_CLOUDINARY_CLOUD_NAME en el archivo .env')
      return
    }

    setUploading(true)
    setError(null)
    setProgress(0)

    const uploaded = []
    for (let i = 0; i < toUpload.length; i++) {
      try {
        const result = await uploadToCloudinary(toUpload[i])
        uploaded.push(result)
        setProgress(Math.round(((i + 1) / toUpload.length) * 100))
      } catch (err) {
        setError(err.message || 'Error al subir imagen')
        break
      }
    }

    if (uploaded.length > 0) {
      onChange([...value, ...uploaded])
    }
    setUploading(false)
    setProgress(0)
  }, [value, onChange, maxImages])

  const removeImage = (index) => {
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
              onRemove={removeImage}
              onSetMain={setMainImage}
              isMain={i === 0} />
          ))}
          {uploading && (
            <div className="aspect-square rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 flex flex-col items-center justify-center gap-1">
              <Loader2 size={18} className="text-amber-500 animate-spin" />
              {progress > 0 && (
                <span className="text-[10px] text-amber-600 font-medium">{progress}%</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Drop zone */}
      {!maxReached && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer select-none
            ${dragOver   ? 'border-amber-400 bg-amber-50 scale-[1.01]' : ''}
            ${!dragOver  ? 'border-stone-300 hover:border-amber-300 hover:bg-stone-50' : ''}
            ${uploading  ? 'opacity-60 cursor-wait' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
            disabled={uploading}
          />

          {uploading ? (
            <>
              <Loader2 size={28} className="mx-auto mb-2 text-amber-500 animate-spin" />
              <p className="text-sm font-medium text-stone-600">
                Subiendo{toUpload > 1 ? ` (${progress}%)` : '…'}
              </p>
              {/* Barra de progreso */}
              <div className="mt-3 mx-auto w-32 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <Upload size={28} className={`mx-auto mb-2 ${dragOver ? 'text-amber-500' : 'text-stone-400'}`} />
              <p className="text-sm font-medium text-stone-700">
                {dragOver ? '¡Suelta aquí!' : 'Arrastra fotos o haz click para seleccionar'}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                JPG, PNG o WebP · Máx. {MAX_MB}MB · Hasta {maxImages} fotos
              </p>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2.5 rounded-lg">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-stone-400">
          {value.length > 0 && 'Pasa el cursor sobre una foto para cambiar la principal o eliminarla'}
        </p>
        <span className="text-xs text-stone-400 shrink-0">
          <span className={value.length >= maxImages ? 'text-amber-600 font-medium' : ''}>
            {value.length}
          </span>/{maxImages}
        </span>
      </div>
    </div>
  )
}
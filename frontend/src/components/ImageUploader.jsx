import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, AlertCircle, Star } from 'lucide-react'

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'realestate_unsigned'

const ALLOWED      = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_MB       = 5
const MAX_BYTES    = MAX_MB * 1024 * 1024

async function uploadOne(file) {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)
  form.append('folder', 'realestate-pro')
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || 'Error Cloudinary')
  return { url: data.secure_url, public_id: data.public_id }
}

function ImagePreview({ image, index, onRemove, onSetMain, isMain }) {
  return (
    <div className="relative group aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
      <img src={image.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
      {isMain && (
        <span className="absolute top-1.5 left-1.5 bg-amber-500 text-stone-900 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Star size={8} className="fill-stone-900" /> Principal
        </span>
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
  const [progress,  setProgress]  = useState(0)
  const [error,     setError]     = useState(null)
  const [dragOver,  setDragOver]  = useState(false)
  const inputRef = useRef(null)

  const handleFiles = useCallback(async (fileList) => {
    if (!fileList || fileList.length === 0) return

    const files = Array.from(fileList)

    // Validar cada archivo
    for (const f of files) {
      if (!ALLOWED.includes(f.type)) {
        setError(`"${f.name}" no es válido. Usa JPG, PNG o WebP.`)
        return
      }
      if (f.size > MAX_BYTES) {
        setError(`"${f.name}" supera los ${MAX_MB}MB.`)
        return
      }
    }

    if (!CLOUD_NAME) {
      setError('Falta VITE_CLOUDINARY_CLOUD_NAME en las variables de entorno de Vercel.')
      return
    }

    const remaining = maxImages - value.length
    const batch     = files.slice(0, remaining)   // ← variable local, sin problema de scope

    setUploading(true)
    setError(null)
    setProgress(0)

    const results = []
    for (let i = 0; i < batch.length; i++) {
      try {
        const result = await uploadOne(batch[i])
        results.push(result)
        setProgress(Math.round(((i + 1) / batch.length) * 100))
      } catch (err) {
        setError(err.message)
        break
      }
    }

    if (results.length > 0) {
      onChange([...value, ...results])
    }
    setUploading(false)
    setProgress(0)
  }, [value, onChange, maxImages])

  const removeImage  = (i) => onChange(value.filter((_, idx) => idx !== i))
  const setMainImage = (i) => {
    const arr = [...value]
    const [sel] = arr.splice(i, 1)
    onChange([sel, ...arr])
  }

  const maxReached = value.length >= maxImages

  return (
    <div className="space-y-3">

      {/* Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((img, i) => (
            <ImagePreview key={img.public_id || img.url || i}
              image={img} index={i}
              onRemove={removeImage} onSetMain={setMainImage}
              isMain={i === 0} />
          ))}
          {uploading && (
            <div className="aspect-square rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 flex flex-col items-center justify-center gap-1">
              <Loader2 size={18} className="text-amber-500 animate-spin" />
              {progress > 0 && <span className="text-[10px] text-amber-600 font-medium">{progress}%</span>}
            </div>
          )}
        </div>
      )}

      {/* Drop zone */}
      {!maxReached && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => { if (!uploading) inputRef.current?.click() }}
          className={[
            'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer select-none',
            dragOver  ? 'border-amber-400 bg-amber-50'          : 'border-stone-300 hover:border-amber-300 hover:bg-stone-50',
            uploading ? 'opacity-60 cursor-wait pointer-events-none' : '',
          ].join(' ')}
        >
          <input ref={inputRef} type="file" multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
            disabled={uploading} />

          {uploading ? (
            <>
              <Loader2 size={28} className="mx-auto mb-2 text-amber-500 animate-spin" />
              <p className="text-sm font-medium text-stone-600">Subiendo imágenes…</p>
              <div className="mt-3 mx-auto w-32 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }} />
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
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 shrink-0">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Contador */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-stone-400">
          {value.length > 0 && 'Pasa el cursor sobre una foto para cambiarla o eliminarla'}
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
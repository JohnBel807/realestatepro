// src/components/SEOHead.jsx — Meta tags dinámicas para SEO regional
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const BASE_KW = [
  'fincas en Barbosa Santander',
  'fincas en venta Vélez',
  'lotes en Moniquirá',
  'casas en Puente Nacional',
  'fincas Ricaurte Boyacá',
  'lotes en Vélez Santander',
  'inmobiliaria Barbosa Santander',
  'propiedades en Landázuri',
  'fincas Cimitarra Santander',
  'casas Chiquinquirá Boyacá',
  'terrenos Vélez Santander',
  'arriendo finca Santander',
  'venta lote Boyacá',
  'finca raíz Vélez Ricaurte',
  'VelezyRicaurte inmobiliaria',
]

export default function SEOHead({ title, description, image, keywords = [] }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es'

  const finalTitle = title || t('seo.home_title')
  const finalDesc  = description || t('seo.home_desc')
  const finalKw    = [...BASE_KW, ...keywords].join(', ')
  const ogImage    = image || 'https://realestatepro-nine.vercel.app/og-image.jpg'
  const canonical  = typeof window !== 'undefined' ? window.location.href : ''

  useEffect(() => {
    document.title = finalTitle
    document.documentElement.lang = lang

    const setMeta = (name, content, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`
      let el = document.querySelector(sel)
      if (!el) {
        el = document.createElement('meta')
        prop ? el.setAttribute('property', name) : el.setAttribute('name', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', finalDesc)
    setMeta('keywords', finalKw)
    setMeta('author', 'VelezyRicaurte Inmobiliaria')
    setMeta('geo.region', 'CO-SAN')
    setMeta('geo.placename', 'Vélez, Santander, Colombia')
    setMeta('geo.position', '6.0072;-73.6753')
    setMeta('ICBM', '6.0072, -73.6753')
    setMeta('robots', 'index, follow')

    // Open Graph
    setMeta('og:title', finalTitle, true)
    setMeta('og:description', finalDesc, true)
    setMeta('og:type', 'website', true)
    setMeta('og:url', canonical, true)
    setMeta('og:image', ogImage, true)
    setMeta('og:locale', lang === 'es' ? 'es_CO' : 'en_US', true)
    setMeta('og:site_name', 'VelezyRicaurte Inmobiliaria', true)

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', finalTitle)
    setMeta('twitter:description', finalDesc)
    setMeta('twitter:image', ogImage)

    // Canonical
    let link = document.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', canonical)
  }, [finalTitle, finalDesc, finalKw, lang, canonical])

  return null
}

// Palabras clave por municipio para páginas de detalle
export const CITY_KEYWORDS = {
  barbosa:          ['fincas en Barbosa', 'lotes Barbosa Santander', 'casas Barbosa'],
  velez:            ['fincas en Vélez', 'lotes Vélez Santander', 'inmuebles Vélez'],
  moniquira:        ['fincas Moniquirá', 'casas Moniquirá Boyacá', 'lotes Moniquirá'],
  puente_nacional:  ['fincas Puente Nacional', 'casas Puente Nacional Santander'],
  landazuri:        ['fincas Landázuri', 'lotes Landázuri Santander'],
  cimitarra:        ['fincas Cimitarra', 'propiedades Cimitarra Santander'],
  chiquinquira:     ['casas Chiquinquirá', 'apartamentos Chiquinquirá Boyacá'],
  briceno:          ['fincas Briceño Boyacá', 'lotes Briceño'],
  chitaraque:       ['fincas Chitaraque', 'lotes Chitaraque Boyacá'],
}
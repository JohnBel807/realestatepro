// src/pages/LegalPage.jsx
// Páginas legales: Términos, Privacidad, Reembolsos, PQR
import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const EMPRESA  = "VelezyRicaurte Inmobiliaria"
const NIT      = "910.168.07-8"
const NOMBRE   = "Tecnoriente J.B."
const EMAIL    = "johnroa@velezyricaurte.com"
const TEL      = "+57 311 686 1370"
const WEB      = "www.velezyricaurte.com"
const REP      = "John Edinson Beltrán Roa"
const DIR      = "CR 7 17A 35, Barbosa, Santander"
const FECHA    = "10 de abril de 2026"

// ─── Componentes base ─────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-xl font-medium text-stone-900 mb-3 pb-2 border-b border-stone-200">
        {title}
      </h2>
      <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function Li({ children }) {
  return (
    <li className="flex gap-2">
      <span className="text-amber-600 shrink-0 mt-0.5">•</span>
      <span>{children}</span>
    </li>
  )
}

// ─── TÉRMINOS Y CONDICIONES ────────────────────────────────────────────────────
function Terminos() {
  return (
    <>
      <Section title="1. Identificación del titular">
        <p>El portal <strong>{WEB}</strong> es operado por <strong>{EMPRESA}</strong>, nombre comercial de <strong>{NOMBRE}</strong>, persona natural identificada con cédula de ciudadanía No. 91.016.807, NIT <strong>{NIT}</strong>, representada por <strong>{REP}</strong>, domiciliado en {DIR}, Colombia.</p>
        <p>Correo de contacto: <a href={`mailto:${EMAIL}`} className="text-amber-600 underline">{EMAIL}</a> · Teléfono: {TEL}</p>
      </Section>

      <Section title="2. Objeto y naturaleza del servicio">
        <p>{EMPRESA} es una plataforma digital de intermediación que facilita el encuentro entre propietarios de bienes inmuebles y potenciales compradores o arrendatarios en las provincias de Vélez (Santander) y Ricaurte (Boyacá).</p>
        <p>El portal actúa exclusivamente como directorio publicitario y canal de comunicación. <strong>NO actúa como agente inmobiliario</strong> ni interviene directamente en las transacciones entre usuarios.</p>
      </Section>

      <Section title="3. Aceptación de los términos">
        <p>El acceso y uso del portal implica la aceptación plena de los presentes Términos. Se rigen por:</p>
        <ul className="space-y-1 ml-2">
          <Li>Ley 527 de 1999 — Comercio electrónico</Li>
          <Li>Ley 1480 de 2011 — Estatuto del Consumidor</Li>
          <Li>Ley 1581 de 2012 — Protección de datos personales</Li>
        </ul>
      </Section>

      <Section title="4. Registro y cuenta de usuario">
        <p>Para publicar inmuebles, el usuario debe crear una cuenta con información veraz. Al registrarse declara:</p>
        <ul className="space-y-1 ml-2">
          <Li>Ser mayor de 18 años.</Li>
          <Li>Ser propietario del inmueble o tener autorización expresa del propietario.</Li>
          <Li>Que la información suministrada es veraz y no induce a error.</Li>
          <Li>Que los inmuebles no tienen impedimentos legales para su venta o arriendo.</Li>
        </ul>
      </Section>

      <Section title="5. Planes de suscripción y pagos">
        <p>El portal ofrece los siguientes planes de suscripción mensual:</p>
        <ul className="space-y-1 ml-2">
          <Li><strong>Plan Basic:</strong> $19.900 COP/mes — hasta 5 propiedades activas.</Li>
          <Li><strong>Plan Pro:</strong> $59.900 COP/mes — hasta 25 propiedades activas.</Li>
          <Li><strong>Plan Enterprise:</strong> $99.000 COP/mes — propiedades ilimitadas.</Li>
        </ul>
        <p>Los precios <strong>NO incluyen IVA</strong> dado que el titular opera bajo el régimen de No Responsable de IVA. Los pagos se procesan mediante <strong>Wompi</strong> (PSE, tarjetas, Nequi, Bancolombia).</p>
        <p>Los nuevos usuarios gozan de <strong>30 días de prueba gratuita</strong> sin necesidad de suministrar información de pago.</p>
      </Section>

      <Section title="6. Derecho de retracto (Art. 47 Ley 1480/2011)">
        <p>El usuario que haya adquirido un plan de pago tiene derecho a retractarse dentro de los <strong>5 días hábiles</strong> siguientes al primer cobro, enviando solicitud a <a href={`mailto:${EMAIL}`} className="text-amber-600 underline">{EMAIL}</a> con asunto "RETRACTO DE COMPRA".</p>
      </Section>

      <Section title="7. Prohibiciones">
        <p>Está prohibido publicar inmuebles sobre los que no se tenga derecho de disposición, información falsa, contenido que viole derechos de terceros, o inmuebles relacionados con actividades ilícitas. El incumplimiento genera suspensión inmediata sin reembolso.</p>
      </Section>

      <Section title="8. Responsabilidad">
        <p>{EMPRESA} NO es responsable de la veracidad de la información publicada por usuarios, del resultado de negociaciones, ni del estado jurídico o físico de los inmuebles. La responsabilidad máxima no excederá el valor del último mes de suscripción.</p>
      </Section>

      <Section title="9. Jurisdicción">
        <p>Las controversias se someterán a los jueces del círculo judicial de Vélez (Santander), Colombia.</p>
      </Section>
    </>
  )
}

// ─── POLÍTICA DE PRIVACIDAD ───────────────────────────────────────────────────
function Privacidad() {
  return (
    <>
      <Section title="1. Responsable del tratamiento">
        <p><strong>Nombre:</strong> {REP}</p>
        <p><strong>Nombre comercial:</strong> {NOMBRE} (portal: {EMPRESA})</p>
        <p><strong>NIT:</strong> {NIT}</p>
        <p><strong>Régimen:</strong> No Responsable de IVA — Persona Natural</p>
        <p><strong>Correo:</strong> <a href={`mailto:${EMAIL}`} className="text-amber-600 underline">{EMAIL}</a></p>
        <p><strong>Teléfono:</strong> {TEL}</p>
        <p><strong>Dirección:</strong> {DIR}</p>
      </Section>

      <Section title="2. Marco legal">
        <p>Esta política se rige por la Ley 1581 de 2012 y el Decreto 1377 de 2013.</p>
      </Section>

      <Section title="3. Datos recopilados">
        <p><strong>Datos de registro:</strong></p>
        <ul className="space-y-1 ml-2">
          <Li>Nombre completo, correo electrónico y teléfono</Li>
          <Li>Información de pago procesada por Wompi (el portal NO almacena datos de tarjetas)</Li>
        </ul>
        <p className="mt-2"><strong>Datos de navegación:</strong></p>
        <ul className="space-y-1 ml-2">
          <Li>Dirección IP, tipo de navegador y dispositivo</Li>
          <Li>Cookies técnicas y de preferencias</Li>
        </ul>
        <p className="mt-2">El portal <strong>NO recopila datos sensibles</strong> (salud, afiliación política, biometría).</p>
      </Section>

      <Section title="4. Finalidades del tratamiento">
        <ul className="space-y-1 ml-2">
          <Li>Gestionar la cuenta del usuario en la plataforma.</Li>
          <Li>Procesar pagos de suscripciones a través de Wompi.</Li>
          <Li>Enviar notificaciones relacionadas con la cuenta.</Li>
          <Li>Facilitar el contacto entre compradores y vendedores.</Li>
          <Li>Mejorar la experiencia mediante análisis estadísticos anónimos.</Li>
        </ul>
        <p>Los datos <strong>NO serán vendidos ni cedidos</strong> a terceros con fines comerciales.</p>
      </Section>

      <Section title="5. Derechos ARCO">
        <p>Tiene derecho a <strong>Acceder, Rectificar, Cancelar u Oponerse</strong> al tratamiento de sus datos enviando solicitud a <a href={`mailto:${EMAIL}`} className="text-amber-600 underline">{EMAIL}</a>. Respuesta en máx. 10 días hábiles.</p>
      </Section>

      <Section title="6. Terceros autorizados">
        <ul className="space-y-1 ml-2">
          <Li><strong>Wompi (Bancolombia):</strong> procesamiento de pagos.</Li>
          <Li><strong>Cloudinary:</strong> almacenamiento de imágenes.</Li>
          <Li><strong>Railway:</strong> infraestructura de servidor.</Li>
          <Li><strong>Autoridades judiciales:</strong> cuando sea requerido por ley.</Li>
        </ul>
      </Section>

      <Section title="7. Seguridad">
        <ul className="space-y-1 ml-2">
          <Li>Cifrado SSL/TLS en todas las comunicaciones.</Li>
          <Li>Contraseñas almacenadas con hash bcrypt (irreversible).</Li>
          <Li>Tokens de autenticación con expiración de 24 horas.</Li>
        </ul>
      </Section>
    </>
  )
}

// ─── POLÍTICA DE REEMBOLSOS ───────────────────────────────────────────────────
function Reembolsos() {
  return (
    <>
      <Section title="1. Derecho de retracto (Art. 47 Ley 1480/2011)">
        <p>El usuario tiene derecho a retractarse dentro de los <strong>5 días hábiles</strong> siguientes al primer cobro enviando correo a <a href={`mailto:${EMAIL}`} className="text-amber-600 underline">{EMAIL}</a> con asunto "RETRACTO DE COMPRA" e incluyendo nombre completo, correo registrado y fecha del cobro.</p>
        <p>El reembolso se procesa en máx. 30 días calendario por el mismo medio de pago.</p>
      </Section>

      <Section title="2. Excepciones al retracto">
        <ul className="space-y-1 ml-2">
          <Li>Cuando el usuario ha publicado 3 o más inmuebles durante el período.</Li>
          <Li>Cuando han transcurrido más de 5 días hábiles desde el cobro.</Li>
          <Li>Para renovaciones automáticas debidamente notificadas.</Li>
          <Li>Para el período de prueba gratuita de 30 días (no genera cobro).</Li>
        </ul>
      </Section>

      <Section title="3. Garantía de satisfacción — 7 días">
        <p>Para el <strong>primer pago</strong> de cualquier plan, ofrecemos voluntariamente una garantía de 7 días naturales de reembolso completo, independientemente del uso del servicio.</p>
      </Section>

      <Section title="4. Cancelación de suscripción">
        <ul className="space-y-1 ml-2">
          <Li>Puede cancelar desde Dashboard → Suscripción en cualquier momento.</Li>
          <Li>La cancelación aplica al final del período facturado en curso.</Li>
          <Li>Las propiedades se desactivan pero NO se eliminan — se reactivan al renovar.</Li>
        </ul>
      </Section>

      <Section title="5. Canal PQR">
        <p>Correo: <a href={`mailto:${EMAIL}`} className="text-amber-600 underline">{EMAIL}</a> (asunto: "PQR Facturación") · Respuesta en máx. <strong>15 días hábiles</strong>.</p>
        <p>Si no es satisfactoria puede acudir a la <strong>SIC</strong> en www.sic.gov.co.</p>
      </Section>
    </>
  )
}

// ─── CANAL PQR ────────────────────────────────────────────────────────────────
function PQR() {
  return (
    <>
      <Section title="Canales de atención">
        <ul className="space-y-1 ml-2">
          <Li>Correo: <a href={`mailto:${EMAIL}`} className="text-amber-600 underline">{EMAIL}</a> — respuesta en máx. 15 días hábiles</Li>
          <Li>WhatsApp: <a href={`https://wa.me/573116861370`} className="text-amber-600 underline">{TEL}</a> — atención L-V 8am–6pm</Li>
        </ul>
      </Section>

      <Section title="Tipos de solicitudes">
        <p><strong>Petición:</strong> solicitud de información sobre el servicio, cuenta o facturación.</p>
        <p><strong>Queja:</strong> inconformidad con la calidad del servicio o la atención recibida.</p>
        <p><strong>Reclamo:</strong> solicitud de reconocimiento de un derecho o corrección de un error.</p>
      </Section>

      <Section title="Información requerida">
        <ul className="space-y-1 ml-2">
          <Li>Nombre completo y correo electrónico registrado.</Li>
          <Li>Tipo de solicitud: Petición / Queja / Reclamo.</Li>
          <Li>Descripción detallada del motivo.</Li>
          <Li>Documentos de soporte (capturas, comprobantes).</Li>
          <Li>Solución esperada.</Li>
        </ul>
      </Section>

      <Section title="Tiempos de respuesta">
        <ul className="space-y-1 ml-2">
          <Li>Acuse de recibo: dentro de 24 horas hábiles.</Li>
          <Li>Respuesta de fondo: máx. 15 días hábiles.</Li>
          <Li>Casos complejos: hasta 30 días hábiles.</Li>
        </ul>
      </Section>

      <Section title="Escalamiento">
        <p>Si la respuesta no es satisfactoria puede acudir a la <strong>Superintendencia de Industria y Comercio (SIC)</strong> en <a href="https://www.sic.gov.co" target="_blank" rel="noreferrer" className="text-amber-600 underline">www.sic.gov.co</a>.</p>
      </Section>
    </>
  )
}

// ─── PÁGINAS CONFIG ───────────────────────────────────────────────────────────
const PAGES = {
  terminos:   { title: 'Términos y Condiciones de Uso',          component: Terminos },
  privacidad: { title: 'Política de Tratamiento de Datos Personales', component: Privacidad },
  reembolsos: { title: 'Política de Reembolsos y Derecho de Retracto', component: Reembolsos },
  pqr:        { title: 'Canal de Peticiones, Quejas y Reclamos (PQR)', component: PQR },
}

// ─── PAGE COMPONENT ───────────────────────────────────────────────────────────
export default function LegalPage() {
  const { slug } = useParams()
  const page = PAGES[slug]

  if (!page) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">📄</p>
        <h1 className="font-serif text-2xl mb-2">Página no encontrada</h1>
        <Link to="/" className="text-amber-600 underline text-sm">Volver al inicio</Link>
      </div>
    )
  }

  const Content = page.component

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-fade-up">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-stone-200">
        <p className="text-xs text-amber-600 font-medium uppercase tracking-wider mb-2">
          {EMPRESA}
        </p>
        <h1 className="font-serif text-3xl font-semibold text-stone-900 mb-2">
          {page.title}
        </h1>
        <p className="text-sm text-stone-400">
          Versión 1.0 · Vigente desde {FECHA} · NIT {NIT}
        </p>
      </div>

      {/* Contenido */}
      <Content />

      {/* Footer legal */}
      <div className="mt-10 pt-6 border-t border-stone-200">
        <p className="text-xs text-stone-400 mb-4">
          Última actualización: {FECHA} · {EMPRESA} · {NIT} · {DIR}
        </p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(PAGES).map(([key, p]) => (
            <Link key={key} to={`/legal/${key}`}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                slug === key
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'border-stone-200 text-stone-500 hover:border-stone-400'
              }`}>
              {p.title.split(' ').slice(0,2).join(' ')}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

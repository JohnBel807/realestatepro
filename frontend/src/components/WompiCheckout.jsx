// src/components/WompiCheckout.jsx
// Widget oficial de Wompi — soporta firma de integridad
// Docs: https://docs.wompi.co/docs/colombia/widget-checkout-colombia

import React, { useEffect, useRef } from 'react'

const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY || ''

export default function WompiCheckout({
  amount,        // en centavos COP
  reference,     // referencia única
  integrity,     // firma SHA256 del backend
  redirectUrl,   // URL de retorno
  onClose,       // callback al cerrar
}) {
  const formRef = useRef(null)

  useEffect(() => {
    // Cargar script de Wompi si no está cargado
    if (!document.querySelector('script[src*="wompi"]')) {
      const script = document.createElement('script')
      script.src = 'https://checkout.wompi.co/widget.js'
      script.setAttribute('data-render', 'button')
      document.head.appendChild(script)
    }
  }, [])

  // Wompi widget se activa automáticamente al renderizar el form
  return (
    <form
      ref={formRef}
      action="https://checkout.wompi.co/p/"
      method="GET"
      className="inline-block w-full"
    >
      <input type="hidden" name="public-key"        value={WOMPI_PUBLIC_KEY} />
      <input type="hidden" name="currency"           value="COP" />
      <input type="hidden" name="amount-in-cents"    value={amount} />
      <input type="hidden" name="reference"          value={reference} />
      {integrity && (
        <input type="hidden" name="signature:integrity" value={integrity} />
      )}
      {redirectUrl && (
        <input type="hidden" name="redirect-url"     value={redirectUrl} />
      )}

      <button
        type="submit"
        className="w-full py-3 text-sm font-semibold rounded-xl transition-all
          hover:brightness-110 active:scale-[0.98]"
        style={{ background: '#C4631A', color: '#fff' }}
      >
        Pagar con Wompi →
      </button>
    </form>
  )
}
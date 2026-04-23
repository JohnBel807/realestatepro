"""
email_service.py — Correos transaccionales
Soporta puerto 587 (STARTTLS) y 465 (SSL directo)
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text      import MIMEText

logger = logging.getLogger(__name__)

SMTP_HOST  = os.getenv("SMTP_HOST",  "smtp.zoho.com")
SMTP_PORT  = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER  = os.getenv("SMTP_USER",  "")
SMTP_PASS  = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM",
    "VelezyRicaurte Inmobiliaria <johnroa@velezyricaurte.com>")


def _send(to: str, subject: str, html: str) -> bool:
    if not SMTP_USER or not SMTP_PASS:
        logger.warning("SMTP no configurado — correo no enviado.")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = EMAIL_FROM
        msg["To"]      = to
        msg.attach(MIMEText(html, "html", "utf-8"))

        if SMTP_PORT == 465:
            # SSL directo — Zoho lo prefiere en este puerto
            import ssl
            ctx = ssl.create_default_context()
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT,
                                  context=ctx, timeout=15) as server:
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(SMTP_USER, to, msg.as_string())
        else:
            # STARTTLS para puerto 587
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(SMTP_USER, to, msg.as_string())

        logger.info(f"✅ Correo enviado a {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Error enviando correo a {to}: {e}")
        return False


def send_welcome_email(to_email: str, full_name: str) -> bool:
    first_name = full_name.split()[0] if full_name else "usuario"
    html = f"""
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Bienvenido a VelezyRicaurte</title></head>
<body style="margin:0;padding:0;background:#F5EFE6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE6;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">

        <tr>
          <td style="background:#1C1208;padding:28px 36px;text-align:center;">
            <p style="margin:0;font-family:Georgia,serif;font-size:26px;color:#F5EFE6;">
              <span style="color:#6B4E2A;">Velez</span><span style="color:#2D6B2A;">&amp;</span><span style="color:#C4631A;">Ricaurte</span>
            </p>
            <p style="margin:6px 0 0;font-size:12px;color:rgba(245,239,230,0.55);letter-spacing:.08em;text-transform:uppercase;">
              Ecosistema Digital Regional
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 36px 24px;text-align:center;">
            <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#1C1208;">
              ¡Hola, {first_name}! 🎉
            </h1>
            <p style="margin:0;font-size:15px;color:#6B6456;line-height:1.6;">
              Tu cuenta está lista. Tienes <strong style="color:#1C1208;">30 días gratis</strong>
              en los dos portales de la región.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 36px 28px;">
            <div style="background:linear-gradient(135deg,#2D6B2A,#3a8c35);border-radius:12px;
                        padding:16px 20px;text-align:center;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.8);text-transform:uppercase;">
                Tu período de prueba
              </p>
              <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#fff;">30 días gratis</p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.7);">
                Sin tarjeta · Válido en ambos portales
              </p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:0 36px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#F5EFE6;border-radius:12px;border:1.5px solid #E8E2D9;margin-bottom:12px;">
              <tr><td style="padding:18px 20px;">
                <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#1C1208;">🏡 Portal Inmobiliario</p>
                <p style="margin:0 0 6px;font-size:12px;color:#C4631A;font-weight:600;">velezyricaurte.com</p>
                <p style="margin:0 0 14px;font-size:13px;color:#6B6456;">
                  Fincas, casas, lotes y locales en Vélez y Ricaurte.
                </p>
                <a href="https://www.velezyricaurte.com/dashboard"
                  style="background:#6B4E2A;color:#fff;font-size:13px;font-weight:600;
                         padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
                  Ir al portal inmobiliario →
                </a>
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#FFF8F0;border-radius:12px;border:1.5px solid #FFE4CC;">
              <tr><td style="padding:18px 20px;">
                <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#1C1208;">🛒 Marketplace Regional</p>
                <p style="margin:0 0 6px;font-size:12px;color:#C4631A;font-weight:600;">velezyricaurte.info</p>
                <p style="margin:0 0 14px;font-size:13px;color:#6B6456;">
                  Vehículos, ganado, maquinaria, empleos y servicios.
                </p>
                <a href="https://www.velezyricaurte.info"
                  style="background:#C4631A;color:#fff;font-size:13px;font-weight:600;
                         padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
                  Ir al marketplace →
                </a>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 36px 32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#888;">¿Preguntas? Estamos aquí:</p>
            <a href="mailto:johnroa@velezyricaurte.com"
              style="color:#C4631A;font-size:13px;text-decoration:none;font-weight:600;display:block;margin-bottom:4px;">
              johnroa@velezyricaurte.com
            </a>
            <a href="https://wa.me/573116861370"
              style="color:#2D6B2A;font-size:13px;text-decoration:none;font-weight:600;">
              WhatsApp: +57 311 686 1370
            </a>
          </td>
        </tr>

        <tr>
          <td style="background:#F5EFE6;padding:20px 36px;text-align:center;border-top:1px solid #E8E2D9;">
            <p style="margin:0;font-size:11px;color:#AAA;line-height:1.6;">
              VelezyRicaurte Inmobiliaria · NIT 910.168.07-8 · Tecnoriente J.B.<br>
              CR 7 17A 35, Barbosa, Santander, Colombia
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""
    return _send(
        to_email,
        f"¡Bienvenido a VelezyRicaurte, {first_name}! 🎉 30 días gratis en ambos portales",
        html,
    )
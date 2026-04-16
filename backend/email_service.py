"""
email_service.py — Correos transaccionales HTML
Usa SMTP estándar (Gmail, Zoho, etc.) o cualquier proveedor.
Variables de entorno requeridas:
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text      import MIMEText

logger = logging.getLogger(__name__)

SMTP_HOST  = os.getenv("SMTP_HOST",  "smtp.gmail.com")
SMTP_PORT  = int(os.getenv("SMTP_PORT",  "587"))
SMTP_USER  = os.getenv("SMTP_USER",  "")
SMTP_PASS  = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "VelezyRicaurte Inmobiliaria <johnroa@velezyricaurte.com>")


def _send(to: str, subject: str, html: str) -> bool:
    """Envía un correo HTML. Retorna True si fue exitoso."""
    if not SMTP_USER or not SMTP_PASS:
        logger.warning("SMTP no configurado — correo no enviado.")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = EMAIL_FROM
        msg["To"]      = to
        msg.attach(MIMEText(html, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(EMAIL_FROM, to, msg.as_string())
        logger.info(f"Correo enviado a {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Error enviando correo a {to}: {e}")
        return False


def send_welcome_email(to_email: str, full_name: str) -> bool:
    """
    Correo de bienvenida con acceso a ambos portales
    y los 30 días de prueba gratuita.
    """
    first_name = full_name.split()[0] if full_name else "usuario"

    html = f"""
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a VelezyRicaurte</title>
</head>
<body style="margin:0;padding:0;background:#F5EFE6;font-family:Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE6;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1C1208;padding:28px 36px;text-align:center;">
            <p style="margin:0;font-family:Georgia,serif;font-size:26px;color:#F5EFE6;letter-spacing:-.3px;">
              <span style="color:#6B4E2A;">Velez</span><span style="color:#2D6B2A;">&amp;</span><span style="color:#C4631A;">Ricaurte</span>
            </p>
            <p style="margin:6px 0 0;font-size:12px;color:rgba(245,239,230,0.55);letter-spacing:.08em;text-transform:uppercase;">
              Ecosistema Digital Regional
            </p>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="padding:36px 36px 24px;text-align:center;">
            <div style="width:56px;height:56px;background:#F5EFE6;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:26px;">🎉</span>
            </div>
            <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#1C1208;font-weight:600;">
              ¡Hola, {first_name}!
            </h1>
            <p style="margin:0;font-size:15px;color:#6B6456;line-height:1.6;">
              Tu cuenta está lista. Tienes acceso a los<br>
              <strong style="color:#1C1208;">dos portales de la región</strong> con 30 días gratis.
            </p>
          </td>
        </tr>

        <!-- Trial badge -->
        <tr>
          <td style="padding:0 36px 28px;">
            <div style="background:linear-gradient(135deg,#2D6B2A,#3a8c35);border-radius:12px;padding:16px 20px;text-align:center;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:.08em;">
                Tu período de prueba
              </p>
              <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#ffffff;">
                30 días gratis
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.7);">
                Sin tarjeta de crédito · Válido en ambos portales
              </p>
            </div>
          </td>
        </tr>

        <!-- Portales -->
        <tr>
          <td style="padding:0 36px 28px;">
            <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.08em;">
              Tus dos portales
            </p>

            <!-- Portal .com -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#F5EFE6;border-radius:12px;border:1.5px solid #E8E2D9;margin-bottom:12px;">
              <tr>
                <td style="padding:18px 20px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:top;padding-right:14px;">
                        <div style="width:42px;height:42px;background:#6B4E2A;border-radius:10px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:42px;">
                          <span style="color:#fff;font-size:20px;">🏡</span>
                        </div>
                      </td>
                      <td style="vertical-align:top;">
                        <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#1C1208;">
                          Portal Inmobiliario
                        </p>
                        <p style="margin:0 0 6px;font-size:12px;color:#C4631A;font-weight:600;">
                          velezyricaurte.com
                        </p>
                        <p style="margin:0;font-size:13px;color:#6B6456;line-height:1.5;">
                          Publica y encuentra fincas, casas, lotes y locales en las provincias de Vélez y Ricaurte.
                        </p>
                      </td>
                    </tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                    <tr>
                      <td align="center">
                        <a href="https://www.velezyricaurte.com/dashboard"
                          style="display:inline-block;background:#6B4E2A;color:#fff;font-size:13px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;">
                          Ir al portal inmobiliario →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Portal .info -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#FFF8F0;border-radius:12px;border:1.5px solid #FFE4CC;">
              <tr>
                <td style="padding:18px 20px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:top;padding-right:14px;">
                        <div style="width:42px;height:42px;background:#C4631A;border-radius:10px;text-align:center;line-height:42px;">
                          <span style="color:#fff;font-size:20px;">🛒</span>
                        </div>
                      </td>
                      <td style="vertical-align:top;">
                        <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#1C1208;">
                          Marketplace Regional
                        </p>
                        <p style="margin:0 0 6px;font-size:12px;color:#C4631A;font-weight:600;">
                          velezyricaurte.info
                        </p>
                        <p style="margin:0;font-size:13px;color:#6B6456;line-height:1.5;">
                          Vehículos, ganado, maquinaria, empleos, servicios y todo lo que necesita la región.
                        </p>
                      </td>
                    </tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                    <tr>
                      <td align="center">
                        <a href="https://www.velezyricaurte.info"
                          style="display:inline-block;background:#C4631A;color:#fff;font-size:13px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;">
                          Ir al marketplace →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Pasos rápidos -->
        <tr>
          <td style="padding:0 36px 28px;">
            <div style="background:#F5EFE6;border-radius:12px;padding:20px;">
              <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.08em;">
                Empieza en 3 pasos
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:6px 0;">
                    <span style="display:inline-block;width:22px;height:22px;background:#C4631A;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#fff;margin-right:10px;vertical-align:middle;">1</span>
                    <span style="font-size:13px;color:#444;vertical-align:middle;">Inicia sesión con tu correo y contraseña</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <span style="display:inline-block;width:22px;height:22px;background:#C4631A;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#fff;margin-right:10px;vertical-align:middle;">2</span>
                    <span style="font-size:13px;color:#444;vertical-align:middle;">Publica tu primera propiedad o anuncio gratis</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <span style="display:inline-block;width:22px;height:22px;background:#C4631A;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#fff;margin-right:10px;vertical-align:middle;">3</span>
                    <span style="font-size:13px;color:#444;vertical-align:middle;">Comparte el anuncio en tus redes sociales</span>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- Contacto -->
        <tr>
          <td style="padding:0 36px 32px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;color:#888;">¿Tienes preguntas? Estamos aquí:</p>
            <p style="margin:0 0 4px;">
              <a href="mailto:johnroa@velezyricaurte.com"
                style="color:#C4631A;font-size:13px;text-decoration:none;font-weight:600;">
                johnroa@velezyricaurte.com
              </a>
            </p>
            <p style="margin:0;">
              <a href="https://wa.me/573116861370"
                style="color:#2D6B2A;font-size:13px;text-decoration:none;font-weight:600;">
                WhatsApp: +57 311 686 1370
              </a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F5EFE6;padding:20px 36px;text-align:center;border-top:1px solid #E8E2D9;">
            <p style="margin:0;font-size:11px;color:#AAA;line-height:1.6;">
              VelezyRicaurte Inmobiliaria · NIT 910.168.07-8 · Tecnoriente J.B.<br>
              CR 7 17A 35, Barbosa, Santander, Colombia<br>
              <a href="https://www.velezyricaurte.com/legal/privacidad"
                style="color:#BBB;text-decoration:underline;">Política de privacidad</a>
              &nbsp;·&nbsp;
              <a href="https://www.velezyricaurte.com/legal/terminos"
                style="color:#BBB;text-decoration:underline;">Términos y condiciones</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""
    return _send(
        to_email,
        f"¡Bienvenido a VelezyRicaurte, {first_name}! 🎉 30 días gratis en ambos portales",
        html,
    )
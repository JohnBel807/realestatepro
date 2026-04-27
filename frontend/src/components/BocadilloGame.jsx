/**
 * BocadilloGame.jsx — Maestro Bocadillero: El Legado de Vélez
 * Motor: Phaser.js 3.60 (cargado dinámicamente desde CDN)
 * Gameplay: Tritura → Temperatura/Paila → Empaca → Mercado
 *
 * Props:
 *   portalOrigin  "com" | "info"
 *   serverUrl     string  — URL backend para guardar scores
 *   onClose       () => void
 */

import React, { useEffect, useRef, useState } from 'react'

const PORTAL_CFG = {
  com:  { accent: 0x6B4E2A, accentHex: '#6B4E2A', name: 'VelezyRicaurte Inmobiliaria' },
  info: { accent: 0xC4631A, accentHex: '#C4631A', name: 'VelezyRicaurte Marketplace'  },
}

const W = 640, H = 480
const TIERRA  = 0x6B4E2A
const NARANJA = 0xC4631A
const VERDE   = 0x2D6B2A
const GOLD    = 0xD4A017
const RED     = 0xE24B4A

// ─── Helpers gráficos (usados en todas las escenas) ───────────────────────────
function drawGuayaba(g, x, y, r = 70, col = 0xE8613C) {
  g.clear()
  g.fillStyle(col, 1);       g.fillCircle(x, y, r)
  g.fillStyle(0x8B2000, .3); g.fillCircle(x + r * .2, y + r * .2, r * .6)
  g.fillStyle(VERDE, 1);     g.fillEllipse(x, y - r + 6, 16, 22)
}

function drawBocadillo(g, x, y, col = TIERRA) {
  g.clear()
  g.fillStyle(col, 1);       g.fillRoundedRect(x - 24, y - 14, 48, 28, 6)
  g.fillStyle(0xffffff, .18); g.fillRoundedRect(x - 20, y - 12, 40, 10, 4)
  g.lineStyle(1, 0x000000, .2); g.strokeRoundedRect(x - 24, y - 14, 48, 28, 6)
}

function drawStepBar(scene, activeStep) {
  const labels = ['Tritura', 'Paila', 'Empaca', 'Mercado']
  labels.forEach((l, i) => {
    const x = 80 + i * (W - 160) / 3, y = H - 168
    const done = i < activeStep - 1, cur = i === activeStep - 1
    scene.add.circle(x, y, 10, done || cur ? TIERRA : 0x3d2b1f)
    scene.add.text(x, y, done ? '✓' : String(i + 1), {
      fontSize: '10px', color: '#fff', fontFamily: 'system-ui'
    }).setOrigin(.5)
    scene.add.text(x, y + 16, l, {
      fontSize: '9px', color: cur ? '#C4631A' : '#6b7280', fontFamily: 'system-ui'
    }).setOrigin(.5)
    if (i < 3) {
      const lx = x + 12, rx = 80 + (i + 1) * (W - 160) / 3 - 12
      scene.add.rectangle((lx + rx) / 2, y, rx - lx, 2, done ? TIERRA : 0x2a1f10)
    }
  })
}

function drawMesa(scene) {
  scene.add.rectangle(W / 2, H - 60, W, 120, 0x3d2b1f)
  scene.add.rectangle(W / 2, H - 110, W, 6, 0x5a3f20)
}

function genOrders(rep) {
  const pool = [
    { client: 'Tienda El Cacique',      qty: 6,  price: 4500, days: 3 },
    { client: 'Mercado de Vélez',        qty: 10, price: 4000, days: 4 },
    { client: 'Festival del Bocadillo',  qty: 18, price: 3900, days: 5 },
    { client: 'Abuela Rosa',             qty: 3,  price: 5200, days: 2 },
    { client: 'Hotel Puente Nacional',   qty: 12, price: 4300, days: 4 },
    { client: 'Turistas Santander',      qty: 5,  price: 5500, days: 2 },
    { client: 'Cooperativa Moniquirá',   qty: 15, price: 3800, days: 5 },
  ]
  const n = Math.min(2 + Math.floor(rep / 2), 4)
  return [...pool].sort(() => Math.random() - .5).slice(0, n)
    .map(o => ({ ...o, daysLeft: o.days, id: Math.random().toString(36).slice(2) }))
}

// ─── ESCENAS PHASER ───────────────────────────────────────────────────────────

function makeBootScene(cfg) {
  return class BootScene extends window.Phaser.Scene {
    constructor() { super('Boot') }
    create() {
      this.add.rectangle(W / 2, H / 2, W, H, 0x1a0f05)
      // Logo decorativo
      const logo = this.add.text(W / 2, H / 2 - 80, '🍬', { fontSize: '56px' }).setOrigin(.5)
      this.tweens.add({ targets: logo, y: H / 2 - 92, duration: 1400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
      // Partículas decorativas
      const particles = this.add.particles(0, 0, '', {
        x: { min: 80, max: W - 80 }, y: { min: 60, max: H - 120 },
        tint: [TIERRA, NARANJA, 0xD4A017], lifespan: 3000,
        speedX: { min: -20, max: 20 }, speedY: { min: -30, max: -10 },
        scale: { start: .3, end: 0 }, alpha: { start: .6, end: 0 },
        quantity: 1, frequency: 400,
      })
      // Textos
      this.add.text(W / 2, H / 2 - 16, 'Maestro Bocadillero', {
        fontSize: '26px', color: '#F5EFE6', fontFamily: 'Georgia,serif', fontStyle: 'bold'
      }).setOrigin(.5)
      this.add.text(W / 2, H / 2 + 16, 'El Legado de Vélez, Santander', {
        fontSize: '13px', color: '#C4631A', fontFamily: 'Georgia,serif', fontStyle: 'italic'
      }).setOrigin(.5)
      this.add.text(W / 2, H / 2 + 40, 'Hereda la fábrica familiar de bocadillo', {
        fontSize: '12px', color: '#6b7280', fontFamily: 'system-ui'
      }).setOrigin(.5)
      // Descripción mecánicas
      const mecanicas = [['👆 Tritura', 80], ['🌡 Temperatura', W / 2], ['📦 Empaca', W - 80]]
      mecanicas.forEach(([txt, x]) => {
        const card = this.add.rectangle(x, H / 2 + 105, 150, 42, 0x2a1f10)
        this.add.text(x, H / 2 + 105, txt, { fontSize: '12px', color: '#F5EFE6', fontFamily: 'system-ui' }).setOrigin(.5)
      })
      // Botón
      const btn = this.add.rectangle(W / 2, H / 2 + 165, 210, 46, cfg.accent).setInteractive({ useHandCursor: true })
      this.add.text(W / 2, H / 2 + 165, 'Comenzar legado →', {
        fontSize: '14px', color: '#fff', fontFamily: 'system-ui'
      }).setOrigin(.5)
      btn.on('pointerover', () => btn.setFillStyle(0x5a3f20))
      btn.on('pointerout',  () => btn.setFillStyle(cfg.accent))
      btn.on('pointerdown', () => {
        this.tweens.add({ targets: btn, scaleX: .96, scaleY: .96, duration: 80, yoyo: true,
          onComplete: () => this.scene.start('Tritura', { money: 15000, day: 1, rep: 1, stock: 0, fulfilled: 0 })
        })
      })
    }
  }
}

function makeTrituraScene() {
  return class TrituraScene extends window.Phaser.Scene {
    constructor() { super('Tritura') }
    init(data) { this.gameData = data || { money: 15000, day: 1, rep: 1, stock: 0, fulfilled: 0 } }
    create() {
      this.clicks = 0; this.needed = 28
      this.add.rectangle(W / 2, H / 2, W, H, 0x1a0f05)
      drawMesa(this)
      drawStepBar(this, 1)
      this.add.text(W / 2, 28, '1 — Tritura la guayaba', {
        fontSize: '13px', color: '#9ca3af', fontFamily: 'system-ui'
      }).setOrigin(.5)
      this.add.text(W / 2, 52, 'Día ' + this.gameData.day, {
        fontSize: '11px', color: '#C4631A', fontFamily: 'system-ui'
      }).setOrigin(.5)
      // Guayaba
      this.frutaG = this.add.graphics()
      drawGuayaba(this.frutaG, W / 2, H / 2 - 40, 68)
      this.brilloG = this.add.graphics()
      this.brilloG.fillStyle(0xffffff, .25)
      this.brilloG.fillEllipse(W / 2 - 20, H / 2 - 68, 28, 16)
      // Cracks container
      this.cracksG = this.add.graphics()
      // Partículas jugo
      this.jugoParticles = this.add.particles(0, 0, '', {
        x: { min: W / 2 - 35, max: W / 2 + 35 },
        y: { min: H / 2 - 50, max: H / 2 },
        lifespan: 500, speedY: { min: -90, max: -30 }, speedX: { min: -50, max: 50 },
        scale: { start: .55, end: 0 }, tint: [0xE8613C, 0xC4631A, 0xff7043],
        quantity: 0, emitting: false,
      })
      // Barra progreso
      this.add.rectangle(W / 2, H - 130, 320, 14, 0x2a1f10).setOrigin(.5)
      this.barFill = this.add.rectangle(W / 2 - 160, H - 130, 0, 14, NARANJA).setOrigin(0, .5)
      this.progTxt = this.add.text(W / 2, H - 108, '0 / ' + this.needed + ' golpes', {
        fontSize: '11px', color: '#9ca3af', fontFamily: 'system-ui'
      }).setOrigin(.5)
      // Hint animado
      const hint = this.add.text(W / 2, H / 2 + 45, '¡Golpea la fruta!', {
        fontSize: '13px', color: '#9ca3af', fontFamily: 'system-ui'
      }).setOrigin(.5)
      this.tweens.add({ targets: hint, alpha: 0, duration: 800, yoyo: true, repeat: -1, ease: 'Sine' })
      // Zona interactiva
      const hit = this.add.rectangle(W / 2, H / 2 - 40, 160, 160, 0, 0).setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => this.golpear())
    }
    golpear() {
      this.clicks++
      const pct = this.clicks / this.needed
      this.tweens.add({ targets: this.barFill, width: 320 * pct, duration: 90, ease: 'Power2' })
      this.progTxt.setText(this.clicks + ' / ' + this.needed + ' golpes')
      this.jugoParticles.emitParticleAt(W / 2, H / 2 - 20, 7)
      // Shake con tween
      const ox = this.frutaG.x, oy = this.frutaG.y
      this.tweens.add({
        targets: [this.frutaG, this.brilloG],
        x: ox + Phaser.Math.Between(-9, 9), y: oy + Phaser.Math.Between(-6, 6),
        duration: 55, ease: 'Power1', yoyo: true,
        onComplete: () => { this.frutaG.x = ox; this.frutaG.y = oy; this.brilloG.x = ox; this.brilloG.y = oy }
      })
      // Crack cada 4 clicks
      if (this.clicks % 4 === 0) {
        const angle = Math.random() * Math.PI * 2
        const r = 20 + Math.random() * 35
        this.cracksG.lineStyle(1, 0x7B1500, .65)
        this.cracksG.beginPath()
        this.cracksG.moveTo(W / 2 + Math.cos(angle) * 8, H / 2 - 40 + Math.sin(angle) * 8)
        this.cracksG.lineTo(W / 2 + Math.cos(angle) * r, H / 2 - 40 + Math.sin(angle) * r)
        this.cracksG.strokePath()
      }
      // Oscurecer fruta según progreso
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xE8613C),
        Phaser.Display.Color.ValueToColor(0x7B1500),
        100, Math.round(pct * 100)
      )
      drawGuayaba(this.frutaG, W / 2, H / 2 - 40, 68, Phaser.Display.Color.GetColor(c.r, c.g, c.b))
      if (this.clicks >= this.needed) this.completar()
    }
    completar() {
      this.input.enabled = false
      const flash = this.add.rectangle(W / 2, H / 2, W, H, VERDE, 0)
      this.add.text(W / 2, H / 2 + 80, '¡Fruta lista para la paila!', {
        fontSize: '16px', color: '#fff', fontFamily: 'Georgia,serif'
      }).setOrigin(.5)
      this.tweens.add({
        targets: flash, alpha: .45, duration: 200, yoyo: true,
        onComplete: () => this.scene.start('Paila', this.gameData)
      })
    }
  }
}

function makePailaScene() {
  return class PailaScene extends window.Phaser.Scene {
    constructor() { super('Paila') }
    init(data) { this.gameData = data || { money: 15000, day: 1, rep: 1, stock: 0, fulfilled: 0 } }
    create() {
      this.temp = 45; this.coccion = 0; this.tiempo = 22; this.dirMul = 1; this.active = true
      this.add.rectangle(W / 2, H / 2, W, H, 0x1a0f05)
      drawMesa(this)
      drawStepBar(this, 2)
      this.add.text(W / 2, 28, '2 — Controla la temperatura', {
        fontSize: '13px', color: '#9ca3af', fontFamily: 'system-ui'
      }).setOrigin(.5)
      const px = W / 2, py = H / 2 + 15
      // Sombra paila
      this.add.graphics().fillStyle(0x000000, .25).fillEllipse(px, py + 92, 200, 28)
      // Paila gráfico
      this.pailaG = this.add.graphics()
      this.dibujarPaila(px, py)
      // Fuego
      this.fuegoG = this.add.graphics()
      // Vapor partículas
      this.vapor = this.add.particles(0, 0, '', {
        x: { min: px - 45, max: px + 45 }, y: py - 18,
        lifespan: 1400, speedY: { min: -70, max: -30 }, speedX: { min: -18, max: 18 },
        scale: { start: .65, end: 0 }, alpha: { start: .55, end: 0 },
        tint: [0xcccccc, 0xbbbbbb, 0xffffff], quantity: 0, emitting: false,
      })
      this.vaporTimer = 0
      // Termómetro
      const tx = W - 70, ty = H / 2 + 5, th = 150
      this.add.rectangle(tx, ty, 26, th, 0x2a1f10).setOrigin(.5)
      this.add.circle(tx, ty + th / 2 + 12, 20, 0x2a1f10)
      this.add.circle(tx, ty + th / 2 + 12, 14, RED)
      this.tempFillG = this.add.graphics()
      // Zona ideal markers
      const zoneTop = ty - th / 2 + (100 - 80) / 70 * th
      const zoneBot = ty - th / 2 + (100 - 65) / 70 * th
      this.add.rectangle(tx, (zoneTop + zoneBot) / 2, 30, zoneBot - zoneTop, VERDE, .12)
      this.add.rectangle(tx, zoneTop, 34, 2, VERDE, .7)
      this.add.rectangle(tx, zoneBot, 34, 2, VERDE, .7)
      this.add.text(tx + 20, zoneTop, '80°', { fontSize: '9px', color: '#2D6B2A', fontFamily: 'system-ui' }).setOrigin(0, .5)
      this.add.text(tx + 20, zoneBot, '65°', { fontSize: '9px', color: '#2D6B2A', fontFamily: 'system-ui' }).setOrigin(0, .5)
      this.add.text(tx + 20, ty - th / 2, '100°', { fontSize: '9px', color: '#6b7280', fontFamily: 'system-ui' }).setOrigin(0, .5)
      this.add.text(tx + 20, ty + th / 2, '30°', { fontSize: '9px', color: '#6b7280', fontFamily: 'system-ui' }).setOrigin(0, 1)
      // Store refs para update
      this._tx = tx; this._ty = ty; this._th = th
      // Temperatura texto
      this.tempTxt = this.add.text(px, py - 80, '45°C', {
        fontSize: '34px', color: '#C4631A', fontFamily: 'Georgia,serif', fontStyle: 'bold'
      }).setOrigin(.5)
      this.zonaTxt = this.add.text(px, py - 46, 'Muy frío — sube el fuego', {
        fontSize: '12px', color: '#C4631A', fontFamily: 'system-ui'
      }).setOrigin(.5)
      // Barra cocción
      this.add.rectangle(W / 2, H - 130, 300, 12, 0x2a1f10).setOrigin(.5)
      this.coccionBar = this.add.rectangle(W / 2 - 150, H - 130, 0, 12, VERDE, 1).setOrigin(0, .5)
      this.add.text(W / 2, H - 112, 'Cocción', { fontSize: '10px', color: '#6b7280', fontFamily: 'system-ui' }).setOrigin(.5)
      // Tiempo
      this.tiempoTxt = this.add.text(40, H - 130, '22s', { fontSize: '13px', color: '#9ca3af', fontFamily: 'system-ui' }).setOrigin(0, .5)
      // Botones
      this.crearBotones(px, py)
    }
    crearBotones(px, py) {
      const btnDn = this.add.rectangle(px - 80, H - 60, 140, 40, 0x2a1f10).setInteractive({ useHandCursor: true })
      this.add.text(px - 80, H - 60, '🔽  Bajar', { fontSize: '13px', color: '#fff', fontFamily: 'system-ui' }).setOrigin(.5)
      const btnUp = this.add.rectangle(px + 80, H - 60, 140, 40, TIERRA).setInteractive({ useHandCursor: true })
      this.add.text(px + 80, H - 60, '🔼  Subir', { fontSize: '13px', color: '#fff', fontFamily: 'system-ui' }).setOrigin(.5)
      btnDn.on('pointerdown', () => { this.dirMul = Math.max(.3, this.dirMul * .65); this.temp -= 6 })
      btnUp.on('pointerdown', () => { this.dirMul = Math.min(2.5, this.dirMul * 1.4); this.temp += 6 })
      btnDn.on('pointerover', () => btnDn.setFillStyle(0x1a0f05))
      btnDn.on('pointerout', () => btnDn.setFillStyle(0x2a1f10))
      btnUp.on('pointerover', () => btnUp.setFillStyle(0x5a3f20))
      btnUp.on('pointerout', () => btnUp.setFillStyle(TIERRA))
    }
    dibujarPaila(x, y) {
      const g = this.pailaG; g.clear()
      // Asas
      g.lineStyle(9, 0x5a3f20, 1)
      g.beginPath(); g.arc(x - 86, y + 22, 18, Math.PI * .5, Math.PI * 1.5, true); g.strokePath()
      g.beginPath(); g.arc(x + 86, y + 22, 18, Math.PI * 1.5, Math.PI * .5, true); g.strokePath()
      // Cuerpo
      g.fillStyle(0x4a3520, 1); g.fillEllipse(x, y + 82, 198, 38)
      g.fillStyle(0x4a3520, 1); g.fillRect(x - 99, y + 2, 198, 80)
      g.fillStyle(0x5a4030, 1); g.fillRect(x - 99, y + 2, 198, 7)
      // Contenido — pulpa oscilante según cocción
      const pulpaCol = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xE8613C),
        Phaser.Display.Color.ValueToColor(0x8B2000),
        100, Math.round(this.coccion)
      )
      g.fillStyle(Phaser.Display.Color.GetColor(pulpaCol.r, pulpaCol.g, pulpaCol.b), .9)
      g.fillEllipse(x, y + 8, 190, 28)
      // Brillo metálico
      g.lineStyle(2, 0x8B7355, .4)
      g.strokeEllipse(x, y + 82, 198, 38)
      g.strokeRect(x - 99, y + 2, 198, 80)
    }
    dibujarFuego(x, y, intensity) {
      const g = this.fuegoG; g.clear()
      if (intensity < .05) return
      const colors = [0xff4500, 0xff6600, 0xff8800, 0xffaa00]
      for (let i = 0; i < 5; i++) {
        const fx = x + Phaser.Math.Between(-25, 25)
        const h = (20 + Math.random() * 20) * intensity
        g.fillStyle(colors[Math.floor(Math.random() * colors.length)], .7 * intensity)
        g.fillTriangle(fx, y, fx - 10 * intensity, y + h, fx + 10 * intensity, y + h)
      }
    }
    dibujarTermometro() {
      const { _tx: tx, _ty: ty, _th: th } = this
      this.tempFillG.clear()
      const pct = Phaser.Math.Clamp((this.temp - 30) / 70, 0, 1)
      const fillH = pct * th
      const col = this.temp >= 65 && this.temp <= 80 ? VERDE : this.temp > 80 ? RED : NARANJA
      this.tempFillG.fillStyle(col, 1)
      this.tempFillG.fillRect(tx - 8, ty + th / 2 - fillH, 16, fillH)
      this.tempFillG.fillCircle(tx, ty + th / 2 + 12, 12)
    }
    update(t, dt) {
      if (!this.active) return
      this.tiempo = Math.max(0, this.tiempo - dt / 1000)
      this.tiempoTxt.setText(Math.round(this.tiempo) + 's')
      // Oscilación natural
      const delta = (1.4 + Math.random() * .7) * this.dirMul
      this.temp += this.temp > 65 ? delta : delta * 1.2
      if (this.temp >= 98) this.dirMul = -Math.abs(this.dirMul)
      if (this.temp <= 32) this.dirMul = Math.abs(this.dirMul)
      this.temp = Phaser.Math.Clamp(this.temp, 30, 100)
      const inZone = this.temp >= 65 && this.temp <= 80
      // Cocción
      if (inZone)          this.coccion = Math.min(100, this.coccion + 1.6)
      else if (this.temp > 80) this.coccion = Math.max(0, this.coccion - .7)
      else                 this.coccion = Math.max(0, this.coccion - .25)
      // Vapor
      this.vaporTimer += dt
      if (this.vaporTimer > 130) {
        this.vaporTimer = 0
        const qty = inZone ? 4 : this.temp > 80 ? 9 : 1
        this.vapor.emitParticleAt(W / 2, H / 2 - 5, qty)
      }
      // Visuals
      const col = inZone ? '#2D6B2A' : this.temp > 80 ? '#E24B4A' : '#C4631A'
      this.tempTxt.setText(Math.round(this.temp) + '°C').setColor(col)
      this.zonaTxt.setText(inZone ? '¡Zona perfecta!' : this.temp > 80 ? 'Demasiado caliente' : 'Muy frío').setColor(col)
      this.tweens.add({ targets: this.coccionBar, width: this.coccion * 3, duration: 80, ease: 'Power1' })
      this.dibujarPaila(W / 2, H / 2 + 15)
      this.dibujarFuego(W / 2, H / 2 + 110, Phaser.Math.Clamp((this.temp - 30) / 70, 0, 1))
      this.dibujarTermometro()
      // Condiciones fin
      if (this.coccion >= 100) {
        this.active = false
        const flash = this.add.rectangle(W / 2, H / 2, W, H, VERDE, 0)
        this.add.text(W / 2, H / 2, '¡Cocción perfecta!', {
          fontSize: '20px', color: '#fff', fontFamily: 'Georgia,serif'
        }).setOrigin(.5)
        this.tweens.add({ targets: flash, alpha: .5, duration: 250, yoyo: true,
          onComplete: () => this.scene.start('Empaque', this.gameData) })
      }
      if (this.tiempo <= 0 && this.coccion < 100) {
        this.active = false
        this.add.text(W / 2, H / 2, '¡Tiempo agotado!\nIntenta de nuevo', {
          fontSize: '18px', color: '#E24B4A', fontFamily: 'Georgia,serif', align: 'center'
        }).setOrigin(.5)
        this.time.delayedCall(1800, () => this.scene.start('Tritura', this.gameData))
      }
    }
  }
}

function makeEmpaqueScene() {
  return class EmpaqueScene extends window.Phaser.Scene {
    constructor() { super('Empaque') }
    init(data) { this.gameData = data || { money: 15000, day: 1, rep: 1, stock: 0, fulfilled: 0 } }
    create() {
      this.items = 0; this.needed = 8; this.packScore = 0; this.slots = []
      this.add.rectangle(W / 2, H / 2, W, H, 0x1a0f05)
      drawMesa(this)
      drawStepBar(this, 3)
      this.add.text(W / 2, 28, '3 — Empaca el bocadillo', {
        fontSize: '13px', color: '#9ca3af', fontFamily: 'system-ui'
      }).setOrigin(.5)
      this.add.text(W / 2, H / 2 - 60, 'Toca antes de que expire · Verde = perfecto', {
        fontSize: '11px', color: '#6b7280', fontFamily: 'system-ui'
      }).setOrigin(.5)
      // Cinta transportadora animada
      this.cintaG = this.add.graphics()
      this.cintaOffset = 0
      this.add.rectangle(W / 2, H / 2 + 65, W - 40, 14, 0x3d2b1f)
      // Score
      this.scoreTxt = this.add.text(W / 2, H - 128, '0 / ' + this.needed, {
        fontSize: '18px', color: '#' + TIERRA.toString(16), fontFamily: 'Georgia,serif', fontStyle: 'bold'
      }).setOrigin(.5)
      this.add.text(W / 2, H - 108, 'bocadillos empacados', { fontSize: '10px', color: '#9ca3af', fontFamily: 'system-ui' }).setOrigin(.5)
      // Barra
      this.add.rectangle(W / 2, H - 85, 300, 10, 0x2a1f10).setOrigin(.5)
      this.progBar = this.add.rectangle(W / 2 - 150, H - 85, 0, 10, VERDE).setOrigin(0, .5)
      // Spawn timer
      this.spawnTimer = this.time.addEvent({ delay: 850, callback: this.spawnBocadillo, callbackScope: this, loop: true })
      this.spawnBocadillo()
    }
    spawnBocadillo() {
      if (!this.scene.isActive('Empaque')) return
      if (this.items + this.slots.filter(s => !s.caught).length >= this.needed + 3) return
      const x = 90 + Math.random() * (W - 180)
      const y = H / 2 + 30 + Math.random() * 25
      const life = 1500 + Math.random() * 700
      const g = this.add.graphics()
      const barG = this.add.graphics()
      drawBocadillo(g, x, y, TIERRA)
      g.y = -50; barG.y = -50
      this.tweens.add({ targets: [g, barG], y: 0, duration: 280, ease: 'Back.easeOut' })
      const hit = this.add.rectangle(x, y, 54, 34, 0, 0).setInteractive({ useHandCursor: true })
      const slot = { id: Math.random().toString(36).slice(2), g, barG, hit, x, y, life, born: this.time.now, caught: false }
      hit.on('pointerdown', () => this.catchBocadillo(slot))
      // Hover feedback
      hit.on('pointerover', () => { g.setAlpha(.85) })
      hit.on('pointerout',  () => { g.setAlpha(1) })
      this.slots.push(slot)
    }
    catchBocadillo(slot) {
      if (slot.caught) return
      slot.caught = true
      const pct = (this.time.now - slot.born) / slot.life * 100
      let pts, col, msg
      if (pct < 38)      { pts = 3; col = VERDE;   msg = 'Perfecto +3' }
      else if (pct < 68) { pts = 2; col = NARANJA;  msg = 'Bien +2' }
      else               { pts = 1; col = RED;       msg = '¡Justo! +1' }
      this.packScore += pts; this.items++
      // Efecto visual
      const flash = this.add.rectangle(slot.x, slot.y, 64, 40, col, .85)
      this.tweens.add({ targets: flash, alpha: 0, scaleX: 2.2, scaleY: 2.2, duration: 320, ease: 'Power2', onComplete: () => flash.destroy() })
      const ft = this.add.text(slot.x, slot.y - 8, msg, { fontSize: '12px', color: '#fff', fontFamily: 'system-ui', fontStyle: 'bold' }).setOrigin(.5)
      this.tweens.add({ targets: ft, y: slot.y - 55, alpha: 0, duration: 750, ease: 'Power2', onComplete: () => ft.destroy() })
      // Animación recogida con tween
      this.tweens.add({ targets: [slot.g, slot.barG], y: '-=40', alpha: 0, duration: 250, onComplete: () => { slot.g.destroy(); slot.barG.destroy(); slot.hit.destroy() } })
      this.slots = this.slots.filter(s => s.id !== slot.id)
      this.scoreTxt.setText(this.items + ' / ' + this.needed)
      this.tweens.add({ targets: this.progBar, width: this.items / this.needed * 300, duration: 150, ease: 'Power2' })
      if (this.items >= this.needed) {
        this.spawnTimer.destroy()
        this.slots.forEach(s => { s.g.destroy(); s.barG.destroy(); s.hit.destroy() })
        const bonus = this.packScore * 130
        const newData = { ...this.gameData, stock: this.gameData.stock + this.items * 2, money: this.gameData.money + bonus }
        this.add.text(W / 2, H / 2 - 20, '¡Lote completo! Bonus ' + fmt(bonus), {
          fontSize: '16px', color: '#fff', fontFamily: 'Georgia,serif'
        }).setOrigin(.5)
        this.time.delayedCall(600, () => this.scene.start('Mercado', newData))
      }
    }
    update() {
      // Cinta transportadora
      this.cintaOffset = (this.cintaOffset + 2) % 40
      this.cintaG.clear()
      this.cintaG.lineStyle(1, 0x5a4030, .4)
      for (let x = this.cintaOffset; x < W; x += 40) {
        this.cintaG.lineBetween(x, H / 2 + 58, x, H / 2 + 72)
      }
      // Actualizar slots
      const now = this.time.now
      this.slots = this.slots.filter(slot => {
        if (slot.caught) return false
        const pct = (now - slot.born) / slot.life
        if (pct >= 1) { slot.g.destroy(); slot.barG.destroy(); slot.hit.destroy(); return false }
        const col = pct < .38 ? VERDE : pct < .68 ? NARANJA : RED
        slot.barG.clear()
        slot.barG.fillStyle(0x2a1f10, 1); slot.barG.fillRect(slot.x - 26, slot.y + 20, 52, 5)
        slot.barG.fillStyle(col, 1);       slot.barG.fillRect(slot.x - 26, slot.y + 20, 52 * (1 - pct), 5)
        slot.g.clear()
        drawBocadillo(slot.g, slot.x, slot.y, col)
        return true
      })
    }
  }
}

function fmt(n) { return '$' + Math.round(n).toLocaleString('es-CO') }

function makeMercadoScene(portalOrigin, serverUrl) {
  return class MercadoScene extends window.Phaser.Scene {
    constructor() { super('Mercado') }
    init(data) {
      this.gameData = data || { money: 15000, day: 1, rep: 1, stock: 0, fulfilled: 0 }
    }
    create() {
      const d = this.gameData
      this.orders = genOrders(d.rep)
      this.day = d.day; this.rep = d.rep; this.stock = d.stock
      this.money = d.money; this.fulfilled = d.fulfilled
      this.add.rectangle(W / 2, H / 2, W, H, 0x1a0f05)
      drawStepBar(this, 4)
      this.add.text(W / 2, 28, 'Día ' + this.day + ' — Mercado', {
        fontSize: '14px', color: '#F5EFE6', fontFamily: 'Georgia,serif'
      }).setOrigin(.5)
      // Reputación
      const repW = Math.round(this.rep / 5 * 180)
      this.add.rectangle(50 + 90, 58, 180, 8, 0x2a1f10).setOrigin(.5)
      this.repBar = this.add.rectangle(50, 58, repW, 8, NARANJA).setOrigin(0, .5)
      this.add.text(50, 70, 'Reputación ' + this.rep.toFixed(1) + '/5', { fontSize: '10px', color: '#9ca3af', fontFamily: 'system-ui' })
      // Stats
      this.stockTxt = this.add.text(W - 40, 48, 'Stock: ' + this.stock + ' 🍬', { fontSize: '13px', color: '#' + NARANJA.toString(16), fontFamily: 'system-ui' }).setOrigin(1, 0)
      this.moneyTxt = this.add.text(W - 40, 66, fmt(this.money), { fontSize: '13px', color: '#' + VERDE.toString(16), fontFamily: 'system-ui' }).setOrigin(1, 0)
      this.orderCards = []
      this.renderOrders()
      // Botones acción
      const btnProd = this.add.rectangle(W / 2 - 90, H - 50, 160, 40, TIERRA).setInteractive({ useHandCursor: true })
      this.add.text(W / 2 - 90, H - 50, 'Producir más →', { fontSize: '12px', color: '#fff', fontFamily: 'system-ui' }).setOrigin(.5)
      const btnDay = this.add.rectangle(W / 2 + 90, H - 50, 160, 40, 0x2a1f10).setInteractive({ useHandCursor: true })
      this.add.text(W / 2 + 90, H - 50, 'Siguiente día', { fontSize: '12px', color: '#fff', fontFamily: 'system-ui' }).setOrigin(.5)
      btnProd.on('pointerover', () => btnProd.setFillStyle(0x5a3f20))
      btnProd.on('pointerout', () => btnProd.setFillStyle(TIERRA))
      btnDay.on('pointerover', () => btnDay.setFillStyle(0x3d2b1f))
      btnDay.on('pointerout', () => btnDay.setFillStyle(0x2a1f10))
      const nextData = () => ({ money: this.money, day: this.day + 1, rep: this.rep, stock: this.stock, fulfilled: this.fulfilled })
      btnProd.on('pointerdown', () => this.scene.start('Tritura', nextData()))
      btnDay.on('pointerdown', () => this.avanzarDia())
    }
    renderOrders() {
      this.orderCards.forEach(c => c.forEach(x => x && x.destroy && x.destroy()))
      this.orderCards = []
      this.orders.slice(0, 3).forEach((o, i) => {
        const y = 110 + i * 100
        const canDo = this.stock >= o.qty
        const bg = this.add.rectangle(W / 2, y, W - 60, 88, 0x2a1f10).setOrigin(.5)
        const title = this.add.text(52, y - 28, o.client, { fontSize: '13px', color: '#F5EFE6', fontFamily: 'system-ui', fontStyle: 'bold' })
        const desc = this.add.text(52, y - 8, o.qty + ' unid · ' + fmt(o.price) + '/u · total ' + fmt(o.qty * o.price), { fontSize: '11px', color: '#9ca3af', fontFamily: 'system-ui' })
        const daysTxt = this.add.text(W - 55, y - 28, o.daysLeft + 'd', { fontSize: '11px', color: o.daysLeft <= 1 ? '#E24B4A' : '#BA7517', fontFamily: 'system-ui' }).setOrigin(1, 0)
        const btn = this.add.rectangle(W - 80, y + 20, 130, 32, canDo ? VERDE : 0x4a4a4a).setInteractive({ useHandCursor: canDo })
        const btnTxt = this.add.text(W - 80, y + 20, canDo ? 'Entregar →' : 'Faltan ' + (o.qty - this.stock), { fontSize: '11px', color: '#fff', fontFamily: 'system-ui' }).setOrigin(.5)
        if (canDo) {
          btn.on('pointerover', () => btn.setFillStyle(0x1d5c1d))
          btn.on('pointerout', () => btn.setFillStyle(VERDE))
          btn.on('pointerdown', () => this.entregar(o, i))
        }
        this.orderCards.push([bg, title, desc, daysTxt, btn, btnTxt])
      })
    }
    entregar(order, idx) {
      this.stock -= order.qty
      this.money += order.qty * order.price
      this.fulfilled++
      this.rep = Math.min(5, this.rep + 0.4)
      this.orders.splice(idx, 1)
      this.stockTxt.setText('Stock: ' + this.stock + ' 🍬')
      this.moneyTxt.setText(fmt(this.money))
      // Partículas monedas
      for (let i = 0; i < 8; i++) {
        const coin = this.add.circle(W - 80 + Phaser.Math.Between(-15, 15), H / 2, 7, GOLD)
        this.tweens.add({ targets: coin, y: H - 80, x: W - 40, alpha: 0, duration: 500 + i * 60, ease: 'Power2', onComplete: () => coin.destroy() })
      }
      this.renderOrders()
      if (this.rep >= 5 && this.fulfilled >= 5) {
        this.time.delayedCall(400, () => this.mostrarVictoria())
        if (serverUrl) this.guardarScore()
      }
    }
    avanzarDia() {
      this.orders.forEach(o => o.daysLeft--)
      this.orders.filter(o => o.daysLeft <= 0).forEach(() => { this.rep = Math.max(.5, this.rep - .3) })
      this.orders = this.orders.filter(o => o.daysLeft > 0)
      this.day++
      if (this.day > 18 && this.fulfilled < 3) {
        this.mostrarDerrota(); return
      }
      this.scene.start('Tritura', { money: this.money, day: this.day, rep: this.rep, stock: this.stock, fulfilled: this.fulfilled })
    }
    mostrarVictoria() {
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, .7)
      this.add.text(W / 2, H / 2 - 60, '🏆', { fontSize: '48px' }).setOrigin(.5)
      this.add.text(W / 2, H / 2, '¡Maestro Bocadillero!', { fontSize: '22px', color: '#F5EFE6', fontFamily: 'Georgia,serif' }).setOrigin(.5)
      this.add.text(W / 2, H / 2 + 32, 'En ' + this.day + ' días · ' + fmt(this.money) + ' · ' + this.fulfilled + ' pedidos', { fontSize: '13px', color: '#C4631A', fontFamily: 'system-ui' }).setOrigin(.5)
      const btn = this.add.rectangle(W / 2, H / 2 + 80, 180, 40, TIERRA).setInteractive({ useHandCursor: true })
      this.add.text(W / 2, H / 2 + 80, 'Jugar de nuevo', { fontSize: '13px', color: '#fff', fontFamily: 'system-ui' }).setOrigin(.5)
      btn.on('pointerdown', () => this.scene.start('Boot'))
    }
    mostrarDerrota() {
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, .7)
      this.add.text(W / 2, H / 2 - 40, '😔', { fontSize: '40px' }).setOrigin(.5)
      this.add.text(W / 2, H / 2 + 10, 'La fábrica cerró...', { fontSize: '20px', color: '#E24B4A', fontFamily: 'Georgia,serif' }).setOrigin(.5)
      const btn = this.add.rectangle(W / 2, H / 2 + 60, 180, 40, TIERRA).setInteractive({ useHandCursor: true })
      this.add.text(W / 2, H / 2 + 60, 'Intentar de nuevo', { fontSize: '13px', color: '#fff', fontFamily: 'system-ui' }).setOrigin(.5)
      btn.on('pointerdown', () => this.scene.start('Boot'))
    }
    guardarScore() {
      const payload = { portal: portalOrigin, score: this.fulfilled * 100 + Math.round(this.money / 1000), days: this.day, money: Math.round(this.money) }
      fetch(serverUrl + '/game/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {})
    }
  }
}

// ─── COMPONENTE REACT ─────────────────────────────────────────────────────────
const PHASER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js'

export default function BocadilloGame({ portalOrigin = 'com', serverUrl = '', onClose }) {
  const containerRef = useRef(null)
  const gameRef      = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const cfg = PORTAL_CFG[portalOrigin] || PORTAL_CFG.com

  useEffect(() => {
    let cancelled = false

    const initPhaser = () => {
      if (cancelled || !containerRef.current || gameRef.current) return
      try {
        const Phaser = window.Phaser
        const config = {
          type: Phaser.AUTO,
          width: W, height: H,
          backgroundColor: '#1a0f05',
          parent: containerRef.current,
          scene: [
            makeBootScene(cfg),
            makeTrituraScene(),
            makePailaScene(),
            makeEmpaqueScene(),
            makeMercadoScene(portalOrigin, serverUrl),
          ],
          scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
          render: { antialias: true, pixelArt: false },
        }
        gameRef.current = new Phaser.Game(config)
        setLoading(false)
      } catch (e) {
        setError('Error al iniciar el juego: ' + e.message)
      }
    }

    if (window.Phaser) {
      initPhaser()
      return
    }
    // Cargar Phaser dinámicamente
    const script = document.createElement('script')
    script.src = PHASER_CDN
    script.async = true
    script.onload = () => { if (!cancelled) initPhaser() }
    script.onerror = () => { if (!cancelled) setError('No se pudo cargar Phaser.js') }
    document.head.appendChild(script)

    return () => {
      cancelled = true
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center', background: '#1a0f05', borderRadius: 16, color: '#F5EFE6', fontFamily: 'system-ui' }}>
      <p style={{ color: '#E24B4A', marginBottom: '1rem' }}>{error}</p>
      {onClose && <button onClick={onClose} style={{ background: PORTAL_CFG[portalOrigin].accentHex, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13 }}>Volver</button>}
    </div>
  )

  return (
    <div style={{ position: 'relative', maxWidth: W, margin: '0 auto', borderRadius: 16, overflow: 'hidden', border: '0.5px solid #e5e7eb' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: '#1a0f05', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🍬</div>
          <p style={{ color: '#F5EFE6', fontSize: 14, fontFamily: 'system-ui' }}>Cargando el juego...</p>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%' }} />
      {onClose && (
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,.5)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontFamily: 'system-ui', zIndex: 20 }}
        >
          ✕ Salir
        </button>
      )}
    </div>
  )
}
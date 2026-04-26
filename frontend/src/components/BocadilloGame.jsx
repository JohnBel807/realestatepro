/**
 * BocadilloGame.jsx v3 — Maestro Bocadillero con Phaser.js
 * Gameplay: Tritura → Temperatura → Empaca → Mercado
 * Props: portalOrigin "com"|"info", serverUrl, onClose
 */

import React, { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser';

const TIERRA  = 0x6B4E2A
const NARANJA = 0xC4631A
const VERDE   = 0x2D6B2A
const CREMA   = 0xF5EFE6
const OSCURO  = 0x1C1208

const PORTAL_CFG = {
  com:  { accent: 0x6B4E2A, accentHex: '#6B4E2A', name: 'VelezyRicaurte Inmobiliaria' },
  info: { accent: 0xC4631A, accentHex: '#C4631A', name: 'VelezyRicaurte Marketplace'  },
}

const fmt = n => '$' + Math.round(n).toLocaleString('es-CO')

// ─── Phaser Scenes ────────────────────────────────────────────────────────────

class BootScene extends Phaser.Scene {
  constructor() { super('Boot') }

  create() {
    // Crear texturas procedurales
    this.createTextures()
    this.scene.start('Game')
  }

  createTextures() {
    // Guayaba
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(0xC75B3C); g.fillCircle(24, 24, 22)
    g.fillStyle(0xE07050, 0.6); g.fillCircle(18, 18, 10)
    g.generateTexture('guayaba', 48, 48); g.destroy()

    // Bocadillo empacado
    const b = this.make.graphics({ x: 0, y: 0, add: false })
    b.fillStyle(0x8B4513); b.fillRoundedRect(0, 0, 52, 32, 6)
    b.fillStyle(0xA0522D, 0.5); b.fillRoundedRect(4, 4, 44, 10, 3)
    b.fillStyle(0xFFFFFF, 0.15); b.fillRoundedRect(2, 2, 48, 8, 4)
    b.lineStyle(1.5, 0x6B3410); b.strokeRoundedRect(0, 0, 52, 32, 6)
    b.generateTexture('bocadillo', 52, 32); b.destroy()

    // Paila (olla)
    const p = this.make.graphics({ x: 0, y: 0, add: false })
    p.fillStyle(0x555555); p.fillEllipse(80, 20, 160, 30)
    p.fillStyle(0x444444); p.fillRect(0, 20, 160, 70)
    p.fillStyle(0x333333); p.fillEllipse(80, 90, 160, 30)
    p.fillStyle(0x666666, 0.4); p.fillRect(10, 20, 30, 70)
    p.generateTexture('paila', 160, 100); p.destroy()

    // Partícula de vapor
    const v = this.make.graphics({ x: 0, y: 0, add: false })
    v.fillStyle(0xFFFFFF, 0.6); v.fillCircle(6, 6, 6)
    v.generateTexture('vapor', 12, 12); v.destroy()

    // Partícula de fruta
    const f = this.make.graphics({ x: 0, y: 0, add: false })
    f.fillStyle(0xC75B3C); f.fillCircle(4, 4, 4)
    f.generateTexture('fruta-particle', 8, 8); f.destroy()

    // Partícula de estrella (score)
    const s = this.make.graphics({ x: 0, y: 0, add: false })
    s.fillStyle(0xFFD700); s.fillCircle(5, 5, 5)
    s.generateTexture('star', 10, 10); s.destroy()
  }
}

class GameScene extends Phaser.Scene {
  constructor() { super('Game') }

  init() {
    this.gameState = {
      phase: 'intro',
      money: 15000, stock: 0, day: 1, rep: 1, fulfilled: 0,
      log: [],
      tri: { clicks: 0, needed: 30, progress: 0 },
      paila: { temp: 45, progress: 0, time: 20, _dir: 1 },
      pack: { slots: [], items: 0, needed: 8, score: 0 },
      orders: [],
    }
    this.particles = { vapor: null, fruta: null }
    this._tempTimer = null
    this._packTimer = null
    this.onStateChange = null
    this.W = this.scale.width
    this.H = this.scale.height
  }

  create() {
    this.cameras.main.setBackgroundColor(0xF5EFE6)
    this.buildIntro()
  }

  addLog(msg) {
    this.gameState.log = [msg, ...this.gameState.log].slice(0, 20)
    this.emit('logupdate')
  }

  genOrders() {
    const pool = [
      { client: 'Tienda El Cacique',     qty: 6,  price: 4500, days: 3 },
      { client: 'Mercado de Vélez',       qty: 10, price: 4000, days: 4 },
      { client: 'Festival Bocadillo',     qty: 18, price: 3900, days: 5 },
      { client: 'Abuela Rosa',            qty: 3,  price: 5200, days: 2 },
      { client: 'Hotel Puente Nacional',  qty: 12, price: 4300, days: 4 },
      { client: 'Turistas Santander',     qty: 5,  price: 5500, days: 2 },
    ]
    const n = Math.min(2 + Math.floor(this.gameState.rep / 2), 4)
    return [...pool].sort(() => Math.random() - .5).slice(0, n)
      .map(o => ({ ...o, daysLeft: o.days, id: Math.random().toString(36).slice(2) }))
  }

  clearScene() {
    if (this._tempTimer) { clearInterval(this._tempTimer); this._tempTimer = null }
    if (this._packTimer) { clearInterval(this._packTimer); this._packTimer = null }
    this.children.removeAll(true)
    this.tweens.killAll()
  }

  emitState() {
    if (this.onStateChange) this.onStateChange({ ...this.gameState })
  }

  // ── INTRO ─────────────────────────────────────────────────────────────────
  buildIntro() {
    this.clearScene()
    const W = this.W, H = this.H

    // Fondo decorativo
    const bg = this.add.graphics()
    bg.fillStyle(0x1C1208, 0.05)
    bg.fillRoundedRect(20, 80, W - 40, H - 100, 16)

    // Título
    this.add.text(W / 2, 30, '🍬 Maestro Bocadillero', {
      fontSize: '22px', fontFamily: 'system-ui', color: '#1C1208', fontStyle: 'bold'
    }).setOrigin(0.5)
    this.add.text(W / 2, 58, 'El Legado de Vélez, Santander', {
      fontSize: '13px', fontFamily: 'system-ui', color: '#6B4E2A', fontStyle: 'italic'
    }).setOrigin(0.5)

    // Guayabas decorativas animadas
    const fruits = ['🍈', '🍈', '🍈']
    fruits.forEach((f, i) => {
      const x = 80 + i * 120, y = 140
      const t = this.add.text(x, y, f, { fontSize: '40px' }).setOrigin(0.5)
      this.tweens.add({ targets: t, y: y - 12, duration: 1200 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    })

    this.add.text(W / 2, 200, 'Hereda la fábrica familiar y produce\nel mejor bocadillo de Santander', {
      fontSize: '13px', fontFamily: 'system-ui', color: '#555555', align: 'center', lineSpacing: 6
    }).setOrigin(0.5)

    // Pasos
    const steps = [['👆', 'Tritura'], ['🌡️', 'Cocina'], ['📦', 'Empaca']]
    steps.forEach(([e, t], i) => {
      const x = 80 + i * 120, y = 270
      const card = this.add.graphics()
      card.fillStyle(0xFFFFFF); card.fillRoundedRect(x - 45, y - 30, 90, 70, 10)
      card.lineStyle(1, 0xE5E7EB); card.strokeRoundedRect(x - 45, y - 30, 90, 70, 10)
      this.add.text(x, y - 10, e, { fontSize: '24px' }).setOrigin(0.5)
      this.add.text(x, y + 22, t, { fontSize: '12px', fontFamily: 'system-ui', color: '#374151' }).setOrigin(0.5)
    })

    // Botón
    const btn = this.add.graphics()
    btn.fillStyle(TIERRA); btn.fillRoundedRect(W / 2 - 90, H - 80, 180, 46, 12)
    const btnText = this.add.text(W / 2, H - 57, 'Comenzar legado →', {
      fontSize: '15px', fontFamily: 'system-ui', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5)

    const btnZone = this.add.zone(W / 2, H - 57, 180, 46).setInteractive({ useHandCursor: true })
    btnZone.on('pointerover', () => { btn.clear(); btn.fillStyle(0x5a3f20); btn.fillRoundedRect(W / 2 - 90, H - 80, 180, 46, 12) })
    btnZone.on('pointerout', () => { btn.clear(); btn.fillStyle(TIERRA); btn.fillRoundedRect(W / 2 - 90, H - 80, 180, 46, 12) })
    btnZone.on('pointerdown', () => {
      this.gameState.orders = this.genOrders()
      this.addLog('¡Día 1 — a producir bocadillo!')
      this.buildTritura()
    })
  }

  // ── TRITURA ────────────────────────────────────────────────────────────────
  buildTritura() {
    this.clearScene()
    const W = this.W, H = this.H
    const g = this.gameState

    this.buildHUD('1 — Tritura la guayaba')

    // Barra progreso
    const barBg = this.add.graphics()
    barBg.fillStyle(0xE5E7EB); barBg.fillRoundedRect(30, 95, W - 60, 14, 7)
    this._triBar = this.add.graphics()
    this._triLabel = this.add.text(W / 2, 88, '0 / 30 golpes', {
      fontSize: '11px', fontFamily: 'system-ui', color: '#9CA3AF'
    }).setOrigin(0.5)

    this.updateTriBar()

    // Fondo paila decorativa
    const pailaBg = this.add.graphics()
    pailaBg.fillStyle(0x333333, 0.08); pailaBg.fillEllipse(W / 2, H / 2, 200, 80)

    // Guayaba grande — botón principal
    const fruitText = this.add.text(W / 2, H / 2 - 20, '🍈', {
      fontSize: '80px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Hint
    this.add.text(W / 2, H / 2 + 65, 'Toca para triturar', {
      fontSize: '12px', fontFamily: 'system-ui', color: '#9CA3AF'
    }).setOrigin(0.5)

    // Partículas de fruta
    this.particles.fruta = this.add.particles(0, 0, 'fruta-particle', {
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 0,
      alpha: { start: 1, end: 0 },
    })

    fruitText.on('pointerdown', () => {
      // Animación squeeze
      this.tweens.add({ targets: fruitText, scaleX: 0.8, scaleY: 1.2, duration: 80, yoyo: true, ease: 'Back.easeOut' })
      // Partículas
      this.particles.fruta.setPosition(W / 2, H / 2 - 20)
      this.particles.fruta.explode(6)

      g.tri.clicks = Math.min(g.tri.needed, g.tri.clicks + 1)
      g.tri.progress = g.tri.clicks / g.tri.needed * 100
      this.updateTriBar()

      // Shake pantalla leve
      this.cameras.main.shake(60, 0.004)

      if (g.tri.clicks >= g.tri.needed) {
        this.addLog('Fruta triturada — lista para la paila')
        this.tweens.add({
          targets: fruitText, scale: 0, duration: 300, ease: 'Back.easeIn',
          onComplete: () => this.buildPaila()
        })
      }
    })
    this.emitState()
  }

  updateTriBar() {
    const g = this.gameState, W = this.W
    if (!this._triBar) return
    this._triBar.clear()
    const pct = g.tri.clicks / g.tri.needed
    if (pct > 0) {
      this._triBar.fillStyle(TIERRA); this._triBar.fillRoundedRect(30, 95, (W - 60) * pct, 14, 7)
    }
    if (this._triLabel) this._triLabel.setText(`${g.tri.clicks} / ${g.tri.needed} golpes`)
  }

  // ── PAILA ──────────────────────────────────────────────────────────────────
  buildPaila() {
    this.clearScene()
    const W = this.W, H = this.H
    const g = this.gameState
    g.paila = { temp: 45, progress: 0, time: 20, _dir: 1 }

    this.buildHUD('2 — Controla la temperatura')

    // Olla gráfica
    const olla = this.add.graphics()
    olla.fillStyle(0x444444); olla.fillEllipse(W / 2, H / 2 - 10, 200, 40)
    olla.fillStyle(0x3A3A3A); olla.fillRect(W / 2 - 100, H / 2 - 10, 200, 80)
    olla.fillStyle(0x2E2E2E); olla.fillEllipse(W / 2, H / 2 + 70, 200, 40)
    olla.fillStyle(0x5A5A5A, 0.3); olla.fillRect(W / 2 - 95, H / 2 - 5, 30, 80)

    // Líquido en la olla (color según temp)
    this._liquid = this.add.graphics()

    // Termómetro visual
    const thermBg = this.add.graphics()
    thermBg.fillStyle(0xE5E7EB); thermBg.fillRoundedRect(W - 45, 100, 20, 150, 10)
    thermBg.fillStyle(0xD1D5DB); thermBg.fillCircle(W - 35, 265, 14)
    this._thermFill = this.add.graphics()
    this._thermText = this.add.text(W - 35, 80, '45°C', {
      fontSize: '12px', fontFamily: 'system-ui', color: '#374151', fontStyle: 'bold'
    }).setOrigin(0.5)

    // Zona ideal marker
    const zBg = this.add.graphics()
    zBg.lineStyle(2, 0x2D6B2A, 0.8)
    const zoneStart = 100 + (1 - (80 - 30) / 70) * 150
    const zoneEnd   = 100 + (1 - (65 - 30) / 70) * 150
    zBg.strokeRect(W - 46, zoneStart, 22, zoneEnd - zoneStart)
    this.add.text(W - 56, (zoneStart + zoneEnd) / 2, '✓', {
      fontSize: '10px', color: '#2D6B2A'
    }).setOrigin(1, 0.5)

    // Etiqueta zona
    this.add.text(W / 2, 96, 'Ideal: 65–80°C', {
      fontSize: '11px', fontFamily: 'system-ui', color: '#6B7280'
    }).setOrigin(0.5)

    // Barra cocción
    this.add.text(30, 108, 'Cocción:', {
      fontSize: '11px', fontFamily: 'system-ui', color: '#9CA3AF'
    })
    const cocBg = this.add.graphics()
    cocBg.fillStyle(0xE5E7EB); cocBg.fillRoundedRect(82, 108, 130, 10, 5)
    this._cocBar = this.add.graphics()
    this._cocLabel = this.add.text(220, 108, '0%', {
      fontSize: '11px', fontFamily: 'system-ui', color: '#374151'
    }).setOrigin(0, 0)

    // Timer
    this._timerText = this.add.text(W / 2, 128, '20s', {
      fontSize: '13px', fontFamily: 'system-ui', color: '#374151', fontStyle: 'bold'
    }).setOrigin(0.5)

    // Partículas de vapor
    this.particles.vapor = this.add.particles(W / 2, H / 2 - 30, 'vapor', {
      speed: { min: 10, max: 30 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.8, end: 2 },
      alpha: { start: 0.5, end: 0 },
      lifespan: { min: 800, max: 1600 },
      frequency: 200,
      quantity: 1,
    })
    this.particles.vapor.stop()

    // Botones
    this.buildTempButtons()

    // Estado zona
    this._zoneText = this.add.text(W / 2, H / 2 + 100, '', {
      fontSize: '13px', fontFamily: 'system-ui', fontStyle: 'bold'
    }).setOrigin(0.5)

    // Loop temperatura
    this._tempTimer = setInterval(() => {
      const p = g.paila
      p.temp += p._dir * (1.4 + Math.random() * 0.9)
      if (p.temp >= 98) p._dir = -1
      if (p.temp <= 32) p._dir = 1
      p.time = Math.max(0, p.time - 0.1)

      if (p.temp >= 65 && p.temp <= 80) {
        p.progress = Math.min(100, p.progress + 1.8)
        this.particles.vapor.start()
      } else {
        this.particles.vapor.stop()
        if (p.temp > 80) {
          p.progress = Math.max(0, p.progress - 0.9)
        } else {
          p.progress = Math.max(0, p.progress - 0.4)
        }
      }

      this.updatePailaVisuals()

      if (p.progress >= 100) {
        clearInterval(this._tempTimer)
        this.particles.vapor.stop()
        this.addLog('Cocción perfecta — a empacar')
        this.cameras.main.flash(400, 200, 255, 150)
        this.time.delayedCall(600, () => this.buildEmpaque())
      }
      if (p.time <= 0 && p.progress < 100) {
        clearInterval(this._tempTimer)
        this.particles.vapor.stop()
        this.addLog('¡Tiempo agotado! Fruta perdida')
        this.cameras.main.shake(500, 0.012)
        this.time.delayedCall(800, () => this.buildTritura())
      }
    }, 100)

    this.emitState()
  }

  buildTempButtons() {
    const W = this.W, H = this.H

    const makeBtn = (x, label, color, delta) => {
      const g = this.add.graphics()
      g.fillStyle(color); g.fillRoundedRect(x - 55, H - 75, 110, 44, 10)
      const t = this.add.text(x, H - 53, label, {
        fontSize: '14px', fontFamily: 'system-ui', color: '#FFFFFF', fontStyle: 'bold'
      }).setOrigin(0.5)
      const z = this.add.zone(x, H - 53, 110, 44).setInteractive({ useHandCursor: true })
      z.on('pointerdown', () => {
        this.gameState.paila.temp = Math.max(30, Math.min(100, this.gameState.paila.temp + delta))
        this.gameState.paila._dir = delta > 0 ? 1 : -1
        this.tweens.add({ targets: [g, t], y: '-=3', duration: 80, yoyo: true })
      })
      z.on('pointerover', () => { g.clear(); g.fillStyle(color === VERDE ? 0x1f5a1c : 0x993c1d); g.fillRoundedRect(x - 55, H - 75, 110, 44, 10) })
      z.on('pointerout', () => { g.clear(); g.fillStyle(color); g.fillRoundedRect(x - 55, H - 75, 110, 44, 10) })
    }

    makeBtn(this.W / 2 - 65, '🔽 Bajar', 0xD85A30, -7)
    makeBtn(this.W / 2 + 65, '🔼 Subir', VERDE, 7)
  }

  updatePailaVisuals() {
    const p = this.gameState.paila
    const W = this.W, H = this.H
    const inZone = p.temp >= 65 && p.temp <= 80
    const tooHot = p.temp > 80
    const col = inZone ? 0x2D6B2A : tooHot ? 0xE24B4A : 0xC4631A
    const colHex = inZone ? '#2D6B2A' : tooHot ? '#E24B4A' : '#C4631A'

    // Líquido
    if (this._liquid) {
      this._liquid.clear()
      const liqAlpha = 0.6 + (p.temp - 30) / 140
      this._liquid.fillStyle(col, liqAlpha)
      this._liquid.fillEllipse(W / 2, H / 2 + 30, 180, 30)
    }

    // Termómetro
    if (this._thermFill) {
      this._thermFill.clear()
      const thermH = ((p.temp - 30) / 70) * 150
      this._thermFill.fillStyle(col)
      this._thermFill.fillRoundedRect(W - 43, 100 + 150 - thermH, 16, thermH, 8)
      this._thermFill.fillCircle(W - 35, 265, 12)
    }
    if (this._thermText) {
      this._thermText.setText(Math.round(p.temp) + '°C')
      this._thermText.setColor(colHex)
    }

    // Barra cocción
    if (this._cocBar) {
      this._cocBar.clear()
      if (p.progress > 0) {
        this._cocBar.fillStyle(VERDE)
        this._cocBar.fillRoundedRect(82, 108, 130 * (p.progress / 100), 10, 5)
      }
    }
    if (this._cocLabel) this._cocLabel.setText(Math.round(p.progress) + '%')
    if (this._timerText) this._timerText.setText(Math.round(p.time) + 's')

    if (this._zoneText) {
      const msg = inZone ? '¡Zona perfecta!' : tooHot ? '¡Demasiado caliente!' : 'Muy frío — sube el fuego'
      this._zoneText.setText(msg).setColor(colHex)
    }
  }

  // ── EMPAQUE ────────────────────────────────────────────────────────────────
  buildEmpaque() {
    this.clearScene()
    const W = this.W, H = this.H
    const pk = this.gameState.pack
    pk.slots = []; pk.items = 0; pk.score = 0

    this.buildHUD('3 — Empaca el bocadillo')

    this.add.text(W / 2, 96, 'Toca los bocadillos — verde es perfecto', {
      fontSize: '11px', fontFamily: 'system-ui', color: '#6B7280'
    }).setOrigin(0.5)

    // Contador
    this._packCounter = this.add.text(W / 2, 114, `0 / ${pk.needed}`, {
      fontSize: '14px', fontFamily: 'system-ui', color: TIERRA === 0x6B4E2A ? '#6B4E2A' : '#C4631A', fontStyle: 'bold'
    }).setOrigin(0.5)

    // Cinta transportadora
    const belt = this.add.graphics()
    belt.fillStyle(0x374151); belt.fillRect(0, H - 55, W, 30)
    belt.fillStyle(0x4B5563, 0.5); belt.fillRect(0, H - 50, W, 8)

    // Stripes en la cinta (animadas después)
    for (let i = 0; i < 8; i++) {
      const stripe = this.add.graphics()
      stripe.fillStyle(0xFFFFFF, 0.1)
      stripe.fillRect(i * (W / 7), H - 55, W / 14, 30)
      this.tweens.add({ targets: stripe, x: W / 7, duration: 1800, repeat: -1, ease: 'Linear' })
    }

    // Partículas de éxito
    this.particles.star = this.add.particles(0, 0, 'star', {
      speed: { min: 60, max: 140 },
      angle: { min: 240, max: 300 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 0,
      alpha: { start: 1, end: 0 },
    })

    this._packSlots = {}
    this._packBars = {}

    // Spawner
    const spawnBocadillo = () => {
      if (!this.scene.isActive('Game')) return
      if (pk.items >= pk.needed) return

      const id = Math.random().toString(36).slice(2)
      const life = 1300 + Math.random() * 700
      const x = Phaser.Math.Between(40, W - 40)
      const y = Phaser.Math.Between(150, H - 80)

      // Tarjeta
      const card = this.add.graphics()
      card.fillStyle(0xFFFFFF); card.fillRoundedRect(-28, -18, 56, 36, 8)
      card.lineStyle(1, 0xE5E7EB); card.strokeRoundedRect(-28, -18, 56, 36, 8)
      card.setPosition(x, y)

      const emoji = this.add.text(x, y - 2, '🍬', { fontSize: '22px' }).setOrigin(0.5)
      emoji.setInteractive({ useHandCursor: true })

      // Barra de tiempo
      const barBg = this.add.graphics()
      barBg.fillStyle(0xE5E7EB); barBg.fillRoundedRect(x - 24, y + 20, 48, 5, 3)
      const barFill = this.add.graphics()

      this._packSlots[id] = { card, emoji, barBg, barFill, born: Date.now(), life, x, y }

      // Entrada
      card.setAlpha(0); emoji.setAlpha(0)
      this.tweens.add({ targets: [card, emoji], alpha: 1, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' })

      emoji.on('pointerdown', () => {
        const slot = this._packSlots[id]
        if (!slot) return
        const pct = (Date.now() - slot.born) / slot.life * 100
        const pts = pct < 40 ? 3 : pct < 70 ? 2 : 1
        const label = pct < 40 ? '⭐ Perfecto!' : pct < 70 ? '👍 Bien' : '✓ Ok'
        const col = pct < 40 ? 0x2D6B2A : pct < 70 ? 0xBA7517 : 0x888780

        // Efecto captura
        this.tweens.add({ targets: [slot.card, slot.emoji], scale: 0, alpha: 0, duration: 200, ease: 'Back.easeIn' })
        this.tweens.add({ targets: [slot.barBg, slot.barFill], alpha: 0, duration: 150 })

        // Score popup
        const pop = this.add.text(slot.x, slot.y - 20, label, {
          fontSize: '14px', fontFamily: 'system-ui',
          color: pct < 40 ? '#2D6B2A' : pct < 70 ? '#BA7517' : '#888780',
          fontStyle: 'bold'
        }).setOrigin(0.5)
        this.tweens.add({ targets: pop, y: slot.y - 55, alpha: 0, duration: 700, ease: 'Cubic.easeOut',
          onComplete: () => pop.destroy() })

        // Estrellas
        this.particles.star.setPosition(slot.x, slot.y)
        this.particles.star.explode(pts * 3)

        delete this._packSlots[id]
        pk.score += pts
        pk.items++
        this.gameState.stock += 2
        this.addLog(label.replace(/⭐|👍|✓ /g, '') + ' — +2 bocadillos')
        if (this._packCounter) this._packCounter.setText(`${pk.items} / ${pk.needed}`)

        if (pk.items >= pk.needed) {
          clearInterval(this._packTimer)
          const bonus = pk.score * 120
          this.gameState.money += bonus
          this.gameState.rep = Math.min(5, this.gameState.rep + 0.3)
          this.addLog(`Lote listo: ${this.gameState.stock} bocadillos, bonus ${fmt(bonus)}`)
          this.cameras.main.flash(500, 255, 220, 100)
          this.time.delayedCall(700, () => this.buildMercado())
        }
      })

      // Auto-expirar
      this.time.delayedCall(life, () => {
        const slot = this._packSlots[id]
        if (!slot) return
        this.tweens.add({ targets: [slot.card, slot.emoji, slot.barBg, slot.barFill], alpha: 0, duration: 200 })
        delete this._packSlots[id]
      })

      // Siguiente spawn
      if (pk.items < pk.needed) {
        this.time.delayedCall(900 + Math.random() * 400, spawnBocadillo)
      }
    }

    // Arrancar con varios bocadillos
    spawnBocadillo()
    this.time.delayedCall(400, spawnBocadillo)
    this.time.delayedCall(900, spawnBocadillo)

    // Loop para actualizar barras
    this._packTimer = setInterval(() => {
      Object.entries(this._packSlots || {}).forEach(([id, slot]) => {
        if (!slot.barFill) return
        const pct = Math.min(1, (Date.now() - slot.born) / slot.life)
        const col = pct < 0.4 ? VERDE : pct < 0.7 ? NARANJA : 0xE24B4A
        slot.barFill.clear()
        slot.barFill.fillStyle(col)
        slot.barFill.fillRoundedRect(slot.x - 24, slot.y + 20, 48 * pct, 5, 3)
      })
    }, 50)

    this.emitState()
  }

  // ── MERCADO ────────────────────────────────────────────────────────────────
  buildMercado() {
    this.clearScene()
    const W = this.W, H = this.H
    const g = this.gameState

    this.buildHUD('Mercado — entrega pedidos')

    const orders = g.orders
    const itemH = 78
    const startY = 110

    if (orders.length === 0) {
      this.add.text(W / 2, H / 2, 'Sin pedidos activos', {
        fontSize: '13px', fontFamily: 'system-ui', color: '#9CA3AF'
      }).setOrigin(0.5)
    }

    orders.forEach((o, i) => {
      const y = startY + i * (itemH + 8)
      const canFulfill = g.stock >= o.qty

      // Card
      const card = this.add.graphics()
      card.fillStyle(0xFFFFFF); card.fillRoundedRect(16, y, W - 32, itemH, 10)
      card.lineStyle(1, canFulfill ? 0x9FE1CB : 0xE5E7EB)
      card.strokeRoundedRect(16, y, W - 32, itemH, 10)

      this.add.text(28, y + 12, o.client, {
        fontSize: '13px', fontFamily: 'system-ui', color: '#1A1A1A', fontStyle: 'bold'
      })
      this.add.text(28, y + 30, `${o.qty} und · ${fmt(o.price)}/u`, {
        fontSize: '11px', fontFamily: 'system-ui', color: '#6B7280'
      })
      this.add.text(28, y + 46, `Total: ${fmt(o.qty * o.price)}`, {
        fontSize: '11px', fontFamily: 'system-ui', color: '#374151'
      })

      // Badge días
      const urgColor = o.daysLeft <= 1 ? 0xFEE2E2 : 0xFEF3C7
      const urgText  = o.daysLeft <= 1 ? '#DC2626' : '#92400E'
      const badge = this.add.graphics()
      badge.fillStyle(urgColor); badge.fillRoundedRect(W - 60, y + 10, 44, 22, 11)
      this.add.text(W - 38, y + 21, `${o.daysLeft}d`, {
        fontSize: '11px', fontFamily: 'system-ui', color: urgText, fontStyle: 'bold'
      }).setOrigin(0.5)

      // Botón entregar
      const btnColor = canFulfill ? VERDE : 0xD1D5DB
      const btnG = this.add.graphics()
      btnG.fillStyle(btnColor); btnG.fillRoundedRect(W - 130, y + itemH - 26, 114, 20, 6)
      const btnLabel = canFulfill ? `Entregar ${o.qty} →` : `Necesitas ${o.qty - g.stock} más`
      this.add.text(W - 73, y + itemH - 16, btnLabel, {
        fontSize: '10px', fontFamily: 'system-ui',
        color: canFulfill ? '#FFFFFF' : '#9CA3AF'
      }).setOrigin(0.5)

      if (canFulfill) {
        const zone = this.add.zone(W - 73, y + itemH - 16, 114, 20).setInteractive({ useHandCursor: true })
        zone.on('pointerdown', () => {
          g.stock -= o.qty
          const earned = o.qty * o.price
          g.money += earned; g.fulfilled++; g.rep = Math.min(5, g.rep + 0.4)
          g.orders = g.orders.filter(x => x.id !== o.id)
          this.addLog(`${o.client} entregado — ${fmt(earned)}`)
          this.cameras.main.flash(300, 100, 255, 150)
          if (g.rep >= 5 && g.fulfilled >= 5) { this.gameState.phase = 'win'; this.buildEndScreen(true); return }
          this.buildMercado()
        })
        zone.on('pointerover', () => { btnG.clear(); btnG.fillStyle(0x1f5a1c); btnG.fillRoundedRect(W - 130, y + itemH - 26, 114, 20, 6) })
        zone.on('pointerout', () => { btnG.clear(); btnG.fillStyle(VERDE); btnG.fillRoundedRect(W - 130, y + itemH - 26, 114, 20, 6) })

        // Entrada con tween
        card.setAlpha(0)
        this.tweens.add({ targets: card, alpha: 1, duration: 200 + i * 80, ease: 'Cubic.easeOut' })
      }
    })

    // Botones abajo
    const btnY = H - 58
    this.makeActionBtn(W / 2 - 70, btnY, 128, 'Producir más →', TIERRA, () => {
      g.tri = { clicks: 0, needed: 30, progress: 0 }
      this.addLog(`— Día ${g.day} producción —`)
      this.buildTritura()
    })
    this.makeActionBtn(W / 2 + 70, btnY, 128, 'Siguiente día', 0x6B7280, () => {
      g.day++
      g.orders.forEach(o => o.daysLeft--)
      const exp = g.orders.filter(o => o.daysLeft <= 0)
      exp.forEach(o => { this.addLog(`Pedido ${o.client} expirado`); g.rep = Math.max(0.5, g.rep - 0.3) })
      g.orders = g.orders.filter(o => o.daysLeft > 0)
      if (g.orders.length < 2) g.orders = [...g.orders, ...this.genOrders()].slice(0, 4)
      this.addLog(`— Día ${g.day} —`)
      if (g.day > 18 && g.fulfilled < 3) { this.buildEndScreen(false); return }
      g.tri = { clicks: 0, needed: 30, progress: 0 }
      this.buildTritura()
    })

    this.emitState()
  }

  makeActionBtn(x, y, w, label, color, cb) {
    const g = this.add.graphics()
    g.fillStyle(color); g.fillRoundedRect(x - w / 2, y - 20, w, 40, 10)
    const t = this.add.text(x, y, label, {
      fontSize: '12px', fontFamily: 'system-ui', color: '#FFFFFF'
    }).setOrigin(0.5)
    const z = this.add.zone(x, y, w, 40).setInteractive({ useHandCursor: true })
    z.on('pointerdown', cb)
    z.on('pointerover', () => { g.clear(); g.fillStyle(Phaser.Display.Color.GetColor32(...Phaser.Display.Color.IntegerToRGB(color).map(v => Math.max(0, v - 20)))); g.fillRoundedRect(x - w / 2, y - 20, w, 40, 10) })
    z.on('pointerout', () => { g.clear(); g.fillStyle(color); g.fillRoundedRect(x - w / 2, y - 20, w, 40, 10) })
  }

  buildEndScreen(win) {
    this.clearScene()
    const W = this.W, H = this.H, g = this.gameState

    this.cameras.main.setBackgroundColor(win ? 0xF0F7F0 : 0xFFF0F0)

    this.add.text(W / 2, H / 2 - 90, win ? '🏆' : '😔', { fontSize: '60px' }).setOrigin(0.5)
    this.add.text(W / 2, H / 2 - 20, win ? '¡Maestro Bocadillero!' : 'La fábrica cerró...', {
      fontSize: '20px', fontFamily: 'system-ui', color: '#1a1a1a', fontStyle: 'bold'
    }).setOrigin(0.5)
    this.add.text(W / 2, H / 2 + 16,
      win
        ? `Ganaste ${fmt(g.money)} en ${g.day} días\n${g.fulfilled} pedidos entregados`
        : `${g.day} días no fueron suficientes\n¡La tradición merece otro intento!`,
      { fontSize: '13px', fontFamily: 'system-ui', color: '#6b7280', align: 'center', lineSpacing: 5 }
    ).setOrigin(0.5)

    this.makeActionBtn(W / 2, H - 60, 180, 'Jugar de nuevo', TIERRA, () => {
      this.init(); this.cameras.main.setBackgroundColor(0xF5EFE6); this.buildIntro()
    })
    this.emitState()
  }

  buildHUD(phaseLabel) {
    const W = this.W, g = this.gameState
    const repPct = g.rep / 5

    // Fondo HUD
    const hud = this.add.graphics()
    hud.fillStyle(0x1C1208); hud.fillRect(0, 0, W, 74)

    this.add.text(12, 10, `🍬 Día ${g.day}`, {
      fontSize: '13px', fontFamily: 'system-ui', color: '#F5EFE6', fontStyle: 'bold'
    })
    this.add.text(12, 30, phaseLabel, {
      fontSize: '10px', fontFamily: 'system-ui', color: 'rgba(245,239,230,0.55)',
      letterSpacing: 1
    })

    // Rep
    this.add.text(W - 12, 10, `Rep ${g.rep.toFixed(1)}/5`, {
      fontSize: '11px', fontFamily: 'system-ui', color: '#fff'
    }).setOrigin(1, 0)
    const repBg = this.add.graphics()
    repBg.fillStyle(0xFFFFFF, 0.2); repBg.fillRoundedRect(W - 80, 28, 68, 5, 3)
    const repFill = this.add.graphics()
    repFill.fillStyle(0xFFFFFF); repFill.fillRoundedRect(W - 80, 28, 68 * repPct, 5, 3)

    // Stats fila
    const statsData = [
      { l: fmt(g.money), sub: 'Pesos' },
      { l: String(g.stock), sub: 'Stock' },
      { l: String(g.fulfilled), sub: 'Entregados' },
    ]
    statsData.forEach(({ l, sub }, i) => {
      const x = 30 + i * (W / 3)
      this.add.text(x, 48, l, { fontSize: '13px', fontFamily: 'system-ui', color: '#F5EFE6', fontStyle: 'bold' })
      this.add.text(x, 63, sub, { fontSize: '9px', fontFamily: 'system-ui', color: 'rgba(245,239,230,0.5)' })
    })
  }
}

// ─── React Wrapper ────────────────────────────────────────────────────────────
export default function BocadilloGame({ portalOrigin = 'com', serverUrl, onClose }) {
  const containerRef = useRef(null)
  const gameRef = useRef(null)
  const [log, setLog] = useState([])
  const [gameState, setGameState] = useState(null)
  const cfg = PORTAL_CFG[portalOrigin] || PORTAL_CFG.com

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const loadPhaser = async () => {
      if (!window.Phaser) {
        await new Promise((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js'
          s.onload = res; s.onerror = rej
          document.head.appendChild(s)
        })
      }

      const W = Math.min(containerRef.current.offsetWidth, 400)
      const H = 540

      const game = new window.Phaser.Game({
        type: Phaser.AUTO,
        width: W,
        height: H,
        backgroundColor: '#F5EFE6',
        parent: containerRef.current,
        scene: [BootScene, GameScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: { antialias: true, pixelArt: false },
      })

      game.events.once('ready', () => {
        const scene = game.scene.getScene('Game')
        if (scene) {
          scene.onStateChange = (state) => setGameState(state)
          scene.on('logupdate', () => {
            const s = game.scene.getScene('Game')
            if (s) setLog([...s.gameState.log])
          })
        }
      })

      gameRef.current = game
    }

    loadPhaser().catch(console.error)

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  // Guardar score en backend cuando termina
  useEffect(() => {
    if (gameState?.phase === 'win' && serverUrl) {
      fetch(`${serverUrl}/game/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal: portalOrigin,
          money: gameState.money,
          day: gameState.day,
          fulfilled: gameState.fulfilled,
          rep: gameState.rep,
        }),
      }).catch(() => {})
    }
  }, [gameState?.phase])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ background: '#1C1208', borderRadius: '16px 16px 0 0', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'rgba(245,239,230,.6)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          {cfg.name}
        </span>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(245,239,230,.5)', cursor: 'pointer', fontSize: 13 }}>
            Salir ×
          </button>
        )}
      </div>

      <div ref={containerRef} style={{ width: '100%', background: '#F5EFE6', lineHeight: 0, borderRadius: '0 0 0 0', overflow: 'hidden' }} />

      {log.length > 0 && (
        <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '0 0 16px 16px', padding: '10px 14px' }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Registro</p>
          <div style={{ maxHeight: 64, overflowY: 'auto' }}>
            {log.slice(0, 8).map((l, i) => (
              <p key={i} style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.8 }}>{l}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
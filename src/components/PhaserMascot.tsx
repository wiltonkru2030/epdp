import { useEffect, useRef } from 'react'

type PhaserGame = { destroy: (removeCanvas: boolean, noReturn?: boolean) => void }
type MascotSceneLike = { events: { emit: (event: string, value: string) => void } }

export default function PhaserMascot({ mood = 'idle', className = '' }: { mood?: string; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<PhaserGame | null>(null)
  const sceneRef = useRef<MascotSceneLike | null>(null)

  useEffect(() => {
    let cancelled = false
    let createdGame: PhaserGame | null = null

    async function mount() {
      const PhaserModule = await import('phaser')
      if (cancelled || !hostRef.current) return
      const Phaser = PhaserModule.default

      class MascotScene extends Phaser.Scene {
        private mascot?: Phaser.GameObjects.Sprite

        constructor() { super({ key: 'EPDPMascot' }) }

        preload() {
          this.load.spritesheet('epdp-owl', '/arcade/owl-sheet.svg', {
            frameWidth: 256,
            frameHeight: 256,
          })
        }

        create() {
          this.anims.create({
            key: 'owl-idle',
            frames: this.anims.generateFrameNumbers('epdp-owl', { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1,
          })
          this.anims.create({
            key: 'owl-happy',
            frames: this.anims.generateFrameNumbers('epdp-owl', { start: 4, end: 7 }),
            frameRate: 9,
            repeat: -1,
          })
          this.anims.create({
            key: 'owl-oops',
            frames: this.anims.generateFrameNumbers('epdp-owl', { start: 8, end: 11 }),
            frameRate: 6,
            repeat: -1,
          })
          this.anims.create({
            key: 'owl-laugh',
            frames: this.anims.generateFrameNumbers('epdp-owl', { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1,
          })
          this.mascot = this.add.sprite(128, 128, 'epdp-owl', 0).setScale(0.88)
          this.playMood(hostRef.current?.dataset.mood ?? 'idle')
          this.events.on('change-mood', (nextMood: string) => this.playMood(nextMood))
          sceneRef.current = this
        }

        private playMood(nextMood: string) {
          if (!this.mascot) return
          const animation = nextMood === 'oops' ? 'owl-oops'
            : nextMood === 'laugh' || nextMood === 'celebrate' ? 'owl-laugh'
            : nextMood === 'happy' ? 'owl-happy'
            : 'owl-idle'
          this.mascot.play(animation, true)
        }
      }

      createdGame = new Phaser.Game({
        type: Phaser.AUTO,
        width: 256,
        height: 256,
        parent: hostRef.current,
        transparent: true,
        banner: false,
        audio: { noAudio: true },
        render: { antialias: true, transparent: true },
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [MascotScene],
      })
      gameRef.current = createdGame
    }

    void mount().catch(() => {
      if (hostRef.current) hostRef.current.dataset.fallback = 'true'
    })

    return () => {
      cancelled = true
      sceneRef.current = null
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.events.emit('change-mood', mood)
  }, [mood])

  return <div
    ref={hostRef}
    className={`epdp-phaser-mascot ${className}`}
    role="img"
    aria-label="Mascote animado da EPDP"
    data-mood={mood}
  />
}

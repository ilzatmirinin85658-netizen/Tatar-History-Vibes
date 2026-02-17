import Phaser from "phaser";
import { DialogueBox } from "../ui/DialogueBox";

const WORLD_W = 390;
const WORLD_H = 3000;

type PrologueState =
  | "INTRO_PAN"
  | "PHONE_RING"
  | "WAITING_CHOICE"
  | "ANSWER_GRANDMA"
  | "ANSWER_HERO"
  | "DECLINE_THOUGHT"
  | "CALL_ENDED";

export class PrologueScene extends Phaser.Scene {
  private dialogueBox!: DialogueBox;
  private state: PrologueState = "INTRO_PAN";

  constructor() {
    super({ key: "PrologueScene" });
  }

  create(): void {
    const { width, height } = this.scale;

    // ========== LAYER 1: Sky gradient (Y: 0–1000) ==========
    this.buildSkyGradient(width);

    // Sun
    const sun = this.add.image(width * 0.75, 150, "sun").setScale(1.5).setAlpha(0.9);
    this.tweens.add({
      targets: sun,
      angle: 360,
      duration: 60000,
      repeat: -1,
    });

    // ========== LAYER 2: Cloud barrier (Y: 900–1200) ==========
    this.buildCloudLayer(width);

    // ========== LAYER 3: Roof (Y: 1200–1800) ==========
    const roof = this.add.image(width / 2, 1200, "roof_grey").setOrigin(0.5, 0);
    roof.setDisplaySize(width, 600);

    // ========== LAYER 4: Wall (Y: 1800–2400) ==========
    const wallTex = this.textures.get("wall");
    const wallFrame = wallTex.get(0);
    const wallTile = this.add.tileSprite(
      0, 1800, width, 600,
      "wall",
    ).setOrigin(0, 0);
    wallTile.setTileScale(width / wallFrame.width, 600 / (wallFrame.height * 4));

    // ========== LAYER 5: Courtyard (Y: 2400–3000) ==========
    const bg = this.add.image(width / 2, WORLD_H, "bg_courtyard").setOrigin(0.5, 1);
    const bgScale = width / bg.width;
    bg.setScale(bgScale);

    // Hero on the bench
    const hero = this.add.image(142, 2884, "hero_sitting");
    const heroScale = (height * 0.28) / hero.height;
    hero.setScale(heroScale);

    // Breathing animation
    this.tweens.add({
      targets: hero,
      scaleY: heroScale * 0.98,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // ========== Dialogue box (fixed to viewport) ==========
    const boxHeight = 150;
    this.dialogueBox = new DialogueBox({
      scene: this,
      x: 10,
      y: height - boxHeight - 10,
      width: width - 20,
      height: boxHeight,
    });
    this.dialogueBox.getContainer().setScrollFactor(0);

    // ========== Camera: slow pan from sky to hero ==========
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setScroll(0, 0);

    this.state = "INTRO_PAN";
    const panTargetY = 2900;
    cam.pan(
      width / 2,
      panTargetY,
      10000,
      "Sine.easeInOut",
      false,
      (_cam, progress) => {
        if (progress === 1) {
          this.time.delayedCall(500, () => this.phoneRing());
        }
      },
    );
  }

  // ---- Sky gradient via stacked rectangles ----
  private buildSkyGradient(worldWidth: number): void {
    const steps = 20;
    const stripH = 1000 / steps;
    const topR = 0x00, topG = 0xbf, topB = 0xff;
    const botR = 0xff, botG = 0xff, botB = 0xff;

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(topR + (botR - topR) * t);
      const g = Math.round(topG + (botG - topG) * t);
      const b = Math.round(topB + (botB - topB) * t);
      const color = (r << 16) | (g << 8) | b;
      this.add.rectangle(worldWidth / 2, i * stripH + stripH / 2, worldWidth, stripH + 1, color);
    }
  }

  // ---- Dense cloud barrier ----
  private buildCloudLayer(_worldWidth: number): void {
    const clouds: { x: number; y: number; s: number; speed: number }[] = [
      { x: -20, y: 920, s: 1.8, speed: 15000 },
      { x: 80, y: 960, s: 2.2, speed: 18000 },
      { x: 200, y: 900, s: 1.6, speed: 13000 },
      { x: 320, y: 950, s: 2.0, speed: 16000 },
      { x: 50, y: 1000, s: 2.4, speed: 20000 },
      { x: 180, y: 1040, s: 1.9, speed: 17000 },
      { x: 300, y: 1020, s: 2.1, speed: 14000 },
      { x: -40, y: 1080, s: 2.3, speed: 19000 },
      { x: 120, y: 1100, s: 1.7, speed: 16000 },
      { x: 260, y: 1060, s: 2.0, speed: 15000 },
      { x: 380, y: 1120, s: 1.8, speed: 18000 },
      { x: 40, y: 1150, s: 2.2, speed: 21000 },
      { x: 160, y: 1170, s: 1.5, speed: 12000 },
    ];

    for (const c of clouds) {
      const cloud = this.add.image(c.x, c.y, "cloud").setScale(c.s).setAlpha(0.85);
      this.tweens.add({
        targets: cloud,
        x: c.x + 60,
        duration: c.speed,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  // ---- Dialogue / scenario logic ----

  private phoneRing(): void {
    this.state = "PHONE_RING";
    this.dialogueBox.showDialogue(
      "Телефон",
      "Входящий вызов: Бабушка...",
      () => this.showPhoneChoices(),
    );
  }

  private showPhoneChoices(): void {
    this.state = "WAITING_CHOICE";
    this.dialogueBox.showChoices([
      { text: "Взять трубку", callback: () => this.onAnswer() },
      { text: "Сбросить", callback: () => this.onDecline() },
    ]);
  }

  private onAnswer(): void {
    this.state = "ANSWER_GRANDMA";
    this.dialogueBox.showDialogue(
      "Бабушка",
      "Улым, исәнме... Бәрәңгене базга төшерәсе бар...",
      () => {
        this.state = "ANSWER_HERO";
        this.dialogueBox.showDialogue(
          "ГГ",
          "Бабуль, некогда, давай потом.",
          () => this.endCall(),
        );
      },
    );
  }

  private onDecline(): void {
    this.state = "DECLINE_THOUGHT";
    this.dialogueBox.showDialogue(
      "ГГ (Мысли)",
      "Опять про огород. Да и скучно там...",
      () => this.endCall(),
    );
  }

  private endCall(): void {
    this.state = "CALL_ENDED";
    this.dialogueBox.hide();
    console.log("QR замечен");
  }

  getState(): PrologueState {
    return this.state;
  }
}

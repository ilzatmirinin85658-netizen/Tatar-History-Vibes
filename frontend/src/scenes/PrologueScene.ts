import Phaser from "phaser";
import { DialogueBox } from "../ui/DialogueBox";

const WORLD_W = 390;
const WORLD_H = 3000;

// Roof/courtyard native size: 768×1376; scale to fit 390px width
const BG_SCALE = WORLD_W / 768; // ≈ 0.508
const LAYER_DISPLAY_H = Math.round(1376 * BG_SCALE); // ≈ 699

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
  private birdsLanded = 0;
  private birdSprites: Phaser.GameObjects.Sprite[] = [];

  constructor() {
    super({ key: "PrologueScene" });
  }

  create(): void {
    const { width, height } = this.scale;

    this.createAnimations();

    // ===== Global gradient background: #87CEEB → #333333 =====
    this.buildGlobalGradient(width);

    // ===== LAYER 1: Sky (Y: 0–1000) =====
    // Sun — frame 0, slow rotation
    const sun = this.add.sprite(width / 2, 200, "sun_anim", 0);
    sun.setScale(0.3);
    sun.setAlpha(0.9);
    this.tweens.add({
      targets: sun,
      angle: 360,
      duration: 20000,
      repeat: -1,
    });

    // Birds — fly once, then camera pans after all finish
    this.createBirds(width);

    // ===== LAYER 2: Cloud barrier (Y: 900–1300) =====
    this.buildCloudLayer();

    // ===== LAYER 3: Roof (pixel-perfect) =====
    const roofY = 1200;
    const roof = this.add.image(width / 2, roofY, "roof_grey").setOrigin(0.5, 0);
    roof.setDisplaySize(width, LAYER_DISPLAY_H);
    const roofBottom = roofY + LAYER_DISPLAY_H;

    // ===== LAYER 4: Wall (pixel-perfect TileSprite) =====
    // bg_courtyard bottom-aligned to WORLD_H, top at:
    const courtyardTop = WORLD_H - LAYER_DISPLAY_H;
    const wallHeight = courtyardTop - roofBottom;
    const wallTile = this.add
      .tileSprite(0, roofBottom, width, wallHeight, "wall")
      .setOrigin(0, 0);
    wallTile.setTileScale(0.5, 0.5);

    // ===== LAYER 5: Courtyard (pixel-perfect) =====
    const bg = this.add.image(width / 2, WORLD_H, "bg_courtyard").setOrigin(0.5, 1);
    bg.setScale(BG_SCALE);

    // Hero on the bench
    const hero = this.add.sprite(142, 2884, "hero_anim");
    hero.setScale(0.35);
    hero.play("hero_breathe");

    // ===== Dialogue box (fixed to viewport) =====
    const boxHeight = 150;
    this.dialogueBox = new DialogueBox({
      scene: this,
      x: 10,
      y: height - boxHeight - 10,
      width: width - 20,
      height: boxHeight,
    });
    this.dialogueBox.getContainer().setScrollFactor(0);

    // ===== Camera =====
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setScroll(0, 0);
    this.state = "INTRO_PAN";
  }

  // ---- Start camera pan (called after all birds land) ----
  private startCameraPan(): void {
    const { width } = this.scale;
    const cam = this.cameras.main;

    cam.pan(width / 2, 2900, 12000, "Sine.easeInOut", false, (_cam, progress) => {
      if (progress === 1) {
        this.time.delayedCall(500, () => this.phoneRing());
      }
    });
  }

  // ---- Animation definitions ----
  private createAnimations(): void {
    if (this.anims.exists("sun_pulse")) return;

    this.anims.create({
      key: "sun_pulse",
      frames: this.anims.generateFrameNumbers("sun_anim", { start: 0, end: 3 }),
      frameRate: 2,
      repeat: -1,
    });

    this.anims.create({
      key: "bird_fly",
      frames: this.anims.generateFrameNumbers("bird_anim", { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "hero_breathe",
      frames: this.anims.generateFrameNumbers("hero_anim", { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });
  }

  // ---- Global gradient: #87CEEB → #333333 ----
  private buildGlobalGradient(worldWidth: number): void {
    const steps = 30;
    const stripH = WORLD_H / steps;
    const topR = 0x87, topG = 0xce, topB = 0xeb;
    const botR = 0x33, botG = 0x33, botB = 0x33;

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(topR + (botR - topR) * t);
      const g = Math.round(topG + (botG - topG) * t);
      const b = Math.round(topB + (botB - topB) * t);
      const color = (r << 16) | (g << 8) | b;
      this.add.rectangle(worldWidth / 2, i * stripH + stripH / 2, worldWidth, stripH + 1, color);
    }
  }

  // ---- Birds: fly once across the sky, then trigger camera ----
  private createBirds(worldWidth: number): void {
    const birdData = [
      { startX: -100, y: 200, scale: 0.08, dur: 6000, delay: 0 },
      { startX: -100, y: 350, scale: 0.06, dur: 7000, delay: 1000 },
      { startX: -100, y: 280, scale: 0.07, dur: 6500, delay: 500 },
      { startX: -100, y: 450, scale: 0.05, dur: 8000, delay: 300 },
    ];

    this.birdsLanded = 0;
    this.birdSprites = [];

    for (const b of birdData) {
      const bird = this.add.sprite(b.startX, b.y, "bird_anim");
      bird.setScale(b.scale);
      bird.play("bird_fly");
      this.birdSprites.push(bird);

      // First pass — no repeat
      this.tweens.add({
        targets: bird,
        x: worldWidth + 100,
        duration: b.dur,
        delay: b.delay,
        onComplete: () => {
          this.birdsLanded++;
          if (this.birdsLanded >= birdData.length) {
            this.startCameraPan();
            this.startBirdLoop(worldWidth);
          }
        },
      });
    }
  }

  // ---- After first pass, birds loop infinitely ----
  private startBirdLoop(worldWidth: number): void {
    for (const bird of this.birdSprites) {
      bird.x = -100;
      bird.y = Phaser.Math.Between(150, 500);
      this.tweens.add({
        targets: bird,
        x: worldWidth + 100,
        duration: Phaser.Math.Between(8000, 14000),
        repeat: -1,
        onRepeat: () => {
          bird.x = -100;
          bird.y = Phaser.Math.Between(150, 500);
        },
      });
    }
  }

  // ---- Dense cloud barrier (Y: 900–1300) ----
  private buildCloudLayer(): void {
    const clouds = [
      { x: -20, y: 920, s: 1.8 }, { x: 100, y: 960, s: 2.2 },
      { x: 220, y: 900, s: 1.6 }, { x: 340, y: 950, s: 2.0 },
      { x: 50, y: 1000, s: 2.4 }, { x: 180, y: 1040, s: 1.9 },
      { x: 300, y: 1020, s: 2.1 }, { x: -40, y: 1080, s: 2.3 },
      { x: 120, y: 1100, s: 1.7 }, { x: 260, y: 1060, s: 2.0 },
      { x: 380, y: 1120, s: 1.8 }, { x: 40, y: 1150, s: 2.2 },
      { x: 160, y: 1170, s: 1.5 }, { x: -10, y: 1200, s: 2.0 },
      { x: 200, y: 1230, s: 1.8 }, { x: 80, y: 1260, s: 2.1 },
      { x: 310, y: 1190, s: 1.9 }, { x: 420, y: 1250, s: 1.6 },
      { x: -30, y: 1280, s: 2.3 }, { x: 150, y: 1300, s: 1.7 },
    ];

    for (const c of clouds) {
      const cloud = this.add.image(c.x, c.y, "cloud").setScale(c.s).setAlpha(0.85);
      const drift = Phaser.Math.Between(30, 70);
      const speed = Phaser.Math.Between(12000, 22000);
      this.tweens.add({
        targets: cloud,
        x: c.x + drift,
        duration: speed,
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

import Phaser from "phaser";
import { DialogueBox } from "../ui/DialogueBox";

const WORLD_W = 390;
const WORLD_H = 4000;

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
  private birdSprites: Phaser.GameObjects.Sprite[] = [];
  private birdsLanded = 0;

  constructor() {
    super({ key: "PrologueScene" });
  }

  create(): void {
    const { width, height } = this.scale;

    this.createAnimations();

    // ============================================================
    // LAYER 1: SKY — gradient 2000px tall
    // ============================================================
    this.buildSkyGradient(width);

    // ============================================================
    // LAYER 2: SUN — static image, slow rotation
    // ============================================================
    const sun = this.add.image(width / 2, 400, "sun_static");
    sun.setOrigin(0.5);
    sun.setScale(0.5);
    this.tweens.add({
      targets: sun,
      angle: 360,
      duration: 60000,
      repeat: -1,
    });

    // ============================================================
    // LAYER 3: BIRDS — fly across the sky at Y≈500
    // ============================================================
    this.createBirds(width);

    // ============================================================
    // LAYER 5: WALL — TileSprite from Y=1800 to Y=3500 (below clouds)
    // Placed BEFORE clouds and roof so they overlap on top.
    // ============================================================
    const wallTile = this.add
      .tileSprite(width / 2, 2650, width, 1700, "wall_img")
      .setOrigin(0.5, 0.5);
    wallTile.setTileScale(0.5, 0.5);

    // ============================================================
    // LAYER 6: ROOF — bottom edge at Y=1800, overlaps clouds+wall
    // ============================================================
    const roof = this.add.image(width / 2, 1800, "roof_grey");
    roof.setOrigin(0.5, 1);
    roof.setDisplaySize(width, roof.height * (width / roof.width));

    // ============================================================
    // LAYER 4: CLOUDS — "belt" masking the sky→city transition
    // ============================================================
    this.buildCloudLayer();

    // ============================================================
    // LAYER 7: COURTYARD — bottom-aligned at Y=4000
    // ============================================================
    const bg = this.add.image(width / 2, WORLD_H, "bg_courtyard");
    bg.setOrigin(0.5, 1);
    bg.setScale(width / bg.width);

    // ============================================================
    // LAYER 8: HERO — on the bench
    // ============================================================
    const hero = this.add.sprite(142, 3900, "hero_anim");
    hero.setScale(0.35);
    hero.play("hero_breathe");

    // ============================================================
    // DIALOGUE BOX — fixed to viewport
    // ============================================================
    const boxHeight = 150;
    this.dialogueBox = new DialogueBox({
      scene: this,
      x: 10,
      y: height - boxHeight - 10,
      width: width - 20,
      height: boxHeight,
    });
    this.dialogueBox.getContainer().setScrollFactor(0);

    // ============================================================
    // CAMERA — start at sky, wait for birds, then pan
    // ============================================================
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setScroll(0, 0);
    this.state = "INTRO_PAN";
  }

  // ---- Camera pan triggered after birds ----
  private startCameraPan(): void {
    const { width } = this.scale;
    this.cameras.main.pan(
      width / 2,
      3900,
      8000,
      "Sine.easeInOut",
      false,
      (_cam, progress) => {
        if (progress === 1) {
          this.time.delayedCall(500, () => this.phoneRing());
        }
      },
    );
  }

  // ---- Animations ----
  private createAnimations(): void {
    if (this.anims.exists("bird_fly")) return;

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

  // ---- Sky gradient: #87CEEB → white, 2000px tall ----
  private buildSkyGradient(worldWidth: number): void {
    const gradientH = 2000;
    const steps = 20;
    const stripH = gradientH / steps;
    const topR = 0x87, topG = 0xce, topB = 0xeb;
    const botR = 0xff, botG = 0xff, botB = 0xff;

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(topR + (botR - topR) * t);
      const g = Math.round(topG + (botG - topG) * t);
      const b = Math.round(topB + (botB - topB) * t);
      const color = (r << 16) | (g << 8) | b;
      this.add.rectangle(
        worldWidth / 2,
        i * stripH + stripH / 2,
        worldWidth,
        stripH + 1,
        color,
      );
    }
  }

  // ---- Birds: single pass then trigger camera ----
  private createBirds(worldWidth: number): void {
    const birdData = [
      { x: -100, y: 450, scale: 0.08, dur: 5000, delay: 0 },
      { x: -100, y: 550, scale: 0.06, dur: 6000, delay: 800 },
      { x: -100, y: 500, scale: 0.07, dur: 5500, delay: 400 },
    ];

    this.birdsLanded = 0;
    this.birdSprites = [];

    for (const b of birdData) {
      const bird = this.add.sprite(b.x, b.y, "bird_anim");
      bird.setScale(b.scale);
      bird.play("bird_fly");
      this.birdSprites.push(bird);

      this.tweens.add({
        targets: bird,
        x: worldWidth + 100,
        duration: b.dur,
        delay: b.delay,
        onComplete: () => {
          this.birdsLanded++;
          if (this.birdsLanded >= birdData.length) {
            this.startCameraPan();
            this.loopBirds(worldWidth);
          }
        },
      });
    }
  }

  private loopBirds(worldWidth: number): void {
    for (const bird of this.birdSprites) {
      bird.x = -100;
      bird.y = Phaser.Math.Between(350, 600);
      this.tweens.add({
        targets: bird,
        x: worldWidth + 100,
        duration: Phaser.Math.Between(8000, 13000),
        repeat: -1,
        onRepeat: () => {
          bird.x = -100;
          bird.y = Phaser.Math.Between(350, 600);
        },
      });
    }
  }

  // ---- Cloud belt: Y 1500–1800, 20 clouds ----
  private buildCloudLayer(): void {
    const clouds = [
      { x: -30, y: 1500, s: 2.0 }, { x: 80, y: 1530, s: 2.4 },
      { x: 200, y: 1510, s: 1.8 }, { x: 330, y: 1540, s: 2.2 },
      { x: 50, y: 1570, s: 2.6 }, { x: 170, y: 1600, s: 2.0 },
      { x: 300, y: 1580, s: 2.3 }, { x: -20, y: 1620, s: 2.5 },
      { x: 120, y: 1650, s: 1.9 }, { x: 260, y: 1630, s: 2.1 },
      { x: 400, y: 1660, s: 2.0 }, { x: 40, y: 1690, s: 2.4 },
      { x: 160, y: 1710, s: 1.7 }, { x: -10, y: 1730, s: 2.3 },
      { x: 220, y: 1740, s: 2.0 }, { x: 350, y: 1720, s: 1.8 },
      { x: 80, y: 1760, s: 2.5 }, { x: 310, y: 1770, s: 2.1 },
      { x: -40, y: 1790, s: 2.2 }, { x: 150, y: 1800, s: 1.9 },
    ];

    for (const c of clouds) {
      const cloud = this.add.image(c.x, c.y, "cloud").setScale(c.s).setAlpha(0.9);
      this.tweens.add({
        targets: cloud,
        x: c.x + Phaser.Math.Between(30, 70),
        duration: Phaser.Math.Between(12000, 20000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  // ---- Dialogue logic ----

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

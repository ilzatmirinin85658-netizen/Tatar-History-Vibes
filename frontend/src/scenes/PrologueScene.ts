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

  constructor() {
    super({ key: "PrologueScene" });
  }

  create(): void {
    const { width, height } = this.scale;

    this.createAnimations();

    // ==========================================================
    // SKY — gradient #87CEEB → white, 1200px tall
    // ==========================================================
    this.buildSkyGradient(width);

    // ==========================================================
    // SUN — single image, slow rotation
    // ==========================================================
    const sun = this.add.image(width / 2, 300, "sun");
    sun.setOrigin(0.5);
    sun.setScale(0.5);
    this.tweens.add({
      targets: sun,
      angle: 360,
      duration: 60000,
      repeat: -1,
    });

    // ==========================================================
    // BIRDS — 3 sprites, fly once left→right, then destroy
    // ==========================================================
    this.createBirds(width);

    // ==========================================================
    // Lower layers (kept for context, not the focus)
    // ==========================================================

    // Wall (behind everything below clouds)
    const wallTile = this.add
      .tileSprite(width / 2, 2650, width, 1700, "wall_img")
      .setOrigin(0.5, 0.5);
    wallTile.setTileScale(0.5, 0.5);

    // Roof — bottom edge at Y=1200, overlaps wall top
    const roof = this.add.image(width / 2, 1200, "roof_grey");
    roof.setOrigin(0.5, 1);
    roof.setDisplaySize(width, roof.height * (width / roof.width));

    // CLOUDS — transition belt Y=1100..1200, masks sky→roof seam
    this.buildCloudBelt();

    // Courtyard
    const bg = this.add.image(width / 2, WORLD_H, "bg_courtyard");
    bg.setOrigin(0.5, 1);
    bg.setScale(width / bg.width);

    // Hero
    const hero = this.add.sprite(142, 3900, "hero_anim");
    hero.setScale(0.35);
    hero.play("hero_breathe");

    // ==========================================================
    // DIALOGUE BOX — fixed to viewport
    // ==========================================================
    const boxHeight = 150;
    this.dialogueBox = new DialogueBox({
      scene: this,
      x: 10,
      y: height - boxHeight - 10,
      width: width - 20,
      height: boxHeight,
    });
    this.dialogueBox.getContainer().setScrollFactor(0);

    // ==========================================================
    // CAMERA — fixed at Y=0 for now (sky tuning mode)
    // Pan disabled; phone call on a timer so dialogue stays testable
    // ==========================================================
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setScroll(0, 0);
    this.state = "INTRO_PAN";

    // Trigger phone call after birds finish (~10s)
    this.time.delayedCall(10000, () => this.phoneRing());
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

  // ---- Sky gradient: #87CEEB → white, 1200px ----
  private buildSkyGradient(worldWidth: number): void {
    const gradH = 1200;
    const steps = 20;
    const stripH = gradH / steps;
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

  // ---- Birds: fly once, destroy on complete ----
  private createBirds(worldWidth: number): void {
    const birdData = [
      { y: 380, scale: 0.08, dur: 7000, delay: 0 },
      { y: 440, scale: 0.06, dur: 8000, delay: 1200 },
      { y: 410, scale: 0.07, dur: 7500, delay: 600 },
    ];

    for (const b of birdData) {
      const bird = this.add.sprite(-100, b.y, "bird_anim");
      bird.setScale(b.scale);
      bird.play("bird_fly");

      this.tweens.add({
        targets: bird,
        x: worldWidth + 100,
        duration: b.dur,
        delay: b.delay,
        onComplete: () => {
          bird.destroy();
        },
      });
    }
  }

  // ---- Cloud belt: Y=1100..1200, masks sky→roof transition ----
  private buildCloudBelt(): void {
    const clouds = [
      { x: -20, y: 1100 }, { x: 80, y: 1115 }, { x: 190, y: 1105 },
      { x: 300, y: 1120 }, { x: 400, y: 1110 }, { x: 40, y: 1135 },
      { x: 150, y: 1145 }, { x: 260, y: 1130 }, { x: 370, y: 1150 },
      { x: -10, y: 1160 }, { x: 100, y: 1170 }, { x: 220, y: 1165 },
      { x: 340, y: 1180 }, { x: 50, y: 1190 }, { x: 170, y: 1200 },
    ];

    for (const c of clouds) {
      const s = Phaser.Math.FloatBetween(0.8, 1.2);
      const cloud = this.add.image(c.x, c.y, "cloud").setScale(s).setAlpha(0.7);
      const drift = Phaser.Math.Between(30, 50);
      this.tweens.add({
        targets: cloud,
        x: c.x + drift,
        duration: Phaser.Math.Between(14000, 22000),
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

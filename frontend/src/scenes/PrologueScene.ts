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
    // SKY BACKGROUND — sky_bg.png stretched to screen width
    // ==========================================================
    const skyBg = this.add.image(width / 2, 0, "sky_bg").setOrigin(0.5, 0);
    skyBg.setDisplaySize(width, skyBg.height * (width / skyBg.width));
    const skyHeight = skyBg.displayHeight; // ≈ 683

    // ==========================================================
    // SUN — single image, slow rotation
    // ==========================================================
    const sun = this.add.image(width / 2, 300, "sun");
    sun.setOrigin(0.5);
    sun.setScale(2.5);
    this.tweens.add({
      targets: sun,
      angle: 360,
      duration: 600000,
      repeat: -1,
    });

    // ==========================================================
    // BIRDS — 3 sprites, fly once left→right, then destroy
    // ==========================================================
    this.createBirds(width);

    // ==========================================================
    // LOWER LAYERS — roof starts exactly where sky ends
    // ==========================================================

    // Wall (behind roof and courtyard)
    const wallTile = this.add
      .tileSprite(width / 2, 2650, width, 1700, "wall_img")
      .setOrigin(0.5, 0.5);
    wallTile.setTileScale(0.5, 0.5);

    // Roof — top edge at skyHeight
    const roof = this.add.image(width / 2, skyHeight, "roof_grey").setOrigin(0.5, 0);
    roof.setDisplaySize(width, roof.height * (width / roof.width));

    // CLOUDS — seam mask at sky→roof transition
    this.buildCloudBelt(skyHeight);

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

  // ---- Cloud belt at sky→roof seam ----
  private buildCloudBelt(skyHeight: number): void {
    const seamY = skyHeight - 200;
    const clouds = [
      { x: -20, dy: 0 }, { x: 80, dy: 15 }, { x: 190, dy: 5 },
      { x: 300, dy: 20 }, { x: 400, dy: 10 }, { x: 40, dy: 35 },
      { x: 150, dy: 45 }, { x: 260, dy: 30 }, { x: 370, dy: 50 },
      { x: -10, dy: 60 }, { x: 100, dy: 70 }, { x: 220, dy: 65 },
    ];

    for (const c of clouds) {
      const s = Phaser.Math.FloatBetween(0.8, 1.2);
      const cloud = this.add.image(c.x, seamY + c.dy, "cloud").setScale(s).setAlpha(0.8);
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

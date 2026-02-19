import Phaser from "phaser";
import { DialogueBox } from "../ui/DialogueBox";

const WORLD_W = 390;
const WORLD_H = 5000;

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
    skyBg.setDepth(0);

    // ==========================================================
    // SEAM-HIDING CURTAIN — solid rect from sky bottom to roof
    // ==========================================================
    const curtainY = skyBg.y + skyBg.displayHeight;
    const roofY = 2050;
    const curtainH = roofY - curtainY;
    const curtain = this.add.graphics();
    curtain.fillStyle(0xdff2f8, 1);
    curtain.fillRect(0, curtainY, width, curtainH);
    curtain.setDepth(0.5);

    // ==========================================================
    // SUN — static image, no rotation
    // ==========================================================
    const sun = this.add.image(width / 2, 400, "sun");
    sun.setOrigin(0.5);
    sun.setScale(0.5);
    sun.setDepth(1);

    // ==========================================================
    // BIRDS — 3 sprites in V-formation
    // ==========================================================
    this.createBirds();

    // ==========================================================
    // LOWER LAYERS — roof starts exactly where sky ends
    // ==========================================================

    // Wall (behind roof and courtyard)
    const wallTile = this.add
      .tileSprite(width / 2, 3450, width, 1700, "wall_img")
      .setOrigin(0.5, 0.5);
    wallTile.setTileScale(0.5, 0.5);

    // Roof — starts UNDER the clouds
    const roof = this.add.image(width / 2, roofY, "roof_grey").setOrigin(0.5, 0);
    roof.setDisplaySize(width, roof.height * (width / roof.width));
    roof.setDepth(0);

    // CLOUDS — 12 sprites forming smog gradient
    this.buildCloudBelt();

    // Courtyard
    const bg = this.add.image(width / 2, WORLD_H, "bg_courtyard");
    bg.setOrigin(0.5, 1);
    bg.setScale(width / bg.width);

    // Hero
    const hero = this.add.sprite(142, 4700, "hero_anim");
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
    // CAMERA — epic pan from sky through smog to hero
    // ==========================================================
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setScroll(0, 0);
    this.state = "INTRO_PAN";

    // Wait for birds to pass, then slow pan down
    this.time.delayedCall(3000, () => {
      cam.pan(width / 2, 4700, 15000, "Sine.easeInOut");
    });
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

  // ---- Birds: 3 sprites in V-formation, fly left→right ----
  private createBirds(): void {
    const { width } = this.scale;
    const birdData = [
      { x: -100, y: 350, scale: 0.1, delay: 0 },     // leader
      { x: -140, y: 320, scale: 0.09, delay: 200 },   // left wing
      { x: -140, y: 380, scale: 0.09, delay: 200 },   // right wing
    ];

    for (const b of birdData) {
      const bird = this.add.sprite(b.x, b.y, "bird_anim");
      bird.setScale(b.scale);
      bird.setDepth(1.5);
      bird.play("bird_fly");

      this.tweens.add({
        targets: bird,
        x: width + 100,
        duration: 8000,
        delay: b.delay,
        onComplete: () => bird.destroy(),
      });
    }
  }

  // ---- 12 clouds: smog gradient from sky to roof ----
  private buildCloudBelt(): void {
    const cloudData: { x: number; y: number; tint?: number }[] = [
      { x: 222, y: 1137 },
      { x: 250, y: 1215 },
      { x: 205, y: 1523 },
      { x: 156, y: 1262 },
      { x: 242, y: 1329 },
      { x: 212, y: 1481 },
      { x: 166, y: 1584, tint: 0xcccccc },
      { x: 144, y: 1742, tint: 0xaaaaaa },
      { x: 179, y: 1891, tint: 0x888888 },
      { x: 255, y: 1772, tint: 0x888888 },
      { x: 192, y: 1955, tint: 0x666666 },
      { x: 225, y: 1975, tint: 0x666666 },
    ];

    for (const pos of cloudData) {
      const cloud = this.add
        .image(pos.x, pos.y, "cloud")
        .setScale(0.9)
        .setAlpha(0.8)
        .setDepth(50);
      if (pos.tint) cloud.setTint(pos.tint);

      this.tweens.add({
        targets: cloud,
        y: pos.y + 15,
        duration: 4000,
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

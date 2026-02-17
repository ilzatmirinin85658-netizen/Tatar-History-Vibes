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
    skyBg.setDepth(0);
    const skyHeight = skyBg.displayHeight; // ≈ 683

    // ==========================================================
    // SUN — static image, no rotation
    // ==========================================================
    const sun = this.add.image(width / 2, 400, "sun");
    sun.setOrigin(0.5);
    sun.setScale(0.5);
    sun.setDepth(1);

    // ==========================================================
    // BIRDS — 2 sprites, fly once left→right, then destroy
    // ==========================================================
    const birds = this.createBirds(width);

    // ==========================================================
    // LOWER LAYERS — roof starts exactly where sky ends
    // ==========================================================

    // Wall (behind roof and courtyard)
    const wallTile = this.add
      .tileSprite(width / 2, 2650, width, 1700, "wall_img")
      .setOrigin(0.5, 0.5);
    wallTile.setTileScale(0.5, 0.5);

    // Roof — starts UNDER the clouds
    const roof = this.add.image(width / 2, 1250, "roof_grey").setOrigin(0.5, 0);
    roof.setDisplaySize(width, roof.height * (width / roof.width));
    roof.setDepth(0);

    // CLOUDS — 5 large sprites at Y≈1200, below first screen
    const clouds = this.buildCloudBelt();

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
    // CAMERA — start at sky, then pan down to hero
    // ==========================================================
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setScroll(0, 0);
    this.state = "INTRO_PAN";

    // Wait 2s at the sky, then pan to hero over 11s
    this.time.delayedCall(2000, () => {
      cam.pan(width / 2, 3900, 11000, "Sine.easeInOut");
    });

    // ==========================================================
    // DEBUG DRAG-AND-DROP — move objects to find ideal positions
    // ==========================================================
    const draggables = [sun, ...clouds, ...birds, hero];
    for (const obj of draggables) {
      obj.setInteractive();
    }
    this.input.setDraggable(draggables);
    this.input.on('drag', function (
      _pointer: Phaser.Input.Pointer,
      gameObject: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
      dragX: number,
      dragY: number,
    ) {
      gameObject.x = dragX;
      gameObject.y = dragY;
      console.log('Object moved to:', Math.round(dragX), Math.round(dragY));
    });

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

  // ---- Birds: 2 small sprites, fly once left→right, then destroy ----
  private createBirds(_worldWidth: number): Phaser.GameObjects.Sprite[] {
    const { width } = this.scale;
    const birdData = [
      { y: 350, scale: 0.1, delay: 0 },
      { y: 400, scale: 0.08, delay: 500 },
    ];
    const sprites: Phaser.GameObjects.Sprite[] = [];

    for (const b of birdData) {
      const bird = this.add.sprite(-200, b.y, "bird_anim");
      bird.setScale(b.scale);
      bird.setDepth(1.5);
      bird.play("bird_fly");
      console.log("Bird width:", bird.width * bird.scaleX);

      this.tweens.add({
        targets: bird,
        x: width + 200,
        duration: 7000,
        delay: b.delay,
        onComplete: () => {
          bird.destroy();
        },
      });
      sprites.push(bird);
    }
    return sprites;
  }

  // ---- 5 large clouds at Y≈1200 ----
  private buildCloudBelt(): Phaser.GameObjects.Image[] {
    const { width } = this.scale;
    const sprites: Phaser.GameObjects.Image[] = [];

    for (let i = 0; i < 5; i++) {
      const x = (width / 5) * i + width / 10;
      const y = Phaser.Math.Between(1150, 1250);
      const s = Phaser.Math.FloatBetween(0.8, 1.2);
      const cloud = this.add
        .image(x, y, "cloud")
        .setScale(s)
        .setAlpha(0.8)
        .setDepth(50);

      const drift = Phaser.Math.Between(20, 40);
      this.tweens.add({
        targets: cloud,
        x: x + drift,
        duration: Phaser.Math.Between(14000, 22000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      sprites.push(cloud);
    }
    return sprites;
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

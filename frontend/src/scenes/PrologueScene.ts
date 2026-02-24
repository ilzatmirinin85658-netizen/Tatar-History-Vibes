import Phaser from "phaser";
import { DialogueBox } from "../ui/DialogueBox";

const WORLD_W = 390;

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
    const curtainBottom = 1800;
    const curtainH = curtainBottom - curtainY;
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
    // LOWER LAYERS — roof + courtyard (seamless, no wall needed)
    // ==========================================================

    // Roof — fits screen width at Y = 1800
    const roofY = 1800;
    const roof = this.add.image(width / 2, roofY, "roof_grey").setOrigin(0.5, 0);
    const roofScaleVal = width / roof.width;
    roof.setDisplaySize(width, roof.height * roofScaleVal);
    roof.setDepth(5);

    // Courtyard — placed directly under roof
    const bg = this.add.image(width / 2, roof.y + roof.displayHeight, "bg_courtyard")
      .setOrigin(0.5, 0);
    const bgScaleVal = width / bg.width;
    bg.setDisplaySize(width, bg.height * bgScaleVal);
    bg.setDepth(5);

    // Update world height to match bottom of courtyard
    const worldH = bg.y + bg.displayHeight;

    // CLOUDS — 12 sprites forming smog gradient
    this.buildCloudBelt();

    // Hero
    const hero = this.add.sprite(142, roof.y + roof.displayHeight + 400, "hero_anim");
    hero.setScale(0.35);
    hero.setName("hero");
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
    // EDITOR — drag clouds and hero, log positions to console
    // ==========================================================
    hero.setInteractive({ draggable: true });
    this.input.setDraggable(hero);

    this.input.on(
      "drag",
      (
        _pointer: Phaser.Input.Pointer,
        obj: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
        dragX: number,
        dragY: number,
      ) => {
        obj.x = dragX;
        obj.y = dragY;
        console.log(
          `[${obj.name}] X: ${Math.round(dragX)}, Y: ${Math.round(dragY)}`,
        );
      },
    );

    // ==========================================================
    // CAMERA
    // ==========================================================
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, worldH);
    cam.setScroll(0, 0);
    this.state = "INTRO_PAN";

    // Auto-pan commented out for editor mode
    // this.time.delayedCall(8000, () => {
    //   cam.pan(width / 2, 3900, 15000, "Sine.easeInOut");
    // });

    // ==========================================================
    // MANUAL CAMERA — UP/DOWN or W/S
    // ==========================================================
    const cursors = this.input.keyboard!.createCursorKeys();
    const keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    const keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    this.events.on("update", () => {
      const speed = 20;
      if (cursors.up.isDown || keyW.isDown) {
        cam.scrollY -= speed;
      }
      if (cursors.down.isDown || keyS.isDown) {
        cam.scrollY += speed;
      }
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

    cloudData.forEach((pos, i) => {
      const cloud = this.add
        .image(pos.x, pos.y, "cloud")
        .setScale(0.9)
        .setAlpha(0.8)
        .setDepth(10);
      cloud.setName(`cloud_${i}`);
      cloud.setInteractive({ draggable: true });
      this.input.setDraggable(cloud);
      if (pos.tint) cloud.setTint(pos.tint);

      this.tweens.add({
        targets: cloud,
        y: pos.y + 15,
        duration: 4000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  getState(): PrologueState {
    return this.state;
  }
}

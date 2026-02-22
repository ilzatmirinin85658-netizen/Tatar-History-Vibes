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
    // PIGEONS on the roof — animated sprites
    // ==========================================================
    const pigeon0 = this.add.sprite(116, 2421, "pigeon_0");
    pigeon0.setScale(0.15);
    pigeon0.setFlipX(true);
    pigeon0.setFrame(0);
    pigeon0.setDepth(60);

    const pigeon1 = this.add.sprite(277, 2501, "pigeon_1");
    pigeon1.setScale(0.15);
    pigeon1.setDepth(60);
    pigeon1.play("pigeon_idle_1");

    const pigeon2 = this.add.sprite(101, 2543, "pigeon_2");
    pigeon2.setScale(0.15);
    pigeon2.setDepth(60);
    pigeon2.play("pigeon_idle_2");

    // ==========================================================
    // CAMERA — sky → roof pause → pigeon takeoff → hero
    // ==========================================================
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setScroll(0, 0);
    this.state = "INTRO_PAN";

    // Step 1: Pause 2s at sky, then pan to roof
    this.time.delayedCall(2000, () => {
      // Step 2: Pan to roof center (Y=2500) over 8s
      cam.pan(width / 2, 2500, 8000, "Sine.easeInOut", false, (_cam, progress) => {
        if (progress === 1) {
          // Step 3: Arrived at roof — pause, then pigeon_0 takes off
          this.time.delayedCall(1000, () => {
            pigeon0.play("pigeon_fly");
            this.tweens.add({
              targets: pigeon0,
              x: -100,
              y: 2200,
              duration: 2500,
              ease: "Sine.easeOut",
              onComplete: () => pigeon0.destroy(),
            });
          });

          // Step 4: After watching takeoff, continue to hero
          this.time.delayedCall(3500, () => {
            cam.pan(width / 2, 4700, 8000, "Sine.easeInOut");
          });
        }
      });
    });

    // ==========================================================
    // MANUAL CAMERA — UP/DOWN or W/S (debug override)
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

    // Pigeon animations
    this.anims.create({
      key: "pigeon_fly",
      frames: this.anims.generateFrameNumbers("pigeon_0", { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: "pigeon_idle_1",
      frames: this.anims.generateFrameNumbers("pigeon_1", { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: "pigeon_idle_2",
      frames: this.anims.generateFrameNumbers("pigeon_2", { start: 0, end: 3 }),
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

  getState(): PrologueState {
    return this.state;
  }
}

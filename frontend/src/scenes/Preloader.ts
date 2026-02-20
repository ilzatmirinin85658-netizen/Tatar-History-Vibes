import Phaser from "phaser";
import bgImg from "../assets/images/bg_courtyard.png";
import cloudImg from "../assets/images/cloud.png";
import roofImg from "../assets/images/roof_grey.png";
import wallImg from "../assets/images/wall.png";
import sunImg from "../assets/images/sun.png";
import skyBgImg from "../assets/images/sky_bg.png";
import birdSheetImg from "../assets/images/bird_sheet.png";
import heroSheetImg from "../assets/images/hero_sheet.png";
import pigeonSheetImg from "../assets/images/pigeon_sheet.png";
import pigeonSheet1Img from "../assets/images/pigeon_sheet1.png";
import pigeonSheet2Img from "../assets/images/pigeon_sheet2.png";

export class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: "Preloader" });
  }

  preload(): void {
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    const box = this.add.graphics();

    box.fillStyle(0x222222, 0.8);
    box.fillRect(width / 4, height / 2 - 15, width / 2, 30);

    this.load.on("progress", (value: number) => {
      bar.clear();
      bar.fillStyle(0x44aa88, 1);
      bar.fillRect(width / 4 + 4, height / 2 - 11, (width / 2 - 8) * value, 22);
    });

    this.load.on("complete", () => {
      bar.destroy();
      box.destroy();
    });

    // Static images
    this.load.image("bg_courtyard", bgImg);
    this.load.image("cloud", cloudImg);
    this.load.image("roof_grey", roofImg);
    this.load.image("wall_img", wallImg);
    this.load.image("sun", sunImg);
    this.load.image("sky_bg", skyBgImg);

    // Spritesheets
    this.load.spritesheet("bird_anim", birdSheetImg, {
      frameWidth: 320,
      frameHeight: 698,
    });
    this.load.spritesheet("hero_anim", heroSheetImg, {
      frameWidth: 320,
      frameHeight: 675,
    });

    // Pigeon spritesheets (4 frames, 128×128 each)
    this.load.spritesheet("pigeon_0", pigeonSheetImg, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet("pigeon_1", pigeonSheet1Img, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet("pigeon_2", pigeonSheet2Img, {
      frameWidth: 128,
      frameHeight: 128,
    });
  }

  create(): void {
    this.ensureTexture("bg_courtyard", 390, 844, 0x2d4a3e);
    this.ensureTexture("cloud", 170, 60, 0xffffff);
    this.ensureTexture("roof_grey", 390, 300, 0x888888);
    this.ensureTexture("wall_img", 128, 128, 0x555555);
    this.ensureTexture("sun", 200, 200, 0xffe066);
    this.ensureTexture("sky_bg", 390, 680, 0x87ceeb);

    this.scene.start("PrologueScene");
  }

  private ensureTexture(key: string, w: number, h: number, color: number): void {
    const tex = this.textures.get(key);
    if (!tex || tex.key === "__MISSING") {
      const g = this.make.graphics();
      g.fillStyle(color, 1);
      g.fillRect(0, 0, w, h);
      g.generateTexture(key, w, h);
      g.destroy();
    }
  }
}

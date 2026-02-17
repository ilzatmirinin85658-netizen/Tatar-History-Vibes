import Phaser from "phaser";
import bgImg from "../assets/images/bg_courtyard.png";
import cloudImg from "../assets/images/cloud.png";
import roofImg from "../assets/images/roof_grey.png";
import wallImg from "../assets/images/wall.png";
import sunSheetImg from "../assets/images/sun_sheet.png";
import birdSheetImg from "../assets/images/bird_sheet.png";
import heroSheetImg from "../assets/images/hero_sheet.png";

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

    // Static assets
    this.load.image("bg_courtyard", bgImg);
    this.load.image("cloud", cloudImg);
    this.load.image("roof_grey", roofImg);
    this.load.image("wall", wallImg);

    // Spritesheets (frame sizes derived from actual image dimensions)
    // sun_sheet.png: 706×1280 → 1 col × 4 rows
    this.load.spritesheet("sun_anim", sunSheetImg, {
      frameWidth: 706,
      frameHeight: 320,
    });
    // bird_sheet.png: 1280×698 → 4 cols × 1 row
    this.load.spritesheet("bird_anim", birdSheetImg, {
      frameWidth: 320,
      frameHeight: 698,
    });
    // hero_sheet.png: 1280×675 → 4 cols × 1 row
    this.load.spritesheet("hero_anim", heroSheetImg, {
      frameWidth: 320,
      frameHeight: 675,
    });
  }

  create(): void {
    this.ensureTexture("bg_courtyard", 390, 844, 0x2d4a3e);
    this.ensureTexture("cloud", 170, 60, 0xffffff);
    this.ensureTexture("roof_grey", 390, 300, 0x888888);
    this.ensureTexture("wall", 128, 128, 0x555555);

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

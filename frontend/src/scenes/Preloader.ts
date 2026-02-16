import Phaser from "phaser";
import bgImg from "../assets/images/bg_courtyard.png";
import heroSittingImg from "../assets/images/hero_sitting_nobench.png";
import trashcanImg from "../assets/images/trashcan.png";

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

    this.load.image("bg_courtyard", bgImg);
    this.load.image("hero_sitting", heroSittingImg);
    this.load.image("trashcan", trashcanImg);
  }

  create(): void {
    this.ensureTexture("bg_courtyard", 390, 844, 0x2d4a3e);
    this.ensureTexture("hero_sitting", 64, 96, 0xe8a87c);
    this.ensureTexture("trashcan", 48, 56, 0x888888);
    this.generateCloud();

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

  private generateCloud(): void {
    if (this.textures.exists("cloud")) return;
    const g = this.make.graphics();
    g.fillStyle(0xffffff, 0.8);
    g.fillEllipse(50, 30, 80, 40);
    g.fillEllipse(90, 25, 70, 35);
    g.fillEllipse(130, 30, 60, 30);
    g.generateTexture("cloud", 170, 60);
    g.destroy();
  }
}

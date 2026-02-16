import Phaser from "phaser";
import { Preloader } from "./scenes/Preloader";
import { PrologueScene } from "./scenes/PrologueScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  parent: "game-container",
  backgroundColor: "#1a1a2e",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Preloader, PrologueScene],
};

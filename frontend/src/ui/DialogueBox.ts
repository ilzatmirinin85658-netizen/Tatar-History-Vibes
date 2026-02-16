import Phaser from "phaser";

export interface DialogueBoxConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
}

/**
 * Reusable dialogue box with speaker name and typewriter text effect.
 */
export class DialogueBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private speakerText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private timer?: Phaser.Time.TimerEvent;
  private fullMessage = "";
  private charIndex = 0;
  private padding: number;
  private boxWidth: number;

  constructor(config: DialogueBoxConfig) {
    this.scene = config.scene;
    this.padding = config.padding ?? 16;
    this.boxWidth = config.width;

    // Semi-transparent background
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.75);
    this.background.fillRoundedRect(0, 0, config.width, config.height, 12);
    this.background.lineStyle(2, 0xffffff, 0.3);
    this.background.strokeRoundedRect(0, 0, config.width, config.height, 12);

    // Speaker name
    this.speakerText = this.scene.add.text(this.padding, 8, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      color: "#f5c842",
      fontStyle: "bold",
    });

    // Body text
    this.bodyText = this.scene.add.text(
      this.padding,
      32,
      "",
      {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#ffffff",
        wordWrap: { width: config.width - this.padding * 2 },
        lineSpacing: 4,
      },
    );

    this.container = this.scene.add.container(config.x, config.y, [
      this.background,
      this.speakerText,
      this.bodyText,
    ]);

    this.container.setDepth(100);
    this.hide();
  }

  /** Display text with typewriter effect. */
  show(speaker: string, message: string, onComplete?: () => void): void {
    this.container.setVisible(true);
    this.speakerText.setText(speaker);
    this.bodyText.setText("");
    this.fullMessage = message;
    this.charIndex = 0;

    if (this.timer) {
      this.timer.destroy();
    }

    this.timer = this.scene.time.addEvent({
      delay: 35,
      callback: () => {
        this.charIndex++;
        this.bodyText.setText(this.fullMessage.substring(0, this.charIndex));

        if (this.charIndex >= this.fullMessage.length) {
          this.timer?.destroy();
          this.timer = undefined;
          if (onComplete) onComplete();
        }
      },
      loop: true,
    });
  }

  /** Immediately complete current typewriter animation. */
  skipToEnd(): void {
    if (this.timer) {
      this.timer.destroy();
      this.timer = undefined;
    }
    this.bodyText.setText(this.fullMessage);
  }

  /** Check if typewriter is still animating. */
  isAnimating(): boolean {
    return this.timer != null;
  }

  hide(): void {
    if (this.timer) {
      this.timer.destroy();
      this.timer = undefined;
    }
    this.container.setVisible(false);
  }

  destroy(): void {
    this.hide();
    this.container.destroy();
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
}

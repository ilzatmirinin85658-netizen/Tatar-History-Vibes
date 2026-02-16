import Phaser from "phaser";

export interface DialogueBoxConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
}

export interface Choice {
  text: string;
  callback: () => void;
}

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
  private boxHeight: number;
  private choiceButtons: Phaser.GameObjects.Container[] = [];
  private onCompleteCallback?: () => void;

  constructor(config: DialogueBoxConfig) {
    this.scene = config.scene;
    this.padding = config.padding ?? 16;
    this.boxWidth = config.width;
    this.boxHeight = config.height;

    // Semi-transparent background with white border
    this.background = this.scene.add.graphics();
    this.drawBackground();

    // Speaker name — yellow, monospace
    this.speakerText = this.scene.add.text(this.padding, 10, "", {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: "15px",
      color: "#f5c842",
      fontStyle: "bold",
    });

    // Body text — white, monospace, word-wrapped
    this.bodyText = this.scene.add.text(this.padding, 34, "", {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: "14px",
      color: "#ffffff",
      wordWrap: { width: this.boxWidth - this.padding * 2 },
      lineSpacing: 4,
    });

    this.container = this.scene.add.container(config.x, config.y, [
      this.background,
      this.speakerText,
      this.bodyText,
    ]);

    this.container.setDepth(100);
    this.hide();
  }

  private drawBackground(): void {
    this.background.clear();
    this.background.fillStyle(0x000000, 0.8);
    this.background.fillRoundedRect(0, 0, this.boxWidth, this.boxHeight, 10);
    this.background.lineStyle(2, 0xffffff, 0.9);
    this.background.strokeRoundedRect(0, 0, this.boxWidth, this.boxHeight, 10);
  }

  showDialogue(
    name: string,
    text: string,
    onComplete?: () => void,
  ): void {
    this.clearChoices();
    this.container.setVisible(true);
    this.speakerText.setText(name);
    this.bodyText.setText("");
    this.fullMessage = text;
    this.charIndex = 0;
    this.onCompleteCallback = onComplete;

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
          if (this.onCompleteCallback) this.onCompleteCallback();
        }
      },
      loop: true,
    });
  }

  showChoices(choices: Choice[]): void {
    this.clearChoices();

    const btnW = this.boxWidth - this.padding * 2;
    const btnH = 36;
    const gap = 8;
    const totalH = choices.length * btnH + (choices.length - 1) * gap;
    const startY = -totalH - 10; // above the dialogue box

    choices.forEach((choice, i) => {
      const y = startY + i * (btnH + gap);
      const btnGfx = this.scene.add.graphics();
      btnGfx.fillStyle(0x1a1a2e, 0.9);
      btnGfx.fillRoundedRect(0, 0, btnW, btnH, 8);
      btnGfx.lineStyle(1, 0xffffff, 0.7);
      btnGfx.strokeRoundedRect(0, 0, btnW, btnH, 8);

      const label = this.scene.add.text(btnW / 2, btnH / 2, choice.text, {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "14px",
        color: "#ffffff",
      }).setOrigin(0.5);

      const hitZone = this.scene.add
        .zone(0, 0, btnW, btnH)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });

      hitZone.on("pointerover", () => {
        btnGfx.clear();
        btnGfx.fillStyle(0x2a7a4b, 0.95);
        btnGfx.fillRoundedRect(0, 0, btnW, btnH, 8);
        btnGfx.lineStyle(1, 0xffffff, 1);
        btnGfx.strokeRoundedRect(0, 0, btnW, btnH, 8);
      });

      hitZone.on("pointerout", () => {
        btnGfx.clear();
        btnGfx.fillStyle(0x1a1a2e, 0.9);
        btnGfx.fillRoundedRect(0, 0, btnW, btnH, 8);
        btnGfx.lineStyle(1, 0xffffff, 0.7);
        btnGfx.strokeRoundedRect(0, 0, btnW, btnH, 8);
      });

      hitZone.on("pointerdown", () => {
        this.clearChoices();
        choice.callback();
      });

      const btnContainer = this.scene.add.container(this.padding, y, [
        btnGfx,
        label,
        hitZone,
      ]);
      this.choiceButtons.push(btnContainer);
      this.container.add(btnContainer);
    });
  }

  private clearChoices(): void {
    this.choiceButtons.forEach((c) => c.destroy());
    this.choiceButtons = [];
  }

  skipToEnd(): void {
    if (this.timer) {
      this.timer.destroy();
      this.timer = undefined;
    }
    this.bodyText.setText(this.fullMessage);
  }

  isAnimating(): boolean {
    return this.timer != null;
  }

  hide(): void {
    if (this.timer) {
      this.timer.destroy();
      this.timer = undefined;
    }
    this.clearChoices();
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

import Phaser from "phaser";
import { DialogueBox } from "../ui/DialogueBox";

export class PrologueScene extends Phaser.Scene {
  private dialogueBox!: DialogueBox;
  private answerButtons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: "PrologueScene" });
  }

  create(): void {
    const { width, height } = this.scale;

    // --- Background ---
    const bg = this.add.image(width / 2, height / 2, "bg_courtyard");
    bg.setDisplaySize(width, height);

    // --- Hero sprite (center-bottom, sitting on a bench) ---
    const hero = this.add.image(width / 2, height * 0.62, "hero_idle");
    hero.setScale(2);

    // --- Trashcan (right side) ---
    const trashcan = this.add.image(width * 0.82, height * 0.58, "trashcan");
    trashcan.setScale(2);
    trashcan.setInteractive({ useHandCursor: true });
    trashcan.on("pointerdown", () => {
      trashcan.setTint(0xffff00);
      this.time.delayedCall(200, () => trashcan.clearTint());
    });

    // --- Dialogue box ---
    const boxHeight = 140;
    this.dialogueBox = new DialogueBox({
      scene: this,
      x: 12,
      y: height - boxHeight - 12,
      width: width - 24,
      height: boxHeight,
    });

    // --- Start prologue after 1 second ---
    this.time.delayedCall(1000, () => this.startPhoneCall());
  }

  private startPhoneCall(): void {
    const { width, height } = this.scale;

    this.dialogueBox.show("", "Звонок от: Бабушка...", () => {
      this.showChoiceButtons(width, height);
    });
  }

  private showChoiceButtons(width: number, height: number): void {
    // Clear previous buttons
    this.answerButtons.forEach((b) => b.destroy());
    this.answerButtons = [];

    const btnY = height - 160;
    const btnStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
      color: "#ffffff",
      backgroundColor: "#2a7a4b",
      padding: { x: 24, y: 10 },
    };

    // "Взять" button
    const btnAnswer = this.add
      .text(width / 2 - 90, btnY, "Взять", btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btnAnswer.on("pointerover", () => btnAnswer.setStyle({ backgroundColor: "#36996a" }));
    btnAnswer.on("pointerout", () => btnAnswer.setStyle({ backgroundColor: "#2a7a4b" }));
    btnAnswer.on("pointerdown", () => this.onAnswerCall());

    // "Сбросить" button
    const btnDeclineStyle = { ...btnStyle, backgroundColor: "#8b2020" };
    const btnDecline = this.add
      .text(width / 2 + 90, btnY, "Сбросить", btnDeclineStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btnDecline.on("pointerover", () => btnDecline.setStyle({ backgroundColor: "#b03030" }));
    btnDecline.on("pointerout", () => btnDecline.setStyle({ backgroundColor: "#8b2020" }));
    btnDecline.on("pointerdown", () => this.onDeclineCall());

    this.answerButtons.push(btnAnswer, btnDecline);
  }

  private clearButtons(): void {
    this.answerButtons.forEach((b) => b.destroy());
    this.answerButtons = [];
  }

  private onAnswerCall(): void {
    this.clearButtons();

    this.dialogueBox.show(
      "Бабушка",
      "Улым, кил монда! Бүген без сиңа бик мөһим нәрсә күрсәтергә тиеш...",
      () => {
        // Dialogue finished — next step will be added later
      },
    );
  }

  private onDeclineCall(): void {
    this.clearButtons();

    this.dialogueBox.show("", "Телефон тынды... Ләкин аңа кабат шалтыратты.", () => {
      this.time.delayedCall(1500, () => this.startPhoneCall());
    });
  }
}

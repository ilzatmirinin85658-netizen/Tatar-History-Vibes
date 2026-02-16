import Phaser from "phaser";
import { DialogueBox } from "../ui/DialogueBox";

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

    // --- Sky strip above the background ---
    const skyHeight = height * 0.5;
    this.add.rectangle(width / 2, skyHeight / 2, width, skyHeight, 0x6b8cae);

    // --- Background stretched 1.5x vertically, top-aligned ---
    const bg = this.add.image(width / 2, 0, "bg_courtyard").setOrigin(0.5, 0);
    bg.setDisplaySize(width, height * 1.5);

    // --- Hero on the bench (lower area of the scene) ---
    const heroY = height * 1.18;
    const hero = this.add.image(width / 2, heroY, "hero_sitting");
    const heroScale = (height * 0.32) / hero.height;
    hero.setScale(heroScale);

    // Breathing idle animation
    this.tweens.add({
      targets: hero,
      scaleY: heroScale * 0.98,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // --- Dialogue box (fixed to camera via setScrollFactor) ---
    const boxHeight = 150;
    this.dialogueBox = new DialogueBox({
      scene: this,
      x: 10,
      y: height - boxHeight - 10,
      width: width - 20,
      height: boxHeight,
    });
    this.dialogueBox.getContainer().setScrollFactor(0);

    // --- Camera: start at the top (sky), then pan down to the hero ---
    const cam = this.cameras.main;
    cam.setBounds(0, 0, width, height * 1.5);
    cam.setScroll(0, 0);

    this.state = "INTRO_PAN";
    cam.pan(width / 2, height * 1.5 - height / 2, 4000, "Sine.easeInOut", false, (_cam, progress) => {
      if (progress === 1) {
        this.time.delayedCall(500, () => this.phoneRing());
      }
    });
  }

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

import Phaser from "phaser";
import { DialogueBox } from "../ui/DialogueBox";

type PrologueState =
  | "IDLE"
  | "PHONE_RING"
  | "WAITING_CHOICE"
  | "ANSWER_GRANDMA"
  | "ANSWER_HERO"
  | "DECLINE_THOUGHT"
  | "CALL_ENDED";

export class PrologueScene extends Phaser.Scene {
  private dialogueBox!: DialogueBox;
  private state: PrologueState = "IDLE";

  constructor() {
    super({ key: "PrologueScene" });
  }

  create(): void {
    const { width, height } = this.scale;

    // --- Background ---
    const bg = this.add.image(width / 2, height / 2, "bg_courtyard");
    bg.setDisplaySize(width, height);

    // --- Hero sitting (lower third of the screen) ---
    const hero = this.add.image(width / 2, height * 0.68, "hero_sitting");
    const targetHeroHeight = height * 0.35;
    const scaleRatio = targetHeroHeight / hero.height;
    hero.setScale(scaleRatio);

    // --- Dialogue box at bottom ---
    const boxHeight = 150;
    this.dialogueBox = new DialogueBox({
      scene: this,
      x: 10,
      y: height - boxHeight - 10,
      width: width - 20,
      height: boxHeight,
    });

    // --- Start: 2 second pause, then phone rings ---
    this.state = "IDLE";
    this.time.delayedCall(2000, () => this.phoneRing());
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
      {
        text: "Взять трубку",
        callback: () => this.onAnswer(),
      },
      {
        text: "Сбросить",
        callback: () => this.onDecline(),
      },
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

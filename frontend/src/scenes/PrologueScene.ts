import Phaser from "phaser";
import { DialogueBox } from "../ui/DialogueBox";

const WORLD_HEIGHT = 2000;

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

    // --- Grey background filling entire world ---
    this.add.rectangle(width / 2, WORLD_HEIGHT / 2, width, WORLD_HEIGHT, 0x707070);

    // --- Drifting clouds in the sky zone (Y: 0–500) ---
    this.createClouds(width);

    // --- Courtyard at the bottom of the world ---
    const bg = this.add.image(width / 2, WORLD_HEIGHT, "bg_courtyard").setOrigin(0.5, 1);
    const bgScale = width / bg.width;
    bg.setScale(bgScale);

    // --- Hero (draggable for debug positioning) ---
    const hero = this.add.image(width / 2, WORLD_HEIGHT - 200, "hero_sitting");
    const heroScale = (height * 0.3) / hero.height;
    hero.setScale(heroScale);

    hero.setInteractive({ draggable: true });
    this.input.setDraggable(hero);
    hero.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      hero.x = dragX;
      hero.y = dragY;
      console.log("Hero X:", Math.round(hero.x), "Hero Y:", Math.round(hero.y));
    });

    // Breathing idle animation
    this.tweens.add({
      targets: hero,
      scaleY: heroScale * 0.98,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // --- Dialogue box (fixed to screen) ---
    const boxHeight = 150;
    this.dialogueBox = new DialogueBox({
      scene: this,
      x: 10,
      y: height - boxHeight - 10,
      width: width - 20,
      height: boxHeight,
    });
    this.dialogueBox.getContainer().setScrollFactor(0);

    // --- Camera setup ---
    const cam = this.cameras.main;
    cam.setBounds(0, 0, width, WORLD_HEIGHT);
    cam.setScroll(0, 0);

    // Pan from sky down to the courtyard over 5 seconds
    this.state = "INTRO_PAN";
    const panTargetY = WORLD_HEIGHT - height / 2;
    cam.pan(width / 2, panTargetY, 5000, "Sine.easeInOut", false, (_cam, progress) => {
      if (progress === 1) {
        this.time.delayedCall(500, () => this.phoneRing());
      }
    });
  }

  private createClouds(worldWidth: number): void {
    const cloudData = [
      { x: 60, y: 80, scale: 1.0, speed: 8000 },
      { x: 250, y: 180, scale: 0.7, speed: 12000 },
      { x: 140, y: 320, scale: 0.9, speed: 10000 },
      { x: 350, y: 120, scale: 0.6, speed: 14000 },
      { x: 30, y: 420, scale: 0.8, speed: 11000 },
    ];

    for (const c of cloudData) {
      const cloud = this.add.image(c.x, c.y, "cloud").setScale(c.scale).setAlpha(0.7);
      this.tweens.add({
        targets: cloud,
        x: worldWidth + 100,
        duration: c.speed,
        repeat: -1,
        onRepeat: () => {
          cloud.x = -100;
        },
      });
    }
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

#!/usr/bin/env python3
"""
Утилита для выравнивания кадров в горизонтальных спрайт-листах
по нижнему центру (Bottom-Center).

Использование:
  python tools/center_sprites.py                        # по умолчанию: папка assets/images, 4 кадра
  python tools/center_sprites.py --path путь/к/папке    # другая папка
  python tools/center_sprites.py --frames 6             # другое кол-во кадров

Что делает:
  1. Находит все PNG-файлы, содержащие "sheet" в имени.
  2. Разрезает каждый на N кадров (горизонтально).
  3. Вычисляет bounding box непрозрачных пикселей в каждом кадре.
  4. Находит максимальный нижний край (max_bottom) среди ВСЕХ кадров листа,
     чтобы "ноги" персонажа оставались на одном уровне.
  5. Горизонтально: центрирует содержимое.
     Вертикально: фиксирует нижний край на уровне max_bottom.
  6. Склеивает обратно и перезаписывает исходный файл.

Требования: pip install Pillow
"""

import argparse
import os
import sys
from pathlib import Path

from PIL import Image


def process_spritesheet(filepath: Path, num_frames: int) -> bool:
    """Обрабатывает один спрайт-лист. Возвращает True если файл изменён."""
    img = Image.open(filepath).convert("RGBA")
    w, h = img.size
    frame_w = w // num_frames

    if frame_w * num_frames != w:
        print(f"  ПРОПУСК: {filepath.name} — ширина {w} не делится на {num_frames} кадров")
        return False

    # Первый проход: нарезаем кадры и находим bounding box каждого
    frames = []
    bboxes = []
    for i in range(num_frames):
        frame = img.crop((i * frame_w, 0, (i + 1) * frame_w, h))
        frames.append(frame)
        bboxes.append(frame.getbbox())  # (left, top, right, bottom) or None

    # Находим максимальный нижний край среди всех кадров —
    # все кадры будут выровнены так, чтобы низ контента был на этом уровне
    max_bottom = 0
    for bbox in bboxes:
        if bbox is not None:
            max_bottom = max(max_bottom, bbox[3])

    # Второй проход: центрируем каждый кадр (горизонтально + привязка к низу)
    centered_frames = []
    for frame, bbox in zip(frames, bboxes):
        if bbox is None:
            centered_frames.append(frame.copy())
            continue

        cropped = frame.crop(bbox)
        cw, ch = cropped.size

        new_frame = Image.new("RGBA", (frame_w, h), (0, 0, 0, 0))
        # Горизонтально: по центру кадра
        paste_x = (frame_w - cw) // 2
        # Вертикально: нижний край контента фиксирован на max_bottom
        paste_y = max_bottom - ch
        new_frame.paste(cropped, (paste_x, paste_y))
        centered_frames.append(new_frame)

    result = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for i, frame in enumerate(centered_frames):
        result.paste(frame, (i * frame_w, 0))

    result.save(filepath)
    print(f"  OK: {filepath.name} ({num_frames} кадров, {frame_w}×{h}, bottom={max_bottom})")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Выравнивание кадров в спрайт-листах (Bottom-Center)")
    parser.add_argument(
        "--path",
        type=str,
        default=os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "assets", "images"),
        help="Путь к папке с изображениями",
    )
    parser.add_argument(
        "--frames",
        type=int,
        default=4,
        help="Количество кадров в каждом спрайт-листе (по умолчанию 4)",
    )
    args = parser.parse_args()

    images_dir = Path(args.path).resolve()
    if not images_dir.is_dir():
        print(f"Ошибка: папка не найдена: {images_dir}")
        sys.exit(1)

    sheets = sorted(images_dir.glob("*sheet*.png"))
    if not sheets:
        print(f"Спрайт-листы не найдены в {images_dir}")
        sys.exit(0)

    print(f"Папка: {images_dir}")
    print(f"Кадров на лист: {args.frames}")
    print(f"Найдено файлов: {len(sheets)}\n")

    count = 0
    for sheet in sheets:
        if process_spritesheet(sheet, args.frames):
            count += 1

    print(f"\nОбработано: {count} из {len(sheets)} файлов")


if __name__ == "__main__":
    main()

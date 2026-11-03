"""Regenerate responsive variants from the unchanged JPEG originals (Pillow with AVIF/WebP)."""
from pathlib import Path

from PIL import Image, ImageOps, features


def main():
    if not features.check("webp") or not features.check("avif"):
        raise SystemExit("Pillow needs both WebP and AVIF encoders.")
    images = Path(__file__).resolve().parents[1] / "assets" / "images"
    for name, widths in (("hero-image", (800, 1600)), ("app-home", (270, 540))):
        with Image.open(images / f"{name}.jpg") as source:
            original = ImageOps.exif_transpose(source).convert("RGB")
            for width in widths:
                height = round(original.height * width / original.width)
                resized = original.resize((width, height), Image.Resampling.LANCZOS)
                for extension, settings in (
                    ("webp", {"quality": 82, "method": 6}),
                    ("avif", {"quality": 60, "speed": 6}),
                ):
                    target = images / f"{name}-{width}.{extension}"
                    resized.save(target, **settings)
                    print(f"{target.name}: {target.stat().st_size} bytes")


if __name__ == "__main__":
    main()

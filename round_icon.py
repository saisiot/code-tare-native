#!/usr/bin/env python3
"""
둥근 모서리 아이콘 생성 스크립트
macOS 스타일의 부드러운 둥근 모서리를 추가합니다.
"""

from PIL import Image, ImageDraw
import sys

def add_rounded_corners(input_path, output_path, radius_percent=22):
    """
    아이콘에 둥근 모서리를 추가합니다.

    Args:
        input_path: 입력 이미지 경로
        output_path: 출력 이미지 경로
        radius_percent: 둥근 모서리 반경 (이미지 크기 대비 백분율, 기본 22%)
                       macOS Big Sur 스타일은 약 22-23%
    """
    # 이미지 열기
    img = Image.open(input_path).convert('RGBA')
    width, height = img.size

    # 둥근 모서리 반경 계산
    radius = int(min(width, height) * radius_percent / 100)

    # 마스크 생성 (알파 채널)
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)

    # 둥근 사각형 그리기
    draw.rounded_rectangle(
        [(0, 0), (width, height)],
        radius=radius,
        fill=255
    )

    # 마스크 적용
    output = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    output.paste(img, (0, 0))
    output.putalpha(mask)

    # 저장
    output.save(output_path, 'PNG')
    print(f"✅ 둥근 모서리 아이콘 생성 완료: {output_path}")
    print(f"   크기: {width}x{height}, 반경: {radius}px ({radius_percent}%)")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("사용법: python3 round_icon.py <input.png> [output.png] [radius_percent]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'icon_rounded.png'
    radius_percent = int(sys.argv[3]) if len(sys.argv) > 3 else 22

    try:
        add_rounded_corners(input_path, output_path, radius_percent)
    except Exception as e:
        print(f"❌ 오류: {e}")
        sys.exit(1)

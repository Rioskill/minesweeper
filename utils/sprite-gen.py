from PIL import Image, ImageDraw, ImageFont

FONTSIZE = 32

FONTSIZE = 320

CNT = 11
WIDTH = FONTSIZE

COLORS = [
    (0, 0, 255),
    (7, 131, 7),
    (255, 0, 0),
    (0, 0, 127),
    (127, 0, 0),
    (0, 127, 127),
    (0, 0, 0),
    (127, 127, 127)
]

def replaceBg(img, color):
    img = img.convert('RGBA')
    pixData = img.load()

    for y in range(img.size[1]):
        for x in range(img.size[0]):
            if pixData[x, y][3] == 0:
                pixData[x, y] = (*color, 255)

    return img

def gen_sprite():
    image = Image.new("RGBA", (WIDTH * CNT, FONTSIZE), (255,255,255))
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype("resources/Tiny5-Regular.ttf", FONTSIZE)


    def draw_symbol(symbol, x, color):
        _, _, w, h = draw.textbbox((0, 0), symbol, font=font)
        draw.text((x + (WIDTH - w) / 2, 0), symbol, color, font=font)

    for i in range(1, 9):
        draw_symbol(str(i), WIDTH * i, COLORS[i - 1])

    flag = Image.open("textures/flag.png")
    flag = flag.resize((WIDTH, WIDTH))
    # flag = replaceBg(flag, (204, 196, 179))
    image.paste(flag, (WIDTH * 9, 0))

    bomb = Image.open("textures/bomb.png")
    bomb = bomb.resize((WIDTH, WIDTH))
    image.paste(bomb, (WIDTH * 10, 0))

    return image


image = gen_sprite()
image.save('textures/digits.png')

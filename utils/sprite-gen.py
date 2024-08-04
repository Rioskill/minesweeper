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

def invert_color(color):
    return (255 - color[0], 255 - color[1], 255 - color[2])

def gen_sprite(dark=False):
    bg_color = (30, 30, 30) if dark else (255, 255, 255) 
    image = Image.new("RGBA", (WIDTH * CNT, FONTSIZE), bg_color)
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype("resources/Tiny5-Regular.ttf", FONTSIZE)


    def draw_symbol(symbol, x, color):
        _, _, w, h = draw.textbbox((0, 0), symbol, font=font)
        draw.text((x + (WIDTH - w) / 2, 0), symbol, color, font=font)

    for i in range(1, 9):
        color = COLORS[i - 1] if not dark else invert_color(COLORS[i - 1])
        draw_symbol(str(i), WIDTH * i, color)

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

dark_image = gen_sprite(True)
dark_image.save('textures/dark_digits.png')

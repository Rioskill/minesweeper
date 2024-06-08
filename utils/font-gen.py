from PIL import Image, ImageDraw, ImageFont

FONTSIZE = 32
CNT = 11
WIDTH = FONTSIZE

def gen_sprite():
    image = Image.new("RGBA", (WIDTH * CNT, FONTSIZE), (255,255,255))
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype("resources/Tiny5-Regular.ttf", FONTSIZE)


    def draw_symbol(symbol, x):
        _, _, w, h = draw.textbbox((0, 0), symbol, font=font)
        draw.text((x + (WIDTH - w) / 2, 0), symbol, (0,0,0), font=font)

    for i in range(1, 10):
        draw_symbol(str(i), WIDTH * i)

    bomb = Image.open("textures/bomb.png")
    bomb = bomb.resize((WIDTH, WIDTH))
    image.paste(bomb, (WIDTH * 10, 0))

    return image


image = gen_sprite()
image.save('textures/digits.png')

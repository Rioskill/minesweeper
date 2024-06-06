from PIL import Image, ImageDraw, ImageFont

FONTSIZE = 32

image = Image.new("RGBA", (FONTSIZE * 9, FONTSIZE), (255,255,255))
draw = ImageDraw.Draw(image)
font = ImageFont.truetype("resources/Tiny5-Regular.ttf", FONTSIZE)

def draw_symbol(symbol, x):
    draw.text((x, 0), symbol, (0,0,0), font=font)

for i in range(9):
    draw_symbol(str(i + 1), FONTSIZE * i)


image.save('textures/digits.png')

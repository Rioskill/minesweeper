#version 100
precision mediump float;

uniform vec2 fullSize;
uniform vec2 viewSize;

uniform vec2 offset;
uniform float l;
uniform vec2 matrixSize;

uniform float minesVisible;

uniform sampler2D uSampler;

varying vec2 pos;
varying vec2 globalCoords;
varying highp vec2 vTextureCoord;

float width = 1. / 11.;
float stroke = 2.;

vec3 gridBorderColor = vec3(0.7);
vec3 scrollbarColor = vec3(0., 1., 0);

#define FLAG 1
#define MINE 2
#define CLOSED 3

int getType(vec2 orig) {
    // closed = +100
    // flag = +50

    if (orig.x >= 150. * width) {
        return FLAG;
    }

    if (orig.x >= 100. * width) {
        if (orig.x >= 110. * width && minesVisible == 1.) {
            return MINE;
        }

        return CLOSED;
    }

    return 0;
}

float getTexX(int tileType, float tileX, float origX) {
    // FLAG is 9-nth
    // MINE is 10-nth
    // CLOSED is 1-st

    if (tileType == FLAG) {
        return (tileX + 9.) * width;
    } else if (tileType == MINE) {
        return (tileX + 10.) * width;
    } else if (tileType == CLOSED) {
        return tileX * width;
    }

    return origX;
}

vec2 getTexCoord(vec2 orig, float tileX) {
    int type = getType(orig);

    return vec2(getTexX(type, tileX, orig.x), orig.y);
}

bool isClosed(float coordX) {
    // CLOSED = +100
    // MINE = 10

    return coordX >= 100. * width &&
            coordX <  110. * width ||
            coordX >= 110. * width &&
            coordX <= 111. * width &&
            minesVisible == 0.;
}

bool isScrollBar() {
    vec2 localPart = gl_FragCoord.xy / viewSize.xy;

    vec2 offsetPart = offset / fullSize;
    vec2 combPart = (offset + viewSize) / fullSize;

    return gl_FragCoord.y < 10. && localPart.x > offsetPart.x && localPart.x < combPart.x ||
           gl_FragCoord.x > viewSize.x - 10. && localPart.y > offsetPart.y && localPart.y < combPart.y;
}

bool isBorder(vec2 p, vec2 maxP, float stroke) {
    return  p.x < stroke ||
            p.x > maxP.x - stroke || 
            p.y < stroke || 
            p.y > maxP.y - stroke;
}

vec4 blendColors(vec3 first, vec3 second, float a) {
    return vec4(first * a + second * (1. - a), 1.);
}

void main()
{   
    vec4 closedColor = vec4(0.8, 0.77, 0.7, 1.);

    vec2 p = fract(pos) * fullSize / matrixSize;

    vec2 maxP = fullSize / matrixSize;

    float pXPart = p.x / maxP.x;

    if (isScrollBar())
    {
        gl_FragColor = vec4(scrollbarColor, 1.);
        return;
    }

    int tileType = getType(vTextureCoord);

    if (isBorder(p, maxP, stroke)) {

        if (isClosed(vTextureCoord.x) || tileType == FLAG) {
            // make shadows for 3d illusion
            // top left is white
            if (p.x < stroke || p.y > maxP.x - stroke) {
                gl_FragColor = vec4(1.);
            // bottom right is black
            } else {
                gl_FragColor = vec4(vec3(0.), 1.);
            }
        } else {
            gl_FragColor = vec4(gridBorderColor, 1.);
        } 

    } else {
        vec2 texCoord = getTexCoord(vTextureCoord, pXPart);

        if (isClosed(vTextureCoord.x)) {
            gl_FragColor = closedColor;
        } else {
            vec4 c = texture2D(uSampler, texCoord);
            gl_FragColor = blendColors(c.rgb, closedColor.rgb, c.a);
        }
    }
}

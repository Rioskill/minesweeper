#version 100
precision mediump float;

attribute vec2 aPosition;
attribute vec2 aTextureCoord;

uniform vec2 fullSize;
uniform vec2 viewSize;

uniform vec2 offset;
uniform vec2 matrixSize;

varying vec2 pos;

varying highp vec2 vTextureCoord;

void main()
{
    pos = aPosition / fullSize * matrixSize;

    vec2 local = aPosition - offset;
    vec2 shader = local / viewSize * 2. - 1.;

    gl_Position = vec4(shader, 0.0, 1.0);

    vTextureCoord = aTextureCoord;
}

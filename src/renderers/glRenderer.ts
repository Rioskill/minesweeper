import { GLBuffer } from "./buffer";
import { GameMap } from "../core/gameMap";
import { CoordsT, makeCoords } from "../models";
import { loadTexture } from "./texture";
import { theme, ThemeName, themes } from "../themes";
import { addVectors } from "../utils";
import { Renderer, RenderProps } from "./models";

interface GLRendererProps {
    gl: WebGLRenderingContext

    vertexShaderSource: string
    fragmenShaderSource: string
}

export class GLRenderer implements Renderer {
    vBuf: GLBuffer
    textureBuffer: GLBuffer

    dataArray: number[]
    dataLength: number

    gl: WebGLRenderingContext
    program: WebGLProgram

    currentBaseChunk: CoordsT

    constructor(props: GLRendererProps) {
        this.gl = props.gl;

        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

        const program = this.gl.createProgram();

        if (program === null) {
            throw new Error("program is null");
        }

        this.program = program;

        this.loadShaders(props.vertexShaderSource, props.fragmenShaderSource);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const linkErrLog = this.gl.getProgramInfoLog(program);
            console.error(`Shader program did not link successfully. Error log: ${linkErrLog}`)
            return;
        }

        const locations = {
            vertexCoords: this.gl.getAttribLocation(program, "aPosition"),
            textureCoords: this.gl.getAttribLocation(program, "aTextureCoord"),
            digitNum: this.gl.getAttribLocation(program, "digitNum"),
            sampler: this.gl.getUniformLocation(program, "uSampler")!,
        }

        this.gl.useProgram(this.program);

        // load texture
        this.onChangeTheme({themeName: theme.currentTheme});

        theme.mediator.subscribe('gl', this.onChangeTheme.bind(this));

        this.vBuf = new GLBuffer({
            gl: this.gl,
            location: locations.vertexCoords,
            size: 2,
            type: this.gl.ARRAY_BUFFER,
            dataType: this.gl.FLOAT
        })

        this.textureBuffer = new GLBuffer({
            gl: this.gl,
            location: locations.textureCoords,
            size: 2,
            type: this.gl.ARRAY_BUFFER,
            dataType: this.gl.FLOAT,
        })

        this.currentBaseChunk = makeCoords(0, 0);

        this.dataLength = 0;
    }

    onChangeTheme({themeName}: {themeName: ThemeName}) {
        const samplerLocation = this.gl.getUniformLocation(this.program, "uSampler")!;

        if (themeName === 'dark') {
            this.loadTexture(samplerLocation, "/textures/dark_digits.png");
        } else {
            this.loadTexture(samplerLocation, "/textures/digits.png");
        }
    }

    destruct() {
        this.gl.useProgram(null);
        if (this.program) {
            this.gl.deleteProgram(this.program);
        }
    }

    compileShader(source: string, type: GLenum) {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        let error_log = this.gl.getShaderInfoLog(shader);
        console.log(error_log);

        return shader;
    }

    loadShaders(vertexShaderSource: string, fragmenShaderSource: string) {
        const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmenShaderSource, this.gl.FRAGMENT_SHADER);

        this.attachShaders(vertexShader, fragmentShader);
    }

    attachShaders(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        this.gl.detachShader(this.program, vertexShader);
        this.gl.detachShader(this.program, fragmentShader);
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            const linkErrLog = this.gl.getProgramInfoLog(this.program);
            console.error(`Shader program did not link successfully. Error log: ${linkErrLog}`)
            return false;
        }

        return true;
    }

    loadChunk(map: GameMap, chunk: CoordsT) {
        this.dataArray = map.createVertexGridChunk(chunk);

        this.dataLength = this.dataArray.length;

        const textureCoords = map.createTextureCoordsChunk(chunk);

        this.vBuf.setData(new Float32Array(this.dataArray));
        this.textureBuffer.setData(new Float32Array(textureCoords));
    }

    loadChunks(map: GameMap, chunks: CoordsT[]) {
        this.dataArray = chunks.flatMap(map.createVertexGridChunk.bind(map));

        this.dataLength = this.dataArray.length;

        const textureCoords = chunks.flatMap(chunk => map.createTextureCoordsChunk(chunk));

        this.vBuf.setData(new Float32Array(this.dataArray));
        this.textureBuffer.setData(new Float32Array(textureCoords));
    }

    updateOffset(map: GameMap, offset: CoordsT) {
        const chunkDeltas = [
            makeCoords(0, 0),
            makeCoords(0, 1),
            makeCoords(1, 0),
            makeCoords(1, 1)
        ]

        const chunk = map.getChunk(offset);

        if (chunk !== this.currentBaseChunk) {
            this.currentBaseChunk = chunk;

            this.loadChunks(
                map,
                chunkDeltas.map(delta => addVectors(chunk, delta))
            )
        }
    }

    setFUniform(location: string, value: any) {
        const glLocation = this.gl.getUniformLocation(this.program, location);
        this.gl.uniform1f(glLocation, value);
    }
    
    setVec2FUniform (location: string, value: any[]) {
        const glLocation = this.gl.getUniformLocation(this.program, location);
        this.gl.uniform2fv(glLocation, value);
    }

    setVec3FUniform (location: string, value: number[]) {
        const glLocation = this.gl.getUniformLocation(this.program, location);
        this.gl.uniform3fv(glLocation, value);
    }

    loadTexture(samplerLocation: WebGLUniformLocation, texturePath) {
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        const texture = loadTexture(this.gl, texturePath);
        
        // Tell WebGL we want to affect texture unit 0
        this.gl.activeTexture(this.gl.TEXTURE0);

        // Bind the texture to texture unit 0
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        // Tell the shader we bound the texture to texture unit 0
        this.gl.uniform1i(samplerLocation, 0);
    }

    render(props: RenderProps) {
        this.gl.viewport(0, 0, props.viewportSize.x, props.viewportSize.y);

        this.setVec2FUniform("fullSize", [props.view.fullSize.x, props.view.fullSize.y]);
        this.setVec2FUniform("viewSize", [props.view.viewSize.x, props.view.viewSize.y]);

        this.setVec2FUniform("offset", [props.view.offset.x, props.view.offset.y]);
        this.setVec2FUniform("matrixSize", [props.COLS, props.ROWS]);

        this.setFUniform("minesVisible", props.minesVisible ? 1 : 0);

        this.setVec3FUniform("bgColor", theme.bgColor);
        this.setVec3FUniform("gridBorderColor", theme.gridBorderColor);
        this.setVec3FUniform("scrollbarColor", theme.scrollbarColor);
        this.setVec3FUniform("borderBlack", theme.borderBlack);
        this.setVec3FUniform("borderWhite", theme.borderWhite);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.dataLength / 2);
    }
}

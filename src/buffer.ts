interface GLBufferProps {
    gl: WebGLRenderingContext
    location: number
    size: number
    type: GLuint
}

export class GLFloatBuffer {
    gl: WebGLRenderingContext
    location: number
    size: number
    type: GLuint
    buf: WebGLBuffer

    constructor(props: GLBufferProps) {
        this.gl = props.gl;
        this.location = props.location;
        this.size = props.size;
        this.type = props.type;

        const buf = this.gl.createBuffer();

        if (buf === null) {
            throw new Error("buf was not be created");
        }

        this.buf = buf;
        this.bind();
        this.gl.vertexAttribPointer(props.location, props.size, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.location);
    }

    setData(data: Float32Array, usage?: GLenum) {
        this.bind();
        this.gl.bufferData(this.type, data, usage || this.gl.STATIC_DRAW);
    }

    bind() {
        this.gl.bindBuffer(this.type, this.buf)
    }
}

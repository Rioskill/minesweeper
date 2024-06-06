interface GLBufferProps {
    gl: WebGLRenderingContext
    location: number
    size: number
    type: GLuint
    dataType: GLenum
}

export class GLBuffer {
    gl: WebGLRenderingContext
    location: number
    size: number
    type: GLuint
    dataType: GLenum
    buf: WebGLBuffer

    constructor(props: GLBufferProps) {
        this.gl = props.gl;
        this.location = props.location;
        this.size = props.size;
        this.type = props.type;
        this.dataType = props.dataType;

        const buf = this.gl.createBuffer();

        if (buf === null) {
            throw new Error("buf was not be created");
        }

        this.buf = buf;
        this.bind();
        this.gl.vertexAttribPointer(props.location, props.size, this.dataType, false, 0, 0);
        this.gl.enableVertexAttribArray(this.location);
    }

    setData(data: AllowSharedBufferSource, usage?: GLenum) {
        this.bind();
        this.gl.bufferData(this.type, data, usage || this.gl.STATIC_DRAW);
    }

    bind() {
        this.gl.bindBuffer(this.type, this.buf)
    }
}

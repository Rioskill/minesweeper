interface MatrixProps {
    rows: number
    cols: number

    data?: Uint8Array
}

export class Matrix {
    // data: number[][];
    data: Uint8Array;

    rows: number;
    cols: number;

    constructor(props: MatrixProps) {
        this.rows = props.rows;
        this.cols = props.cols;

        if (props.data) {
            this.data = props.data;
        } else {
            // this.data = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
            this.data = new Uint8Array(this.rows * this.cols);
        }

        return new Proxy(this, {
            get: (obj, key) => {
                if (typeof(key) === 'string' && (Number.isInteger(Number(key)))) // key is an index
                    // return obj.data[key]
                    return new Uint8Array(this.data.buffer, this.rows * parseInt(key), this.rows);
                else 
                    return obj[key]
            },
            // set: (obj, key, value) => {
            //     if (typeof(key) === 'string' && (Number.isInteger(Number(key)))) // key is an index
            //         return obj.data[key] = value
            //     else 
            //         return obj[key] = value
            // }
        })
    }
}

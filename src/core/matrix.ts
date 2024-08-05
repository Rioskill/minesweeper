export type MatrixDataType = Uint8Array;

interface MatrixProps {
    rows: number
    cols: number
    
    data?: MatrixDataType
}

export class Matrix {
    data: MatrixDataType

    rows: number;
    cols: number;

    dataRows: Uint8Array[];

    constructor(props: MatrixProps) {
        this.rows = props.rows;
        this.cols = props.cols;

        if (props.data) {
            this.data = props.data;
        } else {
            this.data = new Uint8Array(this.rows * this.cols);
        }

        this.dataRows = [];
        for (let i = 0; i < this.rows; i++) {
            this.dataRows.push(
                new Uint8Array(this.data.buffer, this.cols * i, this.cols)
            )
        }

        return new Proxy(this, {
            get: (obj, key) => {
                if (typeof(key) === 'string' && (Number.isInteger(Number(key)))) // key is an index
                    return obj.dataRows[key];
                else 
                    return obj[key]
            }
        })
    }
}

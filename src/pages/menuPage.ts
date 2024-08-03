import { Page } from "../page";
import { PageElement, PageSwitcher } from "../pageElement";

const numberInputBlock = (label: string, inputParams?: any): PageElement => ({
    tag: 'div',
    class: 'input-block',
    children: [
        {
            tag: 'label',
            text: label
        },
        {
            tag: 'input',
            params: {
                'type': 'number',
                ...inputParams
            }
        },
    ]
})

export class MenuPage implements Page {
    events: {
        name: string,
        target: any,
        listener: EventListener
    }[]

    cols: number
    rows: number
    mines: number

    constructor() {
        this.cols = 90;
        this.rows = 90;
        this.mines = 1000;
    }

    onLoad(switcher: PageSwitcher) {
        const colsInput = document.getElementById('cols-input');
        const rowsInput = document.getElementById('rows-input');
        const minesInput = document.getElementById('mines-input');
        const submitBtn = document.getElementById('submit');

        this.events = [
            {
                name: 'change',
                target: colsInput,
                listener: (ev) => {
                    this.cols = parseInt(ev.target.value);
                    
                    const minesInput = document.getElementById('mines-input') as HTMLInputElement;
            
                    minesInput.max = (this.rows * this.cols).toString();
                }
            },
            {
                name: 'change',
                target: rowsInput,
                listener: (ev) => {
                    this.rows = parseInt(ev.target.value);
                    const minesInput = document.getElementById('mines-input') as HTMLInputElement;
            
                    minesInput.max = (this.rows * this.cols).toString();
                }
            },
            {
                name: 'change',
                target: minesInput,
                listener: (ev) => {
                    this.mines = parseInt(ev.target.value);
                }
            },
            {
                name: 'click',
                target: submitBtn,
                listener: () => {
                    console.log('submit', {
                        COLS: this.cols,
                        ROWS: this.rows,
                        MINES: this.mines,
                        switcher
                    })
                    switcher.changePage('loading', {
                        COLS: this.cols,
                        ROWS: this.rows,
                        MINES: this.mines,
                        switcher
                    })
                }
            }
        ]

        this.events.forEach(({name, target, listener}) => {
            target.addEventListener(name, listener);
        });
    }

    onUnload() {
        this.events.forEach(({name, target, listener}) => {
            target.removeEventListener(name, listener);
        });
    }

    render() {
        return {
            tag: 'div',
            class: 'main-menu',
            children: [
                {
                    tag: 'div',
                    class: 'main-menu__input-block',
                    children: [
                        numberInputBlock('cols', {
                            id: 'cols-input',
                            min: 9,
                            value: this.cols,
                            
                        }),
                        numberInputBlock('rows', {
                            id: 'rows-input',
                            min: 9,
                            value: this.rows,
                            
                        }),
                        numberInputBlock('mines', {
                            id: 'mines-input',
                            value: this.mines,
                            min: 0,
                            max: 81,
                        }),
                    ]
                },
                {
                    tag: 'button',
                    class: 'btn bulging',
                    id: 'submit',
                    text: 'Начать игру'
                }
            ]
        }
    }
}
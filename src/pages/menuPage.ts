import { ToggleBtnBlock } from "./components/toggleBtnBlock";
import { Page } from "./page";
import { PageElement, PageSwitcher } from "./pageElement";

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

interface GameMode {
    cols: number
    rows: number
    mines: number
}

const gameModes: {
    [key: string]: GameMode
} = {
    'easy': {
        cols: 9,
        rows: 9,
        mines: 10
    },
    'medium': {
        cols: 16,
        rows: 16,
        mines: 40
    },
    'hard': {
        cols: 30,
        rows: 16,
        mines: 99
    }
}

type GameModeName = keyof typeof gameModes & string;

export class MenuPage implements Page {
    events: {
        name: string,
        target: any,
        listener: EventListener
    }[]

    cols: number
    rows: number
    mines: number

    gameModeBtnBlock: ToggleBtnBlock<GameModeName>

    constructor() {
        this.cols = 9;
        this.rows = 9;
        this.mines = 10;

        this.gameModeBtnBlock = new ToggleBtnBlock({
            buttons: [
                {
                    id: 'easy',
                    class: 'filled'
                },
                {
                    id: 'medium',
                    class: 'filled'
                },
                {
                    id: 'hard',
                    class: 'filled'
                }
            ],
            name: 'Game Mode',
            class: 'main-menu__gamemode-btn-block',
            handler: this.setGameMode.bind(this),
            defaultValue: undefined
        })
    }

    setGameMode(gameMode: GameModeName) {
        const colsInput = document.getElementById('cols-input') as HTMLInputElement;
        const rowsInput = document.getElementById('rows-input') as HTMLInputElement;
        const minesInput = document.getElementById('mines-input') as HTMLInputElement;

        this.cols = gameModes[gameMode].cols;
        this.rows = gameModes[gameMode].rows;
        this.mines = gameModes[gameMode].mines;
       
        colsInput.value = this.cols.toString();
        rowsInput.value = this.rows.toString();
        minesInput.value = this.mines.toString();
    }

    onLoad(switcher: PageSwitcher) {
        const colsInput = document.getElementById('cols-input');
        const rowsInput = document.getElementById('rows-input');
        const minesInput = document.getElementById('mines-input');
        const submitBtn = document.getElementById('submit');

        const setNewMinesInputMax = () => {
            const minesInput = document.getElementById('mines-input') as HTMLInputElement;
            
            const newMax = this.rows * this.cols - 1;
            minesInput.max = newMax.toString();
            if (parseInt(minesInput.value) > newMax) {
                minesInput.value = newMax.toString();
            }
        }

        this.events = [
            {
                name: 'change',
                target: colsInput,
                listener: (ev) => {
                    this.cols = parseInt(ev.target.value);
                    setNewMinesInputMax();
                }
            },
            {
                name: 'change',
                target: rowsInput,
                listener: (ev) => {
                    this.rows = parseInt(ev.target.value);
                    setNewMinesInputMax();
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

        this.gameModeBtnBlock.onLoad();
    }

    onUnload() {
        this.events.forEach(({name, target, listener}) => {
            target.removeEventListener(name, listener);
        });

        this.gameModeBtnBlock.onUnload();
    }

    render() {
        return {
            tag: 'div',
            class: 'main-menu',
            children: [
                this.gameModeBtnBlock.render(),
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
                            max: 80,
                        }),
                    ]
                },
                {
                    tag: 'button',
                    class: 'btn filled bulging',
                    id: 'submit',
                    text: 'Начать игру'
                }
            ]
        }
    }
}
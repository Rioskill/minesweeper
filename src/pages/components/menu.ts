import { setDisplayValue } from "../../display/display";

interface GameMenuProps {
    minesDisplay: HTMLElement;
    timerDisplay: HTMLElement;
    restartBtn: HTMLElement;
}

type RestartBtnStatusType = 'regular' | 'dead' | 'cool';

export class GameMenu {
    minesDisplay: HTMLElement;
    timerDisplay: HTMLElement;
    restartBtn: HTMLElement;

    restartBtnStatus: RestartBtnStatusType;

    gameTickTimer: Timer;

    constructor(props: GameMenuProps) {
        this.minesDisplay = props.minesDisplay;
        this.timerDisplay = props.timerDisplay;
        this.restartBtn = props.restartBtn;
    }

    setMinesDisplayValue(value: number) {
        setDisplayValue(this.minesDisplay, value);
    }

    setTimerDisplayValue(value: number) {
        setDisplayValue(this.timerDisplay, value);
    }

    startTimer() {
        let time = 0;
        this.gameTickTimer = setInterval(() => {
            time++;
            setDisplayValue(this.timerDisplay, time);
        }, 1000); 
    }

    stopTimer() {
        clearInterval(this.gameTickTimer);
    }

    get restartBtnSrc() {
        return `/minesweeper/textures/smiles/${this.restartBtnStatus}.png`;
    }

    setRestartBtnStatus(status: RestartBtnStatusType) {
        this.restartBtnStatus = status;

        (this.restartBtn.children[0] as HTMLImageElement).src = this.restartBtnSrc;
    }
}

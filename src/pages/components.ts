export interface EventType {
    name: string,
    target: any,
    listener: EventListener
}

interface ToggleBtn<T extends string> {
    id: T
    class?: string
}

type ToggleBtnHandler<T> = (id: T)=>void

interface ToggleBtnBlockProps<T extends string> {
    buttons: ToggleBtn<T>[]
    name: string
    handler: ToggleBtnHandler<T>
    defaultValue: T
}

export class ToggleBtnBlock<T extends string> {
    name: string
    currentVal: T
    buttons: ToggleBtn<T>[]
    events: EventType[]
    handler: ToggleBtnHandler<T>

    constructor(props: ToggleBtnBlockProps<T>) {
        this.name = props.name;
        this.buttons = props.buttons;
        this.handler = props.handler;
        this.currentVal = props.defaultValue;
    }

    setSunken(el: HTMLElement) {
        el.classList.remove('bulging');
        el.classList.add('sunken');
    }

    setBulging(el: HTMLElement) {
        el.classList.remove('sunken');
        el.classList.add('bulging');
    }

    setCurrentSunken() {
        this.buttons.forEach(btn => {
            const el = document.getElementById(`${btn.id}-btn`)!;
            if (btn.id === this.currentVal) {
                this.setSunken(el);
            } else {
                this.setBulging(el);
            }
        })
    }

    onLoad() {
        this.setCurrentSunken();

        this.events = this.buttons.map(btn => ({
            name: 'click',
            target: document.getElementById(`${btn.id}-btn`),
            listener: () => {
                this.currentVal = btn.id;
                this.handler(btn.id);
                this.setCurrentSunken();
            }
        }))

        this.events.forEach(({name, target, listener}) => {
            target.addEventListener(name, listener);
        })
    }

    onUnload() {
        this.events.forEach(({name, target, listener}) => {
            target.removeEventListener(name, listener);
        })
    }

    render() {
        const renderBtn = (btn: ToggleBtn<T>) => ({
            tag: 'button',
            id: `${btn.id}-btn`,
            text: `${btn.id}`,
            class: `btn ${btn.class || ''}`,
        })
        
        return {
            tag: 'div',
            class: 'options-container bulging',
            children: [
                {
                    tag: 'h3',
                    text: this.name
                },
                ...this.buttons.map(renderBtn)
            ]
        }
    }
}

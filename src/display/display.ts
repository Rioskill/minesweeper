import { range } from "../utils";

const display = {
    tag: 'div',
    class: 's7s',
    children: [
        {
            tag: 'input',
            params: {
                'hidden': true
            },
        },
        ...range(7).map(() => ({
            tag: 'seg',
        }))
    ]
};

export const displayBlock = (id: string, displayCnt: number = 3) => ({
    tag: 'div',
    id,
    class: 's7s-container',
    children: [
        ...range(displayCnt).map(() => (display))
    ]
});

const setValue = (element: Element, value: string) => {
    (element as HTMLInputElement).value = value;
    element.setAttribute('value', value);
}

export const setDisplayValue = (display: HTMLElement, value: number) => {
    const displaySize = display.children.length;

    const str = (value % Math.pow(10, displaySize)).toString();

    const padding = displaySize - str.length;
    for (let i = 0; i < padding; i++) {
        setValue(display.children[i].children[0], '0');
    }

    for (let i = 0; i < str.length; i++) {
        setValue(display.children[padding + i].children[0], str[i]);
    }
}

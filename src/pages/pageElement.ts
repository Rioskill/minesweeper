import { Page } from "./page";

export type PageName = 'loading' | 'playing' | 'mainMenu';

export interface PageElement {
    tag: string,
    class?: string
    id?: string
    value?: string | number
    text?: string
    children?: PageElement[]
    params?: {[key: string]: any}
    onLoad?: (params: any)=>void
    onUnload?: ()=>void
}

export const createPageElement = (element: PageElement) => {
    const el = document.createElement(element.tag);

    if (element.class) {
        el.className = element.class;
    }

    if (element.id) {
        el.id = element.id;
    }

    if (element.value) {
        const val = element.value.toString();

        const inputEl = el as HTMLInputElement;
        inputEl.value = val;
        inputEl.setAttribute('value', val);
    }

    if (element.text) {
        el.textContent = element.text;
    }

    if (element.params) {
        Object.entries(element.params).forEach(([key, value]) => el[key] = value);
    }

    element.children?.forEach(child => {
        el.appendChild(createPageElement(child));
    });

    return el;
}

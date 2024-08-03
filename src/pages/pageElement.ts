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

interface PageSwitcherProps {
    entryPoint: HTMLElement;
    pages: { [key: string]: Page }
    initialPage?: PageName
    initialParams?: any
}

export class PageSwitcher {
    entryPoint: HTMLElement;
    currentPage: PageName;
    pages: { [key: string]: Page }

    constructor(props: PageSwitcherProps) {
        // this.currentPage = props.initialPage
        this.entryPoint = props.entryPoint;
        this.pages = props.pages;

        if (props.initialPage) {
            this.changePage(props.initialPage, props.initialParams);
        }
    }

    buildLayout() {
        this.entryPoint.innerHTML = "";
        const currentPage = this.pages[this.currentPage]
        this.entryPoint.appendChild(createPageElement(currentPage.render()));
    }

    changePage(pageName: PageName, params?: any) {
        if (pageName === this.currentPage) {
            return;
        }
        
        const prevPage = this.pages[this.currentPage];
        if (prevPage && prevPage.onUnload) {
            prevPage.onUnload();
        }

        this.currentPage = pageName;

        this.buildLayout();

        const currentPage = this.pages[this.currentPage];
        if (currentPage.onLoad) {
            currentPage.onLoad(params);
        }
    }
}

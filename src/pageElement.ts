export type PageName = 'loading' | 'playing';

export type PageElement = {
    tag: string,
    class?: string
    id?: string
    value?: string | number
    text?: string
    children?: PageElement[]
    params?: {[key: string]: any}
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
        inputEl.value = val;;
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
    pages: { [key: string]: PageElement }
    initialPage?: PageName
}

export class PageSwitcher {
    entryPoint: HTMLElement;
    currentPage: PageName;
    pages: { [key: string]: PageElement }

    constructor(props: PageSwitcherProps) {
        this.currentPage = props.initialPage || 'loading';
        this.entryPoint = props.entryPoint;
        this.pages = props.pages;
    }

    buildLayout() {
        this.entryPoint.innerHTML = "";
        this.entryPoint.appendChild(createPageElement(this.pages[this.currentPage]));
    }

    changePage(pageName: PageName) {
        if (pageName === this.currentPage) {
            return;
        }

        this.currentPage = pageName;
        this.buildLayout();
    }
}

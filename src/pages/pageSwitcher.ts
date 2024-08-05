import { Page } from "./page";
import { createPageElement, PageName } from "./pageElement";

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

import { PageElement, PageSwitcher } from "./pageElement";

export interface Page {
    render: () => PageElement
    onLoad?: (params: any) => void
    onUnload?: ()=>void
}

import { PageElement } from "./pageElement";

export interface Page {
    render: () => PageElement
    onLoad?: (params: any) => void
    onUnload?: ()=>void
}

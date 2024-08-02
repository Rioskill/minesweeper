import { PageSwitcher } from "./pageElement";
import { LoadingPage } from "./pages/loadingPage";
import { MenuPage } from "./pages/menuPage";
import { PlayingPage } from "./pages/playingPage";


export type MapGeneratorData = {
    type: 'percent',
    value: number
} | {
    type: 'result',
    value: number[][]
}

const main = () => {
    const entryPoint = document.getElementById('main');

    if (entryPoint === null) {
        throw new Error('entrypoint not found');
    }

    const pages = {
        'mainMenu': new MenuPage(),
        'loading': new LoadingPage(),
        'playing': new PlayingPage(),
    }

    const switcher = new PageSwitcher({
        entryPoint,
        pages: pages,
    });

    switcher.changePage('mainMenu', switcher);
}

window.addEventListener('load', function onLoadListener() {
    window.removeEventListener('load', onLoadListener, false);
    main();
})

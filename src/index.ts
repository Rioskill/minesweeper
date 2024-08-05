import { PageSwitcher } from "./pages/pageSwitcher";
import { LoadingPage } from "./pages/loadingPage";
import { MenuPage } from "./pages/menuPage";
import { PlayingPage } from "./pages/playingPage";
import { cacher } from "./caching";


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

    cacher.loadPrevSession()
        .then((session) => {
            switcher.changePage('playing', {
                ROWS: session.rows,
                COLS: session.cols,
                MINES: 9,
                mapData: session.mapData,
                offset: session.offset,
                switcher: switcher
            })
        })
        .catch((reason) => {
            console.error(reason);
        })
}

window.addEventListener('load', function onLoadListener() {
    window.removeEventListener('load', onLoadListener, false);
    main();
})

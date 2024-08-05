import { MapGeneratorData } from ".."
import { Page } from "./page"
import { PageSwitcher } from "./pageSwitcher"

export interface onLoadingLoadProps {
    switcher: PageSwitcher,
    ROWS: number
    COLS: number
    MINES: number
}

export class LoadingPage implements Page {
    onLoad({switcher, ROWS, COLS, MINES}: onLoadingLoadProps) {
        const progress = document.querySelector('progress');
        const percentIndicator = document.getElementById('percent-indicator');
    
        if (progress === null) {
            throw new Error('no progress bar on page');
        }
    
        progress.max = 100;
    
        if (percentIndicator === null) {
            throw new Error('no percent indicator on page');
        }
    
        const mapGenerationWorker = new Worker('build/gameMapGeneratorWorker.js');
    
        mapGenerationWorker.onmessage = (evt) => {
            const data: MapGeneratorData = evt.data;
    
            if (data.type === 'percent') {
                const val = Math.floor(data.value);
                progress.value = val;
                percentIndicator.textContent = `${val}%`;
            } else if(data.type === 'result') {
                mapGenerationWorker.terminate();
                
                switcher.changePage('playing', {
                    ROWS,
                    COLS,
                    MINES,
                    mapData: data.value,
                    switcher
                });
            } else {
                console.log(data);
            }

            
        }
    
        mapGenerationWorker.postMessage({
            cols: COLS,
            rows: ROWS,
            mines: MINES
        });
    }
    
    render() {
       return {
        tag: 'div',
        class: 'progressbar-container',
        children: [
            {
                tag: 'label',
                text: 'Generating map'
            },
            {
                tag: 'div',
                class: 'progressbar',
                children: [
                    {
                        tag: 'progress',
                    },
                    {
                        tag: 'span',
                        id: 'percent-indicator',
                        text: '0%'
                    }
                ]
            }
        ]
    } 
    }
}

import { MapGenerator } from "./mapGeneration";

interface StartMessageData {
    cols: number
    rows: number
    mines: number
}

onmessage = (ev: MessageEvent<StartMessageData>) => {
    const data: StartMessageData = ev.data;
    const generator = new MapGenerator(data);

    let prevPercent = 0;
    const minPercentDiff = 2;
    const res = generator.generateMap(percent => {
        if (Math.floor(percent) - prevPercent > minPercentDiff) {
            prevPercent = Math.floor(percent);
            postMessage({
                type: 'percent',
                value: percent
            });
        }
    });

    postMessage({
        type: 'result',
        value: res
    });
}

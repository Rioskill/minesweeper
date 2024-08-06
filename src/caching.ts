interface CacherProps {
    dbname: string
    version: number
}

type ResolveType<T> = (value: T | PromiseLike<T>) => void
type RejectType = (reason?: any) => void;

interface ScheduledReadType<T> {
    transaction?: IDBTransaction
    store: string
    id: string
    resolve: ResolveType<T>
    reject: RejectType
}

interface SheduledPutType {
    store: string
    obj: any
}

interface CacherSetting {
    id: string
    value: string
}

interface SessionProps {
    cols: number
    rows: number
    mines: number
    mapData: Uint8Array
    offset: [number, number]
    gameGoing: boolean
}

class Cacher {
    db: IDBDatabase

    scheduledReads: ScheduledReadType<any>[]
    scheduledPuts: SheduledPutType[]

    constructor(props: CacherProps) {
        this.scheduledReads = [];
        this.scheduledPuts = [];

        const openRequest = indexedDB.open(props.dbname, props.version);

        openRequest.onupgradeneeded = (event) => {
            this.db = openRequest.result;

            if (event.oldVersion === 0) {
                //initialize
                if (!this.db.objectStoreNames.contains('Settings')) { // если хранилище "books" не существует
                    this.db.createObjectStore('Settings', {keyPath: 'id'}); // создаём хранилище
                    this.db.createObjectStore('Session', {keyPath: 'id'});
                }
            }
        };
          
        openRequest.onerror = () => {
            console.error("Error", openRequest.error);
        };
        
        openRequest.onsuccess = () => {
            this.db = openRequest.result;

            this.performScheduledReads();
            this.performScheduledPuts();
        };
    }

    performScheduledPuts() {
        this.scheduledPuts.forEach(({store, obj}) => {
            this.put(store, obj);
        })
    }

    performScheduledReads() {
        this.scheduledReads.forEach(({transaction, store, id, resolve, reject}) => {
            if (transaction === undefined) {
                this.read(store, id)
                    .then((value) => resolve(value))
                    .catch((reason) => reject(reason))
            } else {
                this.readInsideTransaction(transaction, store, id)
                    .then((value) => resolve(value))
                    .catch((reason) => reject(reason))
            }
        })
    }

    scheduleRead<T>(store: string, id: string, transaction?: IDBTransaction): Promise<T> {
        return new Promise((resolve, reject) => {
            this.scheduledReads.push({
                store,
                id,
                resolve,
                reject
            });
        })
    }

    schedulePut(store: string, obj: any) {
        this.scheduledPuts.push({
            store: store,
            obj: obj
        });
    }

    put(store: string, obj: any) {
        let transaction = this.db.transaction(store, "readwrite");
        let storeObj = transaction.objectStore(store);

        let request = storeObj.put(obj);

        request.onsuccess = function() {
            console.log("Setting added to store", request.result);
        };

        request.onerror = function() {
            console.log("Error while inserting setting into store", request.error);
        };
    }

    safePut(store: string, obj: any) {
        if (this.db) {
            this.put(store, obj);
        } else {
            this.schedulePut(store, obj);
        }
    }

    putSetting(setting: CacherSetting) {
        this.safePut('Settings', setting);
    }

    readInsideTransaction<T>(
        transaction: IDBTransaction,
        store: string,
        id: string): Promise<T | undefined> 
    {
        return new Promise((resolve, reject) => {
            let storeObj = transaction.objectStore(store);
    
            const request = storeObj.get(id);

            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result.value);
                } else {
                    resolve(undefined);
                }
            }

            request.onerror = () => {
                reject(request.error)
            }
        })
    }

    read<T>(store: string, id: string): Promise<T | undefined> {
        let transaction = this.db.transaction(store, "readonly");
        return this.readInsideTransaction(transaction, store, id);
    }

    remove(store: string, id: string) {
        let transaction = this.db.transaction(store, "readwrite");

        let storeObj = transaction.objectStore(store);

        storeObj.delete(id);
    }

    safeRead<T>(store: string, id: string, transaction?: IDBTransaction): Promise<T | undefined> {
        if (this.db) {
            return this.read(store, id);
        }

        return this.scheduleRead(store, id, transaction);
    }

    readSetting(id: string): Promise<string | undefined> {
        return this.safeRead('Settings', id);
    }

    saveCurrentSession(session: SessionProps) {
        let transaction = this.db.transaction('Session', "readwrite");
        const sessionObj = transaction.objectStore('Session');

        sessionObj.put({id: 'cols', value: session.cols});
        sessionObj.put({id: 'rows', value: session.rows});
        sessionObj.put({id: 'mines', value: session.mines});
        sessionObj.put({id: 'mapData', value: session.mapData});
        sessionObj.put({id: 'offset', value: session.offset});
        sessionObj.put({id: 'gameGoing', value: session.gameGoing});
    }

    async loadPrevSession(): Promise<SessionProps> {
        const readSessionProp = (id: string) => this.safeRead('Session', id);

        const cols = readSessionProp('cols') as Promise<number>;
        const row = readSessionProp('rows') as Promise<number>;
        const mines = readSessionProp('mines') as Promise<number>;
        const mapData = readSessionProp('mapData') as Promise<Uint8Array>;
        const offset = readSessionProp('offset') as Promise<[number, number]>;
        const gameGoing = readSessionProp('gameGoing') as Promise<boolean>;

        const session = await Promise.all([cols, row, mines, mapData, offset, gameGoing]);

        return {
            cols: session[0],
            rows: session[1],
            mines: session[2],
            mapData: session[3],
            offset: session[4],
            gameGoing: session[5],
        };
    }
}

export const cacher = new Cacher({
    dbname: "test",
    version: 1
});

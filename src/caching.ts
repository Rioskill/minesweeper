interface CacherProps {
    dbname: string
    version: number
}

type ResolveType<T> = (value: T | PromiseLike<T>) => void
type RejectType = (reason?: any) => void;

interface ScheduledReadType<T> {
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
                }
            }

            console.log('upgrade needed')
        };
          
        openRequest.onerror = () => {
            console.error("Error", openRequest.error);
        };
        
        openRequest.onsuccess = () => {
            this.db = openRequest.result;
            console.log('indexed db open succes');

            this.performScheduledReads();
            this.performScheduledPuts();
        };

        console.log('cacher init', this.db)
    }

    performScheduledPuts() {
        this.scheduledPuts.forEach(({store, obj}) => {
            this.put(store, obj);
        })
    }

    performScheduledReads() {
        this.scheduledReads.forEach(({store, id, resolve, reject}) => {
            this.read(store, id)
                .then((value) => resolve(value))
                .catch((reason) => reject(reason))
        })
    }

    scheduleRead<T>(store: string, id: string): Promise<T> {
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

    read<T>(store: string, id: string): Promise<T> {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction(store, "readonly");

            let storeObj = transaction.objectStore(store);
    
            const request = storeObj.get(id);

            request.onsuccess = () => {
                resolve(request.result.value);
            }

            request.onerror = () => {
                reject(request.error)
            }
        })
    }

    safeRead<T>(store: string, id: string): Promise<T> {
        if (this.db) {
            return this.read(store, id);
        }

        return this.scheduleRead(store, id);
    }

    readSetting(id: string): Promise<string> {
        return this.safeRead('Settings', id);
    }
}

export const cacher = new Cacher({
    dbname: "test",
    version: 1
});

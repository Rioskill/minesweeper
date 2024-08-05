interface CacherProps {
    dbname: string
    version: number
}

class Cacher {
    constructor(props: CacherProps) {
        let openRequest = indexedDB.open(props.dbname, props.version);

        openRequest.onupgradeneeded = function(event) {
            let db = openRequest.result;

            if (event.oldVersion === 0) {
                //initialize
                if (!db.objectStoreNames.contains('Settings')) { // если хранилище "books" не существует
                    db.createObjectStore('Settings', {keyPath: 'id'}); // создаём хранилище
                  }
            }
        };
          
        openRequest.onerror = function() {
            console.error("Error", openRequest.error);
        };
        
        openRequest.onsuccess = function() {
            let db = openRequest.result;
            // продолжить работу с базой данных, используя объект db
        };
    }
}

import { isValidJSON } from "@modules/functions/isValidJSON";

export class CustomStorage {
    private readonly customStorageList = {}
    constructor() {
        const allLocalstorageItems = {...localStorage}
        for(const key in allLocalstorageItems) {
            if(key.indexOf('customStorage_') === 0) {
                let value = allLocalstorageItems[key]
                let parsed: boolean = false

                try {
                    value = JSON.parse(value)
                    parsed = true
                }
                catch(e) {}

                if(!parsed && !isNaN(value)) value = parseInt(value)
                this.customStorageList[key.substring(14, key.length)] = value
            }
        }
    }

    get(key: string): any {
        if(!this.customStorageList[key])return
        return this.customStorageList[key]
    }
    set(key: string, value: any): void {
        if(typeof value === undefined)return

        let saveValue = value
        if(typeof value === 'object') saveValue = JSON.stringify(value)
        
        this.customStorageList[key] = value

        window.localStorage.setItem('customStorage_' + key, saveValue)
        window.dispatchEvent(new CustomEvent('customStorageUpdate', {
            detail: {
                storage: {
                    key,
                    value
                }
            }
        }))
    }
    remove(key: string): void {
        if(!this.customStorageList[key])return
        const value = this.get(key)

        window.localStorage.removeItem('customStorage_' + key)
        document.dispatchEvent(new CustomEvent('customStorageUpdate', {
            detail: {
                storageRemoved: {
                    key,
                    value
                }
            }
        }))
    }

    isExists(key: string): boolean {
        return this.customStorageList[key] ? true : false
    }
}
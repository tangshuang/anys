export class AnysStoreMemoryPlugin {
    constructor(anys) {
        this.anys = anys;
        this.logs = [];
    }

    write(log) {
        this.logs.push(log)
    }

    read() {
        return this.logs;
    }
}

export class Evt {
    constructor() {
        this.$events = [];
    }

    on(event, callback) {
        this.$events.push([event, callback]);
    }

    emit(event, ...args) {
        this.$events.forEach(([eventName, callback]) => {
            if (event === eventName) {
                callback(...args);
            }
        });
    }

    off(event, callback) {
        this.$events.forEach(([eventName, eventCall], i) => {
            if (event === eventName && eventCall === callback) {
                this.$events.splice(i, 1);
            }
        });
    }
}
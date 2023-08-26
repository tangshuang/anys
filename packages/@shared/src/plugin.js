export class AnysPlugin {
    constructor(anys) {
        this.anys = anys;
        this.$effects = {};
    }

    start() {
        // @ts-ignore
        if (!this.options) {
            return;
        }

        // @ts-ignore
        const options = this.options();
        const keys = Object.keys(options);
        const affect = (name) => {
            const methodName = `register${name.replace(name[0], name[0].toUpperCase())}`;
            if (this[methodName]) {
                const revoke = this[methodName]();
                this.$effects[name] = revoke;
            }
        };

        const stch = this.anys.options;
        keys.forEach((key) => {
            if (stch[key]) {
                affect(key);
            }
        });
    }

    stop() {
        // @ts-ignore
        if (!this.options) {
            return;
        }

        // @ts-ignore
        const options = this.options();
        const keys = Object.keys(options);
        const stch = this.anys.options;

        keys.forEach((key) => {
            const revoke = this.$effects[key];
            if (stch[key] && revoke) {
                revoke();
            }
            this.$effects[key] = null;
        });
    }
}

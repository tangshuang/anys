type AnysOptions = {
    /**
     * whether start plugins automaticly
     */
    autoStart?: boolean,
    /**
     * auto send logs to server side,
     * if false, you should must invoke .send to report manually
     */
    autoReport?: boolean,
    /**
     * plugins
     */
    plugins?: Array<Function> | { [key: string] : Function },
    /**
     * defines
     */
    defines?: {
        [key: string]: () => any,
    },
    /**
     * filters
     */
    filters?: Array<Function>,

    [key: string]: any,
}

type LogData = {
    /**
     * log type, i.e. JSError, click, mousemove ...
     */
    type: string,
    /**
     * log created timestamp with Date.now()
     */
    time: number,
    /**
     * log level,
     * 0-10 report immediately
     * 11-100 report later with logs bundle
     * 100+ do not report automaticly, should report by manually
     */
    level?: number,
    /**
     * target name of Element, Error ...
     */
    name?: string,
    /**
     * log message, i.e. error.message
     */
    msg?: string,
    /**
     * log detail information
     */
    detail?: string,

    [key: string]: string | number | boolean,
}

export class Anys {
    constructor(public options: AnysOptions);

    plugins: {
        [key: string]: any;
    };

    init(options: AnysOptions): void;

    define(key: string, get: () => number | string): void;

    on(event: string, callback: (...args: any[]) => void): void;

    emit(event: string, ...args: any[]): void;

    refreshTraceId(): void;

    refreshRequestId(): void;

    start(): void;

    write(log: LogData): void;

    report(message?: any): void;

    stop(): void;
}
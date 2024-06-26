type AnysOptions = {
    /**
     * whether start plugins automaticly
     */
    autoStart?: boolean,
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
     * log level
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
    detail?: any,

    [key: string]: any,
}

export class Anys {
    constructor(public options: AnysOptions);

    plugins: {
        [key: string]: any;
    };

    clientId: string;

    traceId: string;

    requestId: string;

    init(options: AnysOptions): void;

    define(key: string, get: () => number | string): void;

    on(event: string, callback: (...args: any[]) => void): void;

    off(event: string, callback: (...args: any[]) => void): void;

    emit(event: string, ...args: any[]): void;

    refreshTraceId(): void;

    refreshRequestId(): void;

    start(): void;

    write(log: LogData): void;

    report(message?: any): Promise<void>;

    send(log: LogData | LogData[]): Promise<void>;

    stop(): void;
}

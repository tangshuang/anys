export function tryRun(fn, fallback) {
    try {
        return fn();
    }
    catch (e) {
        fallback(e);
    }
}
export function objectValues(obj) {
    const keys = Object.keys(obj);
    const values = keys.map(key => obj[key]);
    return values;
}

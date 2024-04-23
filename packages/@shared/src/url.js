export function replaceUrlSearch(url, params) {
    const encode = (value) => encodeURIComponent(value);

    const index = url.indexOf('?');
    if (index < 0) {
        const search = Object.keys(params)
            .map((key) => `${key}=${encode(params[key])}`)
            .join('&');
        const [path, hash] = url.split('#');
        return path + '?' + search + (hash ? '#' + hash : '');
    }

    const [path, right] = url.split('?');
    const [search, hash] = right.split('#');

    const origin = search.split('&')
        .map((item) => item.split('='))
        .map((kv) => {
            const [key, ...values] = kv;
            const value = values.join('=');
            return [key, value];
        })
        .reduce((map, [key, value]) => ({ ...map, [key]: value }), {});
    Object.assign(origin, params);

    const newSearch = Object.keys(origin).map((key) => `${key}=${encode(origin[key])}`).join('&');
    return path + '?' + newSearch + (hash ? '#' + hash : '');
}

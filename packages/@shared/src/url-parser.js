export function replaceUrlSearch(url, params) {
    const index = url.indexOf('?');
    if (index < 0) {
        const search = Object.keys(params)
            .map((key) => `${key}=${params[key]}`)
            .join('&');
        const [path, hash] = url.split('#');
        return path + '?' + search + (hash ? '#' + hash : '');
    }

    const [path, right] = url.split('?');
    const [search, hash] = right.split('#');

    const origin = search.split('&')
        .map((item) => item.split('='))
        .reduce((map, [key, value]) => ({ ...map, [key]: value }), {});
    Object.assign(origin, params);

    const newSearch = Object.keys(origin).map((key) => `${key}=${origin[key]}`).join('&');
    return path + '?' + newSearch + (hash ? '#' + hash : '');
}

export function camelCase(str) {
    const words = str.split(/[\W|_|$]/);
    const items = words.map(item => item.replace(item[0], item[0].toUpperCase()));
    return items.join('');
}

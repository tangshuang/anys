import { createRandomString } from 'ts-fns';

export function toUrlParams(data, preLen) {
    const keys = Object.keys(data);
    const entries = keys.map((key) => ([key, data[key]]));
    entries.sort((a, b) => {
        if ((`${a[1]}`).length < (`${b[1]}`).length) {
            return -1;
        }
        if ((`${a[1]}`).length > (`${b[1]}`).length) {
            return 1;
        }
        return 0;
    });

    const limitLen = 8182 - preLen;

    const lid = createRandomString(6);
    const params = [];
    let index = 0;
    entries.forEach(([key, v]) => {
        const value = encodeURIComponent(v);
        const kv = `${key}=${value}`;
        const segment = `&_seg=${lid}_${index}_{count}`;
        const curr = params[index] || '';

        // value is too long, split value
        if ((kv + segment).length > limitLen) {
            let firstBlockLen = 0;
            // split value to append to curr
            if (curr) {
                firstBlockLen = limitLen - curr.length - segment.length - `&${key}=`.length;
                const firstBlock = value.substring(0, firstBlockLen);
                params[index] += `&${key}=${firstBlock}${segment}`;
                index += 1;
            }

            const blockLen = limitLen - segment.length - `&${key}=`.length;
            for (let i = firstBlockLen, len = kv.length; i < len; i += blockLen) {
                const block = value.substring(i, i + blockLen);
                params[index] = `${key}=${block}${segment}`;
                index += 1;
            }
            return;
        }

        // url length is greater than browser's limit, split it and append `s=lid_index`
        if ((`${curr}&${kv}${segment}`).length > limitLen) {
            params[index] = curr + segment;
            index += 1;
            params[index] = kv;
            return;
        }

        params[index] = curr ? `${curr}&${kv}` : kv;
    });

    /**
     * statist segement total count
     */
    const segmentItems = [];
    const segmentStatistics = {};
    params.forEach((str, i) => {
        if (/&_seg=(\w+?)_(\d+?)_\{count\}$/.test(str)) {
            const blocks = str.split('=');
            const seg = blocks.pop();
            const [segName, segIndex] = seg.split('_');
            segmentItems.push({
                at: i,
                name: segName,
                index: segIndex,
                left: blocks.join('='),
            });
            segmentStatistics[segName] = segmentStatistics[segName] || 0;
            segmentStatistics[segName] ++;
        }
        return str;
    });
    segmentItems.forEach(({ at, name, index, left }) => {
        const count = segmentStatistics[name];
        params[at] = left + `&_seg=${name}_${index}_${count}`;
    });

    return params;
}

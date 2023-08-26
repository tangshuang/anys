import { findNode } from './dom-path.js';

/**
 * recover snapshot into given document
 * @param {object} snapshot snapshot information
 * @param {string} snapshot.html document.documentElement.innerHTML when snapshot
 * @param {object} snapshot.doctype document.doctype when snapshot
 * @param {object} snapshot.attrs <html> tag attributes when snapshot
 * @param {array} snapshot.values form values when snapshot, with [{ el: path of form input element, value: input value }]
 * @param {Location} url window.location when snapshot happen
 * @param {Document} doc the document which to recover snapshot into
 */
export function recoverSnapshot(snapshot, url, doc) {
    const { html, attrs, values, doctype } = snapshot;

    const doctypeText = `<!DOCTYPE ${doctype.name}${doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : ''}${doctype.systemId ? ` "${doctype.systemId}"` : ''}>`;
    doc.write(`${doctypeText}<html></html>`);

    const innerHTML = html
        .replace(/href=["'](.*?)["']/g, (matched, href) => {
            if (/^\/\w/.test(href)) {
                return `href="${url.protocol}://${url.host}${href}"`;
            }
            return matched;
        })
        .replace(/src=["'](.*?)["']/g, (matched, src) => {
            if (/^\/\w/.test(src)) {
                return `src="${url.protocol}://${url.host}${src}"`;
            }
            return matched;
        });
    doc.documentElement.innerHTML = innerHTML;

    const root = doc.querySelector('html');
    const keys = Object.keys(attrs);
    keys.forEach((key) => {
        const value = attrs[key];
        root.setAttribute(key, value);
    });

    values.forEach(({ el, value }) => {
        const target = findNode(el, doc);
        if (target) {
            target.setAttribute('value', value);
        }
    });
}

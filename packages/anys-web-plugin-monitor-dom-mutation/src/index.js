import { AnysPlugin, getPath } from 'anys-utils';
import { createRandomString } from 'ts-fns';

export class AnysMonitorDOMMutationPlugin extends AnysPlugin {
    init() {
        this.currentSnapshotId = '';
        this.currentMutationId = '';
        this.currentMutationNo = 0;
    }

    options() {
        return {
            mutation: true,
        };
    }

    registerMutation() {
        const observer = this.createObserver((logs) => {
            const mutationId = createRandomString(8);
            const number = this.currentMutationNo + 1;
            const log = {
                type: 'mutation',
                time: Date.now(),
                detail: logs,
                ssid: this.currentSnapshotId,
                ssno: number,
                curr: mutationId,
                prev: this.currentMutationId,
            };
            this.anys.write(log);
            this.currentMutationId = mutationId;
            this.currentMutationNo = number;
        });

        // record after loaded
        window.addEventListener('load', () => {
            observer.observe(document, {
                characterData: true,
                attributes: true,
                childList: true,
                subtree: true,
            });
            this.recordSnapshot();
            buildPath(document.documentElement);
        });

        const autoRecordWhenRefreshTrace = () => {
            this.recordSnapshot();
        };
        this.anys.on('refreshTraceId', autoRecordWhenRefreshTrace);

        return () => {
            observer.disconnect();
            this.anys.off('refreshTraceId', autoRecordWhenRefreshTrace);
        };
    }

    recordSnapshot() {
        const snapshot = createSnapshot();
        const snapshotId = createRandomString(8);

        const url = window.location.href;
        const a = new URL(url);
        const path = a.pathname.replace(/^([^/])/, '/$1');

        this.anys.write({
            type: 'snapshot',
            time: Date.now(),
            url: {
                uri: path + (a.search ? `?${a.search}` : ''),
                path,
                protocol: a.protocol.replace(':', ''),
                host: a.hostname,
                port: a.port,
                search: a.search,
                hash: a.hash.replace('#', ''),
            },
            detail: snapshot,
            ssid: snapshotId,
        });
        this.currentSnapshotId = snapshotId;
        this.currentMutationNo = 0;
    }

    createObserver(callback) {
        const isInIgnore = (node) => {
            if (node.hasAttribute?.('data-ignore')) {
                return true;
            }

            let parent = node.parentNode;
            while (parent) {
                if (parent.hasAttribute?.('data-ignore')) {
                    return true;
                }
                parent = parent.parentNode;
            }

            return false;
        };

        const observer = new MutationObserver((inputs) => {
            /**
             * @type any[]
            */
           const mutations = [];
           const changes = [...inputs].reverse();
            changes.forEach((item) => {
                const { type, target, attributeName, oldValue } = item;

                // ignore nodes which are special
                if (isInIgnore(target)) {
                    return;
                }

                if (type === 'attributes') {
                    // @ts-ignore
                    const next = target.getAttribute(attributeName);
                    if (next === oldValue) {
                        return;
                    }
                    if (mutations.find(item => item.type === type && item.target === target && item.attributeName === attributeName)) {
                        return;
                    }
                }
                else if (type === 'characterData') {
                    // @ts-ignore
                    const next = target.data;
                    if (next === oldValue) {
                        return;
                    }
                    if (mutations.find(item => item.type === type && item.target === target && item.target.data === next)) {
                        return;
                    }
                }

                mutations.push(item);
            });
            mutations.reverse();

            /**
             * records as logs
             */

            const logs = [];
            mutations.forEach((mutation) => {
                const { type, target, attributeName, oldValue } = mutation;
                const targetPath = target.path || getPath(target);
                const getRelativePath = (someNode) => {
                    const somePath = getPath(someNode);
                    return somePath.replace(targetPath + '/', '');
                };

                if (type === 'attributes') {
                    const next = target.getAttribute(attributeName);
                    const prev = oldValue;
                    logs.push({
                        type: 'attribute',
                        target: targetPath,
                        name: attributeName,
                        next,
                        prev,
                    });
                }
                else if (type === 'characterData') {
                    const next = target.data;
                    const prev = oldValue;
                    logs.push({
                        type: 'text',
                        target: targetPath,
                        next,
                        prev,
                    });
                }
                else if (type === 'childList') {
                    // ignore textarea inside changes
                    if (target.nodeName === 'TEXTAREA') {
                        return;
                    }

                    const { removedNodes, addedNodes, previousSibling, nextSibling } = mutation;

                    const movedNodes = [];
                    const remove = Array.from(removedNodes)
                        .map((node) => {
                            // move node
                            if (document.body.contains(node)) {
                                movedNodes.push({
                                    node,
                                    path: getPath(node),
                                });
                                return;
                            }

                            // when a node is removed after inserted immediately,
                            // it will be treated as moved as previous

                            // path relative to target
                            const nodePath = node.path ? getRelativePath(node) : null;
                            const before = previousSibling ? getPath(previousSibling) : null;
                            const after = nextSibling ? getPath(nextSibling) : null;
                            const patch = {};
                            if (nodePath) {
                                patch.node = nodePath;
                            }
                            else {
                                patch.before = before;
                                patch.after = after;
                            }
                            return patch;
                        })
                        .filter(Boolean);
                    const move = [];
                    const insert = Array.from(addedNodes)
                        .map((node) => {
                            // we SHOULD MUST read nextSibling's path sibling we invoke buildPath
                            const sibling = node.nextSibling ? getRelativePath(node.nextSibling) : null;

                            // move node
                            // when a node is inserted and moved immediately, it will go through
                            // insert -> remove -> insert
                            // we treat it as
                            // insert -> move
                            // when remove, we create movedNode.path, so here we get it as expected
                            // if a node is removed after inserted immediately but not inserted, we drop it
                            const movedNode = movedNodes.find(item => item.node === node);
                            if (movedNode) {
                                move.push({
                                    node: movedNode.path,
                                    sibling,
                                });
                                return;
                            }

                            const isText = node.nodeName === '#text';
                            const isComment = node.nodeName === '#comment';

                            const text = isText ? node.data : null;
                            const comment = isComment ? node.data : null;
                            const html = isText || isComment ? null : clearHtml(node.outerHTML);

                            return {
                                text,
                                html,
                                comment,
                                sibling,
                            };
                        })
                        .filter(Boolean);

                    logs.push({
                        type: 'children',
                        target: targetPath,
                        remove,
                        insert,
                        move,
                    });

                    // rebuild node and its children's path
                    buildPath(target);
                }
            });

            // record mutation logs
            callback(logs);
        });

        // build all nodes' path
        buildPath(document);

        return observer;
    }
}

function buildPath(node) {
    if (node !== document) {
        const path = getPath(node);
        node.path = path;
    }

    const children = node.childNodes;
    Array.from(children).forEach((el) => {
        buildPath(el);
    });
}

function clearHtml(html) {
    return html
        // noscript
        .replace(/<script([^]*?)>([^]*?)<\/script>/gm, '<noscript$1></noscript>')
        .replace(/<noscript([^]*?)>([^]*?)<\/noscript>/gm, '<noscript$1></noscript>')
        // // remove script
        // .replace(/<script([^]*?)>([^]*?)<\/script>/gm, '')
        // remove preload script
        .replace(/<link([^]*?)as="script"([^]*?)>/g, '<link$1$2>')
        .replace(/\n\n*\s*\n*\n/gm, '\n');
}

function createFormSnapshot() {
    const forms = document.querySelectorAll('input, textarea, select');
    const data = [];
    Array.from(forms).forEach((el) => {
        const target = getPath(el);
        // @ts-ignore
        const value = el.type === 'password' ? '***' : el.value;
        data.push({ el: target, value });
    });
    return data;
}

export function createSnapshot() {
    const { name, publicId, systemId } = document.doctype;
    const doctype = { name, publicId, systemId };

    const content = document.documentElement.innerHTML;
    const html = clearHtml(content);

    const attrs = {};
    const el = document.querySelector('html');
    for (let { name, value } of el.attributes) {
        attrs[name] = value;
    }

    const values = createFormSnapshot();

    return { doctype, attrs, html, values };
}

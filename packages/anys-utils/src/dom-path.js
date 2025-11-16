export function getPath(node, root = document.documentElement) {
    const { nodeName, path: nodePath } = node;

    if (nodePath) {
        return nodePath;
    }

    if (nodeName === 'BODY' || nodeName === 'HTML' || nodeName === 'HEAD') {
        return nodeName;
    }

    const path = [];

    let current = node;
    let parent = node.parentNode;

    const findIndex = (node) => {
        const { nodeName, parentNode } = node;
        // the node is not in document
        if (!parentNode) {
            return -1;
        }
        const siblings = [].filter.call(parentNode.childNodes, item => item.nodeName === nodeName);
        const index = siblings.indexOf(node);
        return index;
    };

    if (nodeName[0] === '#') {
        const index = findIndex(node);
        path.push(`${nodeName}:${index}`);
        current = parent;
        parent = current.parentNode;
    }

    while (parent) {
        if (current === root) {
            break;
        }
        const { nodeName } = current;
        if (nodeName === 'BODY' || nodeName === 'HTML' || nodeName === 'HEAD') {
            path.push(nodeName);
        }
        else {
            const index = findIndex(current);
            path.push(`${nodeName.toLowerCase()}:${index}`);
        }
        current = parent;
        parent = current.parentNode;
    }
    path.reverse();
    return path.join('/');
}

export function findNode(selector, root = document) {
    if (!selector) {
        return root;
    }

    // HTML, BODY, HEAD
    if (/^[A-Z]+$/.test(selector)) {
        return root.querySelector(selector);
    }

    const path = selector.split('/');
    const items = path.map(item => item.split(':'));

    const el = items.reduce((target, [name, index]) => {
        if (!target) {
            return null;
        }

        if (/^[A-Z]+$/.test(name)) {
            return target.querySelector(name);
        }

        if (+index < 0) {
            return null;
        }

        const siblings = [].filter.call(target.childNodes, child => child.nodeName.toLowerCase() === name);
        const sibling = siblings[index];
        return sibling;
    }, root);

    if (!el) {
        return null;
    }

    return el;
}
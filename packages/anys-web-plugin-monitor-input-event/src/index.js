import { AnysPlugin, getPath } from 'anys-shared';

export class AnysMonitorInputEventPlugin extends AnysPlugin {
    options() {
        return {
            input: true,
        };
    }

    registerInput() {
        const extract = (filter) => (e) => {
            const {
                target, type, inputType, data,
            } = e;

            if (inputType === 'insertCompositionText') {
                return;
            }

            if (type === 'compositionend' && !data) {
                return;
            }

            const { tagName, value } = target;

            // ignore input when set anys-ignore attribute
            if (target.getAttribute('anys-ignore')) {
                return;
            }

            const elInput = target.getAttribute('type');

            const detailData = filter({ tagName, value, type: elInput, target });
            if (!detailData) {
                return;
            }

            const log = {
                type: 'input',
                time: Date.now(),
                el: getPath(target),
                detail: detailData,
            };
            this.anys.write(log);
        };

        const listenInput = extract(({ tagName, value, type }) => {
            if (tagName === 'INPUT' && type !== 'radio' && type !== 'checkbox' && type !== 'password') {
                return { value, type };
            }

            if (tagName === 'INPUT' && type === 'password') {
                return { value: '***', type };
            }

            if (tagName === 'TEXTAREA') {
                return { value, type: 'textarea' };
            }
        });

        const listenChange = extract(({ tagName, value, type }) => {
            if (tagName === 'SELECT') {
                return { value, type: 'select' };
            }

            if (tagName === 'INPUT' && (type === 'radio' || type === 'checkbox')) {
                return { value, type };
            }
        });

        const listenPaste = extract(({ tagName, value, type }) => {
            if (tagName === 'TEXTAREA') {
                return { value, type: 'textarea' };
            }

            if (tagName === 'INPUT') {
                return { value, type };
            }
        });

        document.addEventListener('input', listenInput, true);
        document.addEventListener('compositionend', listenInput, true);
        document.addEventListener('change', listenChange, true);
        document.addEventListener('paste', listenPaste, true);

        return () => {
            document.removeEventListener('input', listenInput);
            document.removeEventListener('compositionend', listenInput);
            document.removeEventListener('change', listenChange);
            document.removeEventListener('paste', listenPaste);
        };
    }
}

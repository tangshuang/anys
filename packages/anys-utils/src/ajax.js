export function ajaxPost(url, data) {
    return new Promise((resolve, reject) => {
        // @ts-ignore
        const XHR = window.__XMLHttpRequest || window.XMLHttpRequest;

        const http = new XHR();
        http.open('POST', url, true);
        http.onreadystatechange = function() {
            if(http.readyState == 4) {
                if (http.status == 200 || http.status === 0) {
                    resolve(http.responseText);
                }
                else {
                    reject(new Error(`ajax post fail with status ${http.status}`));
                }
            }
        };
        http.onerror = reject;
        http.send(JSON.stringify(data));
    });
}
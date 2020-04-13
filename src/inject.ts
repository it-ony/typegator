function injectScript() {

    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if (!tabs.length) {
            return;
        }

        let tabId = tabs[0].id!!;

        chrome.tabs.executeScript(tabId, {
            file: 'js/content.js'
        });

        chrome.tabs.insertCSS(tabId, {
            file: 'css/content.css'
        });

    });

}

export {injectScript}

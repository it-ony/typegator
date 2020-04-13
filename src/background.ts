import {injectScript} from './inject';

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!tab.active) {
        return;
    }

    function getPopUp() {
        return chrome.extension.getViews({
            type: "popup"
        })[0];
    }

    if (changeInfo.status === "loading" && getPopUp() !== undefined) {
        // page reloaded, we need to inject the content script once again
        injectScript();
    }
});


let form  = document.querySelector('form'),
    input = document.querySelector('input'),
    tabId,
    nodeCount = document.querySelector('.node-count');

chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    tabId = tabs[0].id;

    chrome.tabs.executeScript(tabId, {
        file: 'content.js'
    }, function() {
        invoke('clear');
    });

    chrome.tabs.insertCSS(tabId, {
        file: 'content.css'
    });

});

form.addEventListener('submit', e => {
    e.preventDefault();
});

/***
 * handle key navigation
 */
input.addEventListener('keydown', e => {

    if (e.code === 'Enter' && (e.metaKey || e.ctrlKey)) {
        invoke('open', {
            metaKey: e.metaKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey
        });

        invoke('clear');
    } else if (e.shiftKey && (e.code === 'Tab' || e.code === 'Enter') || e.code === 'ArrowUp') {
        navigate(e, -1);
    } else if (e.code === 'Tab' || e.code === 'ArrowDown' || e.code === 'Enter') {
        navigate(e, 1);
    } else if (e.code === 'Escape') {
        invoke('clear');
    }
});

/***
 * handle search query
 */
input.addEventListener('keyup', () => {
    let query = input.value.trim();

    if (query) {
        invoke('search', {query: query}, updateMatchedNodes);
    } else {
        updateInfo(0, 0);
    }
});

function navigate(e, step) {
    e.preventDefault();
    invoke('navigate', {step: step}, updateMatchedNodes);
}

function updateMatchedNodes(err, result) {
    updateInfo(result.selectedIndex, result.nodeCount)
}

function updateInfo(index, count) {
    form.classList[count > 0 ? 'remove' : 'add']('no-results');
    form.classList[input.value.trim().length ? 'remove' : 'add']('no-content');

    nodeCount.innerText = [index + 1, count].join('/');
}

function invoke(method, parameter, callback) {
    chrome.tabs.sendMessage(tabId, {
        method: method,
        parameter: parameter
    }, response => {
        callback && callback(response.error, response.result);
    });
}
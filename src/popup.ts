import {Query, QueryType} from "./query";


let form: HTMLFormElement = document.querySelector('form')!!,
    input: HTMLInputElement = document.querySelector('input')!!,
    linkResults: HTMLUListElement = document.querySelector<HTMLUListElement>('#results #links')!!,
    tabResults = document.querySelector('#results #tabs'),
    tabId: number,
    currentAction: Action | null = null,
    actionList: Array<Action> = [],
    currentQuery: Query = Query.EMPTY;

class Action {
    item: any;
    private node: HTMLElement;

    type: string;

    constructor(item: any, node: HTMLElement, type: string) {
        this.item = item;
        this.node = node;
        this.type = type;
    }

    select() {
        this.node.classList.add('active');
        // @ts-ignore
        this.node.scrollIntoViewIfNeeded();
    }

    deselect() {
        this.node.classList.remove('active');
    }
}

chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    tabId = tabs[0].id!!;

    chrome.tabs.executeScript(tabId, {
        file: 'js/content.js'
    });

    chrome.tabs.insertCSS(tabId, {
        file: 'css/content.css'
    });

});

form.addEventListener('submit', e => {
    e.preventDefault();
});

window.addEventListener('keydown', e => {

    let index = actionList.indexOf(currentAction);

    if ((!e.shiftKey && e.code === 'ArrowUp') || (e.shiftKey && e.code === 'Tab')) {
        selectItem(-1);
    } else if ((!e.shiftKey && e.code === 'ArrowDown') || e.code === 'Tab') {
        selectItem(1);
    } else if (e.code === 'Escape') {
        // clear
        clear();
    } else if (e.code === 'Enter' && currentAction) {
        // open
        if (currentAction.type === 'link') {
            invoke('open', {
                index: currentAction.item.index,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                shiftKey: e.shiftKey,
                metaKey: e.metaKey
            });

        } else if (currentAction.type === 'tab') {

            chrome.tabs.update(currentAction.item.tabId, {
                active: true
            });
            chrome.windows.update(currentAction.item.windowId, {
                focused: true
            });

            window.close();

        }

        clear();


    }

    function selectItem(step) {

        e.preventDefault();
        e.stopImmediatePropagation();

        if (index + step >= 0 && index + step < actionList.length) {
            currentAction.deselect();
            currentAction = actionList[index + step];
            currentAction.select();

            invoke('highlight', {
                index: currentAction.item.index
            });
        }


    }

}, true);


/***
 * handle search query
 */
input.addEventListener('keyup', () => {

    const query = Query.parse(input.value.trim());

    if (currentQuery.equals(query)) {
        return;
    }

    currentQuery = query;

    if (query.search) {

        let searchLinks = new Promise((resolve, reject) => {
            invoke('search', {query: query.search}, (err, results) => {
                err ? reject(err) : resolve(results);
            });
        });

        let searchTabs = new Promise(resolve => {
            chrome.tabs.query({}, tabs => {
                let regExp = new RegExp(query.search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");

                resolve(tabs
                    .filter(t => query.search === "*" || regExp.test(t.title || "") || regExp.test(t.url || ""))
                    .map(t => {
                        return {
                            text: t.title,
                            href: t.url,
                            img: t.favIconUrl,
                            tabId: t.id,
                            windowId: t.windowId
                        }
                    }));
            });
        });

        let empty = new Promise(resolve => {
            resolve([]);
        });

        let searchFor = [];
        if (query.type === undefined) {
            searchFor = [searchLinks, searchTabs];
        } else if (query.type === QueryType.Link) {
            searchFor = [searchLinks, empty];
        } else if (query.type === QueryType.Tab) {
            searchFor = [empty, searchTabs];
        }

        Promise
            .all(searchFor)
            .then(values => {

                actionList = [];
                updateList(linkResults, values[0], 'link');
                updateList(tabResults, values[1], 'tab');

                currentAction = actionList[0];
                if (currentAction) {
                    currentAction.select();

                    invoke('highlight', {
                        index: currentAction.item.index
                    });
                }


            });

    } else {
        clear(false);
    }
});


function clear(clearInput:boolean = true) {

    invoke('clear');

    if (clearInput) {
        input.value = "";
    }

    updateList(linkResults);
    updateList(tabResults);
}

function updateList(container, items = null, type: string = null) {
    while (container.childNodes.length) {
        container.removeChild(container.childNodes[0]);
    }

    if (!items) {
        return;
    }

    items.forEach(item => {
        let li = document.createElement('li');

        if (item.img) {
            let img = document.createElement('img');
            img.src = item.img;
            li.appendChild(img);
        }

        let p = document.createElement('p');
        // TODO: highlight matched areas
        p.innerText = item.text;
        li.appendChild(p);

        if (item.href) {
            let div = document.createElement('div');
            div.className = 'details';
            div.innerText = item.href;

            li.appendChild(div);
        }

        container.appendChild(li);

        actionList.push(new Action(item, li, type));
    });
}


function invoke(method: string, parameter: object = {}, callback?: (error: any, result: any) => void) {
    console.debug(`invoke method ${method}`);
    
    chrome.tabs.sendMessage(tabId, {
        method: method,
        parameter: parameter
    }, response => {
        console.debug("got response", response);
        callback && callback(response.error, response.result);
    });
}

(function () {

    const documentElement = document.documentElement;


    const CANDIDATE_CLASS = "search-candidate";
    const CANDIDATE_CLASS_SELECTED = "search-candidate-selected";

    if (documentElement.classList.contains('typegator')) {
        return;
    }

    documentElement.classList.add('typegator');


    class LinkSearch {

        private lastQuery = null;
        private candidateNodes = [];
        private selectedNodeIndex: number;

        search(query) {
            if (query === this.lastQuery) {
                return undefined;
            }

            if (query === '') {
                this.clear();
                return undefined;
            }

            const regex = this.createRegex(query);

            this.lastQuery = query;
            this.clearSelection();

            const nodes = this.getNodes("a,button,[role='button'],[role='tab']")
                .map(node => {

                    function createEntry(text: string) {

                        text = (text || "").trim();

                        if (!regex.test(text)) {
                            return false;
                        }

                        let action = node.getAttribute("aria-haspopup");
                        action = (action === "true" ? "menu" : action);

                        if (!action && node.getAttribute("role") == "tab") {
                            action = "tab";
                        }

                        let details = node.href || node.getAttribute("aria-label") || node.getAttribute("title") || action;

                        let img;

                        let svg = node.querySelector("svg[class*=icon]");
                        if (svg) {
                            svg = svg.cloneNode(true);
                            svg.setAttribute("width", "100%");
                            svg.setAttribute("height", "100%");
                            
                            let icon = window.btoa(new XMLSerializer().serializeToString(svg));
                            img = "data:image/svg+xml;base64," + icon;
                        }

                        if (["menu", "tree", "tab"].indexOf(action) !== -1) {
                            img = chrome.extension.getURL('/img/' + action + ".svg");
                        }

                        return {
                            text: text,
                            href: details,
                            node: node,
                            img: img
                        };
                    }

                    return createEntry(node.innerText) || createEntry(node.getAttribute("aria-label"));

                })
                .filter(a => a !== false)
                .filter(a => {
                    const node = a.node;
                    return !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length)
                });

            this.candidateNodes = nodes.map(a => a.node);

            this.candidateNodes.forEach(n => {
                n.classList.add(CANDIDATE_CLASS);
            });

            return nodes.map((a, index) => {
                return {
                    text: a.text,
                    href: a.href,
                    img: a.img,
                    title: a.title,
                    index: index
                };
            });
        }

        clear() {
            this.selectedNodeIndex = 0;
            this.clearSelection();
            this.candidateNodes = [];
        }

        clearSelection() {
            this.candidateNodes.forEach((a) => {
                a.classList.remove(CANDIDATE_CLASS);
                a.classList.remove(CANDIDATE_CLASS_SELECTED);
            })
        }

        highlight(index) {
            this.candidateNodes.forEach((a, i) => {
                a.classList[i === index ? 'add' : 'remove'](CANDIDATE_CLASS_SELECTED);
            });

            let node = this.candidateNodes[index];
            node && node.scrollIntoViewIfNeeded();
        }

        open(options) {

            let node = this.candidateNodes[options.index];

            if (!node) {
                return;
            }

            const evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0,
                options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, 0, null);
            node.dispatchEvent(evt);

            this.clear();
        }

        getSelectedNode() {
            return this.candidateNodes[this.selectedNodeIndex]
        }

        getNodes(selector) {
            return Array.prototype.slice.call(document.querySelectorAll(selector));
        }

        createRegex(search) {
            return new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
        }
    }

    Object.assign(LinkSearch.prototype, {});

    const typeNavi = window["keyNavi"] = new LinkSearch();

    const methods = {
        search: function (parameter, callback) {
            callback(null, typeNavi.search(parameter.query));
        },
        clear: function () {
            typeNavi.clear();
        },
        open: function (parameter) {
            typeNavi.open(parameter);
        },
        highlight: function (parameter) {
            typeNavi.highlight(parameter.index);
        }
    };

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

        const methodName = request.method;
        const parameter = request.parameter;

        console.log(methodName, parameter);

        const method = methods[methodName];

        if (!method) {
            sendResponse({
                error: `Method '${methodName}' not found`
            });
        } else {
            return method(parameter, function (err, result) {
                sendResponse({
                    error: err,
                    result: result
                });
            });
        }
    });

})();


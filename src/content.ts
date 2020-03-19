(function () {

    const documentElement = document.documentElement;
    const CANDIDATE_CLASS = "search-candidate";

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

            this.candidateNodes = this.getNodes("a,button")
                .filter(a => regex.test(a.innerText))
                .filter(a => !!(a.offsetWidth || a.offsetHeight || a.getClientRects().length));

            return this.candidateNodes.map((a, index) => {
                return {
                    text: a.innerText,
                    href: a.href,
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

        clearSelection () {
            this.candidateNodes.forEach((a) => {
                a.classList.remove(CANDIDATE_CLASS);
            })
        }

        highlight (index) {
            this.candidateNodes.forEach((a, i) => {
                a.classList[i === index ? 'add' : 'remove'](CANDIDATE_CLASS);
            });

            let node = this.candidateNodes[index];
            node && node.scrollIntoViewIfNeeded();
        }

        open (options) {

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

        getSelectedNode () {
            return this.candidateNodes[this.selectedNodeIndex]
        }

        getNodes (selector) {
            return Array.prototype.slice.call(document.querySelectorAll(selector));
        }

        createRegex (search) {
            return new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
        }
    }

    Object.assign(LinkSearch.prototype, {

    });

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


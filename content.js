(function() {

    let documentElement = document.documentElement;

    if (documentElement.classList.contains('typegator')) {
        return;
    }
    
    documentElement.classList.add('typegator');


    function LinkSearch() {
        this.lastQuery = null;
        this.candidateNodes = [];
    }

    let CANDIDATE_CLASS = "search-candidate";

    Object.assign(LinkSearch.prototype, {
        search: function(query) {
            if (query === this.lastQuery) {
                return;
            }

            if (query === '') {
                this.clear();
                return;
            }

            const regex = this.createRegex(query);

            this.lastQuery = query;
            this.clearSelection();

            this.candidateNodes = this.getNodes("a")
                .filter(a => regex.test(a.innerText))
                .filter(a => !!(a.offsetWidth || a.offsetHeight || a.getClientRects().length));

            return this.candidateNodes.map((a, index)=> {
                return {
                    text: a.innerText,
                    href: a.href,
                    title: a.title,
                    index: index
                };
            });
        },

        clear: function() {
            this.selectedNodeIndex = 0;
            this.clearSelection();
            this.candidateNodes = [];
        },

        clearSelection: function() {
            this.candidateNodes.forEach((a) => {
                a.classList.remove(CANDIDATE_CLASS);
            })
        },

        highlight: function(index) {
            this.candidateNodes.forEach((a, i) => {
                a.classList[i === index ? 'add' : 'remove'](CANDIDATE_CLASS);
            });

            let node = this.candidateNodes[index];
            node && node.scrollIntoViewIfNeeded();
        },

        open: function(options) {

            let node = this.candidateNodes[options.index];

            if (!node) {
                return;
            }

            const evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0,
                options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, 0, null);
            node.dispatchEvent(evt);

            this.clear();
        },

        getSelectedNode: function() {
            return this.candidateNodes[this.selectedNodeIndex]
        },

        getNodes: function(selector) {
            return Array.prototype.slice.call(document.querySelectorAll(selector));
        },

        createRegex: function(search) {
            return new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
        }
    });

    const typeNavi = window.keyNavi = new LinkSearch();

    const methods = {
        search: function(parameter, callback) {
            callback(null, typeNavi.search(parameter.query));
        },
        clear: function() {
            typeNavi.clear();
        },
        open: function(parameter) {
            typeNavi.open(parameter);
        },
        highlight: function(parameter) {
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
            return method(parameter, function(err, result) {
                sendResponse({
                    error: err,
                    result: result
                });
            });
        }
    });

})();


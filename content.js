(function() {
    if (window.typeNavi) {
        return;
    }

    function LinkSearch() {
        this.lastQuery = null;
        this.candidateNodes = [];
        this.selectedNodeIndex = 0;
    }

    let SELECTED_CLASS = 'search-candidate-selected';
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

            this.fixBounds();

            this.highlightSelection();
        },

        clear: function() {
            this.selectedNodeIndex = 0;
            this.clearSelection();
            this.candidateNodes = [];
        },

        clearSelection: function() {
            this.candidateNodes.forEach((a) => {
                a.classList.remove(SELECTED_CLASS);
                a.classList.remove(CANDIDATE_CLASS);
            })
        },

        highlightSelection: function() {
            this.candidateNodes.forEach((a, index) => {
                if (this.selectedNodeIndex === index) {
                    a.classList.add(SELECTED_CLASS);
                    a.scrollIntoViewIfNeeded();
                } else {
                    a.classList.remove(SELECTED_CLASS);
                }

                a.classList.add(CANDIDATE_CLASS);
            });
        },

        fixBounds: function() {
            this.selectedNodeIndex = Math.min(Math.max(0, this.selectedNodeIndex), this.candidateNodes.length - 1);
        },

        navigate: function(step, callback) {
            this.selectedNodeIndex += step;
            this.fixBounds();

            this.highlightSelection();

            callback && callback(null, this.getInfo());
        },

        open: function(options) {
            let node = this.getSelectedNode();

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

        getInfo: function() {
            return {
                selectedIndex: this.selectedNodeIndex,
                nodeCount: this.candidateNodes.length
            }
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
            typeNavi.search(parameter.query);
            callback && callback(null, typeNavi.getInfo());
        },
        clear: function() {
            typeNavi.clear();
        },
        navigate: function(parameter, callback) {
            typeNavi.navigate(parameter.step);
            callback && callback(null, typeNavi.getInfo());
        },
        open: function(parameter) {
            typeNavi.open(parameter);
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


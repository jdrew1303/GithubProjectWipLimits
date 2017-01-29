// TODO Look into decomposing a lot of the functions in here to make them 
// easier to add to and to comprehend. One idea is to make the majority of 
// operations maps. 👍 Like to following: 
// 
// $$('.js-project-column-name').map((n) => n.innerText)
//                              .map(n => /\[(\d+)(?:-(\d+))?\]/.exec(n))
//                              .filter(n => !!n)
//                              .map(([,wip]) => wip);
// 
// TODO Also need to add observers for new pipeline additions. Currently it 
// doesnt watch new pipelines, even if they contain a wip limit. It does kick 
// in if you refresh the page.

$(function() {
    
    function updateList($c) {
        $c.each(function() {
            if(!this.list) { 
                new List(this);
            } else { 
                if(this.list.checkWipLimit) { 
                    this.list.checkWipLimit();
                }
            }
        });
    };
    
    // Watches lists for changes 
    var listObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            setTimeout(function() { 
                updateList($(mutation.target).closest('div[id^="project-column-"]')); 
            });
        });
    });

    // Watches the content div for changes. This ensures the board observers
    // are properly wired when you switch from the board list to a particular board 
    var contentObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            var lists = $(mutation.target).find('div[id^="project-column-"]');
            observeLists(lists);
            lists.each(function(index, list) {
                setTimeout(function() { 
                    updateList($(list)); 
                });
            });          
        });
    });

    function observeLists(lists) {
        for(var i = 0, len = lists.length; i < len; i++) {
            listObserver.observe(lists[i], { childList: true, subtree: true });
        }
    }; 

    var content = $.find('.project-container');
    var lists = $.find('div[id^="project-column-"]');

    console.log(lists);
    if(content.length) {
        contentObserver.observe(content[0], { childList: true });
    }
    
    if(lists.length) {
        observeLists(lists);
    }

    // Recalculate limits when the list title is changed
    $('.js-project-column-name').live('mouseup', function(e) {
        setTimeout(function() { 
            updateList($(e.target).parents('div[id^="project-column-"]')); 
        });       
    });

    $('.new-project-column').live('mouseup', function(e) {
        setTimeout(function() {
            updateList($('div[id^="project-column-"]'));
        });
    });

    updateList($('div[id^="project-column-"]'));
});

//.list pseudo
function List(el) {
    if(el.list) return;
	el.list=this;

	var $list = $(el),
        $listHeader,
        listMatch = /\[(\d+)(?:-(\d+))?\]/,
        cardMinLimit,
		cardMaxLimit;   

    $listHeader = $list.find('.js-project-column-name');

    function calcWipLimit() {
        if(!$listHeader) { return; }

        $listHeader.contents().each(function() {

            if(this.nodeType === 3) {
                var listName = this.nodeValue;
                var matches = listMatch.exec(listName);
                
                cardMinLimit = cardMaxLimit = null;
                if(!matches || matches.length != 3) {	return; }
                
                if(typeof matches[2] === 'undefined') {
                    cardMaxLimit = matches[1];
                } else {
                    cardMinLimit = matches[1];
                    cardMaxLimit = matches[2];
                }
            }
        });
    }

    this.checkWipLimit = function() {
        $list.removeClass('over-limit');
        $list.removeClass('at-limit');
        $list.removeClass('under-limit');

        calcWipLimit();
        
        const isNotNull = (x) => (x != null);

        if(isNotNull(cardMaxLimit)) {
            const cardCount = $list.find('.issue-card').not('.hide').length || 0;

            const hasMinLimit = isNotNull(cardMinLimit);
            const isOverMaxLimit = (c) => (c > cardMaxLimit);
            const isUnderMinLimit = (c) => (hasMinLimit && (c < cardMinLimit));
            const isOnMaxLimit = (c) => (c == cardMaxLimit);
            const isOnMinLimit = (c) => (hasMinLimit && (c == cardMinLimit));

            const hasExceededLimits = (c) => (isOverMaxLimit(c) || isUnderMinLimit(c));
            const isOnLimits = (c) => (isOnMaxLimit(c) || isOnMinLimit(c));

            if(hasExceededLimits(cardCount)) {
                $list.addClass('over-limit');
            } else if (isOnLimits(cardCount)) {
                $list.addClass('at-limit');
            } else {
                $list.addClass('under-limit');
            }
        }
    };

    this.checkWipLimit();
};

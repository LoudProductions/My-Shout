var CONST = require('constants');
var dialogs = require('alloy/dialogs');

var _bCanSkipWelcome = false;
var _bNoAnimateInOnOpen = false;
// var _aMates = [];
var _oMateController;

/**
 * self-executing function to organize otherwise inline constructor code
 * @param  {Object} args arguments passed to the controller
 */
(function(args) {

    // Use strict mode for this function scope. We can't do this for all of the
    // controller because after Alloy has compiled all of this file is wrapped.
    // FIXME: https://jira.appcelerator.org/browse/ALOY-1263
    'use strict';

    _bCanSkipWelcome = args.bCanSkipWelcome;
    _bNoAnimateInOnOpen = args.bNoAnimateInOnOpen;

    _.defer(function() {
        init();
    });

    $.animateIn = animateIn;

    /**
     * window open/close
     */
    $.window.addEventListener('open', onWindowOpen);
    $.window.addEventListener('close', onWindowClose);

})(arguments[0] || {});

function init() {
    'use strict';

    // initialise shout model
    $.mShout.set('type', L('shout_wiz_coffee'));

    log.trace('raising shout_wiz controller loaded event...');
    $.trigger('loaded');
}

function onWindowOpen() {
    'use strict';

    $.window.removeEventListener('open', onWindowOpen);

    // set android menu callbacks
    if (OS_ANDROID) {
        $.window.activity.onCreateOptionsMenu = function(e) {
            createAndroidMenu(e.menu);
        };
        $.window.activity.onPrepareOptionsMenu = function(e) {
            prepareAndroidMenu(e.menu);
        };
    }

    // skip welcome page of wizard if requested
    if (_bCanSkipWelcome) {
        $.wiz_pages.scrollToView(1);
    }
    // animate content from transparent to visible
    if (!_bNoAnimateInOnOpen) {
        animateIn();
    }

    log.trace('raising shout_wiz controller open event...');
    $.trigger('open');
}

function onWindowClose() {
    'use strict';

    $.window.removeEventListener('close', onWindowClose);
    // destroy alloy data bindings
    $.destroy();
}

function animateIn() {
    'use strict';

    $.activity_indicator.hide();

    $.wiz_pages.animate(Ti.UI.createAnimation({
        opacity : 1,
        duration : 1000
    }));
}

function createAndroidMenu(menu) {
    'use strict';

    if (OS_ANDROID) {
        var menuItemNext = menu.add({
            itemId : CONST.MENU.SHOUT_WIZ_NEXT,
            title : L('shout_wiz_next'),
            showAsAction : Ti.Android.SHOW_AS_ACTION_ALWAYS,
        });
        menuItemNext.addEventListener('click', wizNext);

        var menuItemDone = menu.add({
            itemId : CONST.MENU.SHOUT_WIZ_DONE,
            title : L('shout_wiz_done'),
            showAsAction : Ti.Android.SHOW_AS_ACTION_ALWAYS,
        });
        menuItemDone.addEventListener('click', wizDone);

        var menuItemAddMate = menu.add({
            itemId : CONST.MENU.SHOUT_WIZ_ADD_MATE,
            title : L('shout_wiz_add_mate'),
            showAsAction : Ti.Android.SHOW_AS_ACTION_NEVER,
        });
        menuItemAddMate.addEventListener('click', goAddMate);
    }
}

function prepareAndroidMenu(menu) {
    'use strict';

    if (OS_ANDROID) {
        var menuItemNext = menu.findItem(CONST.MENU.SHOUT_WIZ_NEXT);
        var menuItemDone = menu.findItem(CONST.MENU.SHOUT_WIZ_DONE);
        var menuItemAddMate = menu.findItem(CONST.MENU.SHOUT_WIZ_ADD_MATE);
        // show/hide menuitems depending on the current wizard page
        if ($.wiz_pages.currentPage === ($.wiz_pages.views.length - 2)) {
            // if on the add mates page, show add/next and hide done
            if (menuItemAddMate) {
                menuItemAddMate.setVisible(true);
            }
            if (menuItemNext) {
                menuItemNext.setVisible(true);
            }
            if (menuItemDone) {
                menuItemDone.setVisible(false);
            }
        } else if ($.wiz_pages.currentPage === ($.wiz_pages.views.length - 1)) {
            // if on the last page, hide add/next and show done
            if (menuItemAddMate) {
                menuItemAddMate.setVisible(false);
            }
            if (menuItemNext) {
                menuItemNext.setVisible(false);
            }
            if (menuItemDone) {
                menuItemDone.setVisible(true);
            }
        } else {
            // otherwise show only next
            if (menuItemAddMate) {
                menuItemAddMate.setVisible(false);
            }
            if (menuItemNext) {
                menuItemNext.setVisible(true);
            }
            if (menuItemDone) {
                menuItemDone.setVisible(false);
            }
        }
    }
}

function changeMenu() {
    'use strict';

    if (OS_ANDROID) {
        // we have to signal android to invalidate the options menu:
        // it will be reconfigured in the onPrepareOptionsMenu handler
        // Ti.Android.currentActivity.invalidateOptionsMenu();
        $.window.activity.invalidateOptionsMenu();
    }
    if (OS_IOS) {

    }
}

function onWizPageChange(e) {
    'use strict';

    if (checkMatesAddedBeforeLastPage()) {
        changeMenu();
    } else {
        wizPrevious();
    }
}

function onShoutPickerChange(e) {
    'use strict';

    $.mShout.set('type', e.selectedValue[0], {
        silent: true
    });
}

function onShoutPlaceChange(e){
    'use strict';

    $.mShout.set('place', e.value, {
        silent: true
    });
}

function onMatesListClick(e) {
    'use strict';

}

function onMatesListDelete(e) {
    'use strict';

}

function onFirstShoutListClick(e) {
    'use strict';

    $.mShout.giveMateTheShout(e.itemId);

    // // run through mates and switch whose got the shout
    // var oFirstShoutListItem;
    // for (var i = 0; i < _aMates.length; i++) {
    //     if (_aMates[i].hasShout) {
    //         _aMates[i].hasShout = false;
    //         oFirstShoutListItem = mapMateListItem(_aMates[i], 'first_shout_template');
    //         $.first_shout_listsection.updateItemAt(i, oFirstShoutListItem, {
    //             animated : true
    //         });
    //     }
    // }
    // _aMates[e.itemIndex].hasShout = true;
    // oFirstShoutListItem = mapMateListItem(_aMates[e.itemIndex], 'first_shout_template');
    // $.first_shout_listsection.updateItemAt(e.itemIndex, oFirstShoutListItem, {
    //     animated : true
    // });
    // // update shout model
    // $.mShout.set('mates', _aMates);
    // $.mShout.set('name', _aMates[e.itemIndex].name);
}

function mapMateListItem(oMate, template) {
    'use strict';

    return {
        template : template || 'mates_template',
        properties : {
            accessoryType : Ti.UI.LIST_ACCESSORY_TYPE_NONE,
            searchableText : oMate.name + oMate.type + oMate.place,
            itemId : oMate.mateId
            // if using built-in item templates for iOS, uncomment these
            // title : oMate.name
            // subtitle : oMate.type + ' @ ' + oMate.place
            // image : ...
        },
        mate_name : {
            text : oMate.name
        },
        mate_poison : {
            text : oMate.poison
        },
        mate_price : {
            // text : oMate.price,
            attributedString : getAttributedPriceText(oMate.price)
        },
        mate_has_shout : {
            text : oMate.hasShout ? Alloy.Globals.fa_icons.bullhorn : null
        }
    };
}

function addShoutMate(oMate) {
    'use strict';

    // var oMate = {
    //     name : $.mates_name_input.value,
    //     poison : $.mates_poison_input.value,
    //     price : $.mates_price_input.value,
    //     hasShout : _aMates.length === 0 ? true : false
    // };
    //
    // if (!oMate.name || !oMate.poison || !oMate.price) {
    //     return toast.show(L('app_please_provide_missing_input'));
    // }

    $.mShout.addMate(oMate);

    // add mate to list
    var aMateListItem = [mapMateListItem(oMate)];
    $.mates_listsection.appendItems(aMateListItem, {
        animated : true
    });
    // add mate to final list indicating first one as having the shout
    var aFirstShoutListItem = [mapMateListItem(oMate, 'first_shout_template')];
    $.first_shout_listsection.appendItems(aFirstShoutListItem, {
        animated : true
    });

    // // clear input fields and return focus to name for next mate
    // $.mates_name_input.value = '';
    // $.mates_poison_input.value = '';
    // $.mates_price_input.value = '';
    // $.mates_name_input.focus();
}

function getAttributedPriceText(price) {
    'use strict';
    var oAttrPrice = Ti.UI.createAttributedString({
        text : '$ ' + String(price),
    });
    oAttrPrice.addAttribute({
        type : Ti.UI.ATTRIBUTE_FONT,
        value : {
            fontSize : 14,
            fontFamily : 'OpenSans-ExtraBold'
        },
        range : [0, 2]
    });
    return oAttrPrice;
}

function checkMatesAddedBeforeLastPage(bIsCheckBeforePageChange) {
    'use strict';
    // if the next page will be the last but we have no mates yet, warn the user
    var iPageToCheck = bIsCheckBeforePageChange ? $.wiz_pages.currentPage + 1 : $.wiz_pages.currentPage;
    if (iPageToCheck === ($.wiz_pages.views.length - 1) && $.mShout.getMates().length === 0) {
        toast.show(L('shout_wiz_you_did_not_add_any_mates'));
        return false;
    } else {
        return true;
    }

}

function wizPrevious(e) {
    'use strict';

    $.wiz_pages.movePrevious();
}

function wizNext(e) {
    'use strict';

    $.wiz_pages.moveNext();
}

function wizDone(e) {
    'use strict';

    if ($.mShout.getMates().length === 0) {
        // check that we have at least one shout set up, else we can't exit the wizard
        if (Alloy.Collections.instance('shouts').length === 0) {
            return toast.show(L('shout_wiz_you_need_at_least_one_shout'));
        } else {
            // otherwise we prompt if the user wants to exit without saving
            dialogs.confirm({
                message : L('shout_wiz_you_did_not_add_any_mates'),
                callback : function() {
                    // exit without saving
                    $.trigger('done');
                    Alloy.Globals.Navigator.pop();
                }
            });
        }
    } else {
        // save model and add to shouts collection
        $.mShout.save();
        Alloy.Collections.instance('shouts').add($.mShout, {
            merge : true
        });
        // raise 'done' event on controller, supplying new shout model to subscribers
        log.trace('raising shout_wiz controller done event...');
        log.trace($.mShout.toJSON());
        $.trigger('done', {
            mShout: $.mShout
        });
        // navigate back
        Alloy.Globals.Navigator.pop();
    }
}

function goAddMate() {
    'use strict';

    _oMateController = Alloy.Globals.Navigator.push('mate', {
        mShout: $.mShout
    });
    // register for 'done' event on controller
    _oMateController.once('done', function(e) {
        _oMateController = null;

        if (e.oMate) {
            addShoutMate(e.oMate);
        }
    });
}

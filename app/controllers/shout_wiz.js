var CONST = require("constants");

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
    "use strict";

    _bCanSkipWelcome = args.bCanSkipWelcome;
    _bNoAnimateInOnOpen = args.bNoAnimateInOnOpen;

    _.defer(function() {
        init();
    });

    $.animateIn = animateIn;

    /**
     * window open/close
     */
    $.window.addEventListener("open", onWindowOpen);
    $.window.addEventListener("close", onWindowClose);

})(arguments[0] || {});

function init() {
    "use strict";

    var logContext = "shout_wiz.js > init()";

    // initialise shout model
    $.mShout.set("type", L("shout_wiz_coffee"));

    Log.trace("raising $.loaded event...", logContext);
    $.trigger("loaded");
}

function onWindowOpen() {
    "use strict";

    var logContext = "shout_wiz.js > onWindowOpen()";

    $.window.removeEventListener("open", onWindowOpen);

    // set android menu callbacks
    if (OS_ANDROID) {
        $.window.activity.onCreateOptionsMenu = function(e) {
            createAndroidMenu(e.menu);
        };
        $.window.activity.onPrepareOptionsMenu = function(e) {
            prepareAndroidMenu(e.menu);
        };
    }
    changeMenu();

    // skip welcome page of wizard if requested
    if (_bCanSkipWelcome) {
        $.wiz_pages.scrollToView(1);
    }
    // animate content from transparent to visible
    if (!_bNoAnimateInOnOpen) {
        animateIn();
    }

    Log.trace("raising $.open event...", logContext);
    $.trigger("open");
}

function onWindowClose() {
    "use strict";

    $.window.removeEventListener("close", onWindowClose);
    // destroy alloy data bindings
    $.destroy();
}

function animateIn() {
    "use strict";

    $.activity_indicator.hide();

    $.wiz_pages.animate(Ti.UI.createAnimation({
        opacity: 1,
        duration: 1000
    }));
}

function createAndroidMenu(menu) {
    "use strict";

    if (OS_ANDROID) {
        var menuItemNext = menu.add({
            itemId: CONST.MENU.SHOUT_WIZ_NEXT,
            title: L("shout_wiz_next"),
            showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS,
        });
        menuItemNext.addEventListener("click", wizNext);

        var menuItemDone = menu.add({
            itemId: CONST.MENU.SHOUT_WIZ_DONE,
            title: L("shout_wiz_done"),
            showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS,
        });
        menuItemDone.addEventListener("click", wizDone);
    }
}

function prepareAndroidMenu(menu) {
    "use strict";

    if (OS_ANDROID) {
        var menuItemNext = menu.findItem(CONST.MENU.SHOUT_WIZ_NEXT);
        var menuItemDone = menu.findItem(CONST.MENU.SHOUT_WIZ_DONE);
        // show/hide menuitems depending on the current wizard page
        if ($.wiz_pages.currentPage === ($.wiz_pages.views.length - 2)) {
            if (menuItemNext) {
                menuItemNext.setVisible(true);
            }
            if (menuItemDone) {
                menuItemDone.setVisible(false);
            }
        } else if ($.wiz_pages.currentPage === ($.wiz_pages.views.length - 1)) {
            // if on the last page, hide add/next and show done
            if (menuItemNext) {
                menuItemNext.setVisible(false);
            }
            if (menuItemDone) {
                menuItemDone.setVisible(true);
            }
        } else {
            // otherwise show only next
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
    "use strict";

    if (OS_ANDROID) {
        // we have to signal android to invalidate the options menu:
        // it will be reconfigured in the onPrepareOptionsMenu handler
        // Ti.Android.currentActivity.invalidateOptionsMenu();
        $.window.activity.invalidateOptionsMenu();
    }
    if (OS_IOS) {
        // in iOS, nav buttons cannot be manipulated, but have to be set fresh each time
        if ($.wiz_pages.currentPage === ($.wiz_pages.views.length - 1)) {
            // if on the last page, provide done button
            var oDoneButton = Ti.UI.createButton({
                title: L("shout_wiz_done"),
            });
            oDoneButton.addEventListener("click", wizDone);
            $.window.rightNavButton = oDoneButton;
        } else {
            // otherwise show only next
            var oNextButton = Ti.UI.createButton({
                title: L("shout_wiz_next"),
            });
            oNextButton.addEventListener("click", wizNext);
            $.window.rightNavButton = oNextButton;
        }
    }
}

function onWizPageChange(e) {
    "use strict";

    changeMenu();
}

function onShoutPlaceChange(e) {
    "use strict";

    $.mShout.set("place", e.value, {
        silent: true
    });
}

function wizPrevious(e) {
    "use strict";

    $.wiz_pages.movePrevious();
}

function wizNext(e) {
    "use strict";

    $.wiz_pages.moveNext();
}

function wizDone(e) {
    "use strict";

    var logContext = "shout_wiz.js > wizDone()";

    // save model and add to shouts collection
    $.mShout.save();
    Alloy.Collections.instance("shouts").add($.mShout, {
        merge: true
    });
    // raise "done" event on controller, supplying new shout model to subscribers
    Log.trace("raising $.done event...", logContext);
    Log.trace($.mShout, logContext);
    $.trigger("done", {
        mShout: $.mShout
    });
    // navigate back
    Alloy.Globals.Navigator.pop();
}

function goChooseShoutType(e){
    "use strict";

    var oShoutWizTypesController = Alloy.Globals.Navigator.push('shout_wiz_types');
    oShoutWizTypesController.once('done', function(e) {
        if (e.sShoutType) {
            $.mShout.set("type", e.sShoutType);
        }
    });
}

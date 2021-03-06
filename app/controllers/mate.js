var CONST = require("constants");

var _oMate;
var _mShout;
var _bIsEditingMate = false;

/**
 * self-executing function to organize otherwise inline constructor code
 * @param  {Object} args arguments passed to the controller
 */
(function(args) {

    // Use strict mode for this function scope. We can't do this for all of the
    // controller because after Alloy has compiled all of this file is wrapped.
    // FIXME: https://jira.appcelerator.org/browse/ALOY-1263
    "use strict";

    _mShout = args.mShout;
    _oMate = args.oMate;

    _.defer(function() {
        init();
    });

    /**
     * window open/close
     */
    $.window.addEventListener("open", onWindowOpen);
    $.window.addEventListener("close", onWindowClose);

})(arguments[0] || {});

function init() {
    "use strict";

    if (_oMate) {
        // we were given an existing mate as input: adjust title and set view model
        _bIsEditingMate = true;
        $.window.setTitle(L("mate_edit_mate"));
        $.mMate.set(_oMate);

        // allow existing mates to be removed
        $.deleteButton.setVisible(true);
    } else {
        // generate a new mate ID
        $.mMate.set("mateId", _mShout.getNextMateId());
    }

    $.trigger("loaded");
}

// function createAndroidMenu(menu) {
//     "use strict";
//
//     if (OS_ANDROID) {
//         // dynamically created android menus need to be created here
//     }
// }
//
// function prepareAndroidMenu(menu) {
//     "use strict";
//
//     if (OS_ANDROID) {
//         // dynamically created android menus need to be manipulated here
//     }
// }
//
// function changeMenu() {
//     "use strict";
//
//     if (OS_ANDROID) {
//         // we have to signal android to invalidate the options menu:
//         // it will be reconfigured in the onPrepareOptionsMenu handler
//         $.window.activity.invalidateOptionsMenu();
//     }
//     if (OS_IOS) {
//
//     }
// }

function onWindowOpen() {
    "use strict";

    var logContext = "mate.js > onWindowOpen()";

    $.window.removeEventListener("open", onWindowOpen);

    // // set android menu callbacks
    // if (OS_ANDROID) {
    //     $.window.activity.onCreateOptionsMenu = function(e) {
    //         createAndroidMenu(e.menu);
    //     };
    //     $.window.activity.onPrepareOptionsMenu = function(e) {
    //         prepareAndroidMenu(e.menu);
    //     };
    // }

    Log.trace("raising $.open event...", logContext);
    $.trigger("open");
}

function onWindowClose() {
    "use strict";

    $.window.removeEventListener("close", onWindowClose);

    // destroy alloy data bindings
    $.destroy();
}

function onDeleteButtonClick(e){
    "use strict";

    // note that it is up to the caller to decide
    // whether to allow or otherwise process the deletion
    $.trigger("delete", {
        oMate: $.mMate.toJSON(),
    });

    Alloy.Globals.Navigator.pop();
}

function onDone(e) {
    "use strict";

    try {
        $.mMate.validate();

        // check that for new mates we don't already have one by that name
        if (!_bIsEditingMate) {
            var oSameName = _.findWhere(_mShout.getMates(), {
                name : $.mMate.get("name")
            });
            if (oSameName) {
                throw new Error(String.format(L("mate_a_mate_named_x_has_already"), $.mMate.get("name")));
            }
        }

        // tell interested parties about our sterling efforts
        $.trigger("done", {
            oMate: $.mMate.toJSON(),
        });

        Alloy.Globals.Navigator.pop();
    } catch (oErr) {
        Toast.show(oErr.message || oErr);
    } finally {

    }
}

function onChangeName(e){
    "use strict";

    $.mMate.set("name", e.value, {
        silent: true
    });
}

function onChangePoison(e){
    "use strict";

    $.mMate.set("poison", e.value, {
        silent: true
    });
}

function onChangePrice(e){
    "use strict";

    $.mMate.set("price", e.value, {
        silent: true
    });
}

function onAutoNextFieldReturn(e){
    "use strict";

    if (!OS_IOS) {
        // iOS doesn't advance the focus to the next input field automatically
        return;
    }

    var sHintText = e.source.getHintText(),
        bIsNextOne = false,
        bIsFinished = false;

    // find currently focused field then declare that the next field is THE ONE
    _.each($.mate_container.getChildren(), function(oView) {
        if (bIsFinished) {
            return;
        }

        if (oView.getHintText && oView.getHintText() === sHintText) {
            bIsNextOne = true;
            return;
        }
        if (bIsNextOne && oView.getApiName() === "Ti.UI.TextField") {
            bIsFinished = true;
            return oView.focus();
        }
    });
}

// DEPENDENCIES
var Permissions = require("permissions");

var _oIntroController;
var _oShoutsController;
var _oShoutWizController;

var _bCanLaunch = true;
var _bDidShoutsOpen = false;
var _bDidIntroEnd = false;

/**
 * self-executing function to organize otherwise inline constructor code
 * @param  {Object} args arguments passed to the controller
 */
(function(args) {

    // Use strict mode for this function scope. We can't do this for all of the
    // controller because after Alloy has compiled all of this file is wrapped.
    // FIXME: https://jira.appcelerator.org/browse/ALOY-1263
    "use strict";

    // if (!ENV_PRODUCTION) {
    // if (Alloy.CFG.run_logic_tests) {
    // //TODO: Convert to promise?
    // _bCanLaunch = false;
    // Ti.App.addEventListener("logic_tests_complete", function logicTestsComplete() {
    // "use strict";
    // Ti.App.removeEventListener("logic_tests_complete", logicTestsComplete);
    // init();
    // });
    // }
    // }

    if (_bCanLaunch) {
        init();
    }

})(arguments[0] || {});

/**
 * Init
 */
function init() {
    "use strict";

    var logContext = "index.js > init()";

    // create main controller with navigation window
    Log.trace("creating shouts controller...", logContext);
    _oShoutsController = Alloy.createController("shouts", {
        bMustDelayInit: true
    });
    _oShoutsController.once("open", function() {
        // _bDidShoutsOpen = true;
        // if (_bDidIntroEnd) {
            Log.trace("animating in shouts controller...", logContext);
            _oShoutsController.animateIn();
        // }
    });
    Log.trace("shouts controller created", logContext);

    Log.trace("initialising navigation...", logContext);
    if (OS_IOS) {
        var navWindow = Ti.UI.iOS.createNavigationWindow({
            window : _oShoutsController.window
        });
        Alloy.Globals.navigationWindow = navWindow;
        Alloy.Globals.initNavigation();
        Alloy.Globals.navigationWindow.open();
    } else {
        Alloy.Globals.initNavigation();
        Alloy.Globals.Navigator.push(_oShoutsController);
    }
    Log.trace("navigation initialised", logContext);

    // open intro controller as "modal" window to provide startup animation while app loads
    // Log.trace("creating modal intro controller...", logContext);
    // _oIntroController = Alloy.Globals.Navigator.openModal("intro");
    // Log.trace("intro controller created", logContext);

    _.defer(function() {
        Log.trace("fetching shouts collection...", logContext);
        var cShouts = Alloy.Collections.instance("shouts");
        cShouts.fetch();
        Log.debug("shouts collection fetched... model count: " + cShouts.length, logContext);
        Log.debug(cShouts.models, logContext);
        Log.trace("calling shouts controller delayedInit()...", logContext);
        _oShoutsController.delayedInit();
        if (cShouts.length === 0) {
            // no shouts yet: load shout wizard controller after ending intro
            // Log.trace("calling intro controller endIntro()...", logContext);
            // _oIntroController.endIntro();
            // _oIntroController.once("ended", function() {
            //     Log.trace("intro controller ended event received", logContext);
            //     _bDidIntroEnd = true;
            //     Log.trace("closing modal intro controller...", logContext);
            //     Alloy.Globals.Navigator.closeModal(_oIntroController);
                Log.trace("creating shout_wiz controller...", logContext);
                _oShoutWizController = Alloy.Globals.Navigator.push("shout_wiz");
                Log.trace("shout_wiz controller created", logContext);

                // subsribe shouts controller to handle wizard done event
                _oShoutWizController.once("done", function(e) {
                    _oShoutsController.onShoutWizDone(e);
                    // _oShoutsController.animateIn();
                });
            // });
        } else {
            // // shouts found: close modal intro controller after ending intro
            // // and animate in shouts controller
            // Log.trace("calling intro controller endIntro()...", logContext);
            // _oIntroController.endIntro();
            // _oIntroController.once("ended", function() {
            //     Log.trace("intro controller ended event received", logContext);
            //     _bDidIntroEnd = true;
            //     Log.trace("closing modal intro controller...", logContext);
            //     Alloy.Globals.Navigator.closeModal(_oIntroController);
            //     Log.trace("modal intro controller closed", logContext);
            //     if (_bDidShoutsOpen) {
            //         _oShoutsController.animateIn();
            //     }
            // });
        }
    });
}

// DEPENDENCIES
var permissions = require('permissions');

var _introController;
var _shoutsController;
var _shoutWizController;

var launch = true;

/**
 * self-executing function to organize otherwise inline constructor code
 * @param  {Object} args arguments passed to the controller
 */
(function(args) {

    // Use strict mode for this function scope. We can't do this for all of the
    // controller because after Alloy has compiled all of this file is wrapped.
    // FIXME: https://jira.appcelerator.org/browse/ALOY-1263
    'use strict';

    // if (!ENV_PRODUCTION) {
    // if (Alloy.CFG.run_logic_tests) {
    // //TODO: Convert to promise?
    // launch = false;
    // Ti.App.addEventListener("logic_tests_complete", function logicTestsComplete() {
    // 'use strict';
    // Ti.App.removeEventListener("logic_tests_complete", logicTestsComplete);
    // init();
    // });
    // }
    // }

    if (launch) {
        init();
    }

})(arguments[0] || {});

/**
 * Init
 */
function init() {
    'use strict';

    // load intro controller first to provide startup animation while app loads
    // but don't open window until nav window has been opened
    log.trace('creating intro controller...');
    _introController = Alloy.createController('intro');
    log.trace('intro controller created');

    // create main controller with navigation window
    log.trace('creating shouts controller...');
    _shoutsController = Alloy.createController('shouts', {
        bMustDelayInit: true
    });
    log.trace('shouts controller created');

    log.trace('initialising navigation...');
    if (OS_IOS) {
        var navWindow = Ti.UI.iOS.createNavigationWindow({
            window : _shoutsController.window
        });
        Alloy.Globals.navigationWindow = navWindow;
        Alloy.Globals.initNavigation();
        Alloy.Globals.navigationWindow.open();
    } else {
        Alloy.Globals.initNavigation();
        Alloy.Globals.Navigator.push(_shoutsController);
    }
    log.trace('navigation initialised');

    _.defer(function() {
        log.trace('fetching shouts collection...');
        var cShouts = Alloy.Collections.instance('shouts');
        cShouts.fetch();
        log.trace('shouts collection fetched... model count: ' + cShouts.length);
        if (cShouts.length === 0) {
            // no shouts yet: load shout wizard controller
            log.trace('creating shout_wiz controller...');
            _shoutWizController = Alloy.Globals.Navigator.push('shout_wiz', {
                bNoAnimateInOnOpen: true
            });
            log.trace('shout_wiz controller created');
            // open the intro animation window
            log.trace('opening intro controller window...');
            _introController.window.open();
            // once wizard loaded end intro and display wizard
            _shoutWizController.once('loaded', function(e) {
                log.trace('shout_wiz controller loaded event received');
                log.trace('calling intro controller endIntro()...');
                _introController.endIntro();
                _introController.once('ended', function() {
                    log.trace('intro controller ended event received');
                    displayShoutWiz();
                });
            });
            // once wizard done display shouts
            _shoutWizController.once('done', function(e) {
                _shoutsController.delayedInit();
                _shoutsController.once('loaded', function() {
                    displayShouts();
                });
            });
        } else {
            // FIXME: figure out why sometimes the app closes its last window during startup
            // now open the intro animation window
            _introController.window.open();
            // shouts exist: end intro and animate in shouts controller
            _shoutsController.delayedInit();
            _shoutsController.once('loaded', function(e) {
                log.trace('shouts controller loaded event received');
                log.trace('calling intro controller endIntro()...');
                _introController.endIntro();
                _introController.once('ended', function() {
                    log.trace('intro controller ended event received');
                    displayShouts();
                });
            });
        }
    });
}

/**
 * Display shout wizard screen
 */
function displayShoutWiz() {
    'use strict';

    if (_introController) {
        log.trace('closing intro controller window...');
        _introController.window.close();
        _introController = null;
    }

    log.trace('animating in shout_wiz controller...');
    _shoutWizController.animateIn();
}

/**
 * Display shouts screen
 */
function displayShouts() {
    'use strict';

    if (_introController) {
        log.trace('closing intro controller window...');
        _introController.window.close();
        _introController = null;
    }

    log.trace('animating in shouts controller...');
    _shoutsController.animateIn();
}

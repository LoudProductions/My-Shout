// DEPENDENCIES
var permissions = require('permissions');

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
    'use strict';

    // if (!ENV_PRODUCTION) {
    // if (Alloy.CFG.run_logic_tests) {
    // //TODO: Convert to promise?
    // _bCanLaunch = false;
    // Ti.App.addEventListener("logic_tests_complete", function logicTestsComplete() {
    // 'use strict';
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
    'use strict';

    // create main controller with navigation window
    log.trace('creating shouts controller...');
    _oShoutsController = Alloy.createController('shouts', {
        bMustDelayInit: true
    });
    _oShoutsController.once('open', function() {
        _bDidShoutsOpen = true;
        if (_bDidIntroEnd) {
            log.trace('animating in shouts controller...');
            _oShoutsController.animateIn();
        }
    });
    log.trace('shouts controller created');

    log.trace('initialising navigation...');
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
    log.trace('navigation initialised');

    // open intro controller as "modal" window to provide startup animation while app loads
    log.trace('creating modal intro controller...');
    _oIntroController = Alloy.Globals.Navigator.openModal('intro');
    log.trace('intro controller created');

    _.defer(function() {
        log.trace('fetching shouts collection...');
        var cShouts = Alloy.Collections.instance('shouts');
        cShouts.fetch();
        log.trace('shouts collection fetched... model count: ' + cShouts.length);
        log.trace('calling shouts controller delayedInit()...');
        _oShoutsController.delayedInit();
        if (cShouts.length === 0) {
            // no shouts yet: load shout wizard controller after ending intro
            log.trace('calling intro controller endIntro()...');
            _oIntroController.endIntro();
            _oIntroController.once('ended', function() {
                log.trace('intro controller ended event received');
                _bDidIntroEnd = true;
                log.trace('closing modal intro controller...');
                Alloy.Globals.Navigator.closeModal(_oIntroController);
                log.trace('creating shout_wiz controller...');
                _oShoutWizController = Alloy.Globals.Navigator.push('shout_wiz');
                log.trace('shout_wiz controller created');

                // subsribe shouts controller to handle wizard done event
                _oShoutWizController.once('done', function(e) {
                    _oShoutsController.onShoutWizDone(e);
                    _oShoutsController.animateIn();
                });
            });
        } else {
            // shouts found: close modal intro controller after ending intro
            // and animate in shouts controller
            log.trace('calling intro controller endIntro()...');
            _oIntroController.endIntro();
            _oIntroController.once('ended', function() {
                log.trace('intro controller ended event received');
                _bDidIntroEnd = true;
                log.trace('closing modal intro controller...');
                Alloy.Globals.Navigator.closeModal(_oIntroController);
                log.trace('modal intro controller closed');
                if (_bDidShoutsOpen) {
                    _oShoutsController.animateIn();
                }
            });
        }
    });
}

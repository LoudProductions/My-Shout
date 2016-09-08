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

    _introController = Alloy.createController('intro');
    _introController.window.open();

    _.defer(function() {
        var cShouts = Alloy.Collections.instance('shouts');
        cShouts.fetch();
        if (cShouts.length === 0) {
            // no shouts yet: open shout wizard controller
            _shoutWizController = Alloy.createController('shout_wiz', {
                fnLoadedCallback : function() {
                    'use strict';
                    _introController.endIntro(displayShoutWiz);
                },
                fnDoneCallback : function() {
                    'use strict';
                    _shoutsController = Alloy.createController('shouts');            
                    displayShouts();
                }
            });
        } else {
            // shouts exist: open shouts controller
            _shoutsController = Alloy.createController('shouts', {
                fnLoadedCallback : function() {
                    'use strict';
                    _introController.endIntro(displayShouts);
                }
            });            
        }
        
    });

}

/**
 * Display shout wizard screen
 */
function displayShoutWiz() {
    'use strict';
    
    _shoutWizController.window.open();
    // _shoutWizController.animateIn();

    _introController.window.close();
    _introController = null;

}

/**
 * Display shouts screen
 */
function displayShouts() {
    'use strict';

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

    _shoutsController.animateIn();

    if (_introController) {
        _introController.window.close();
        _introController = null;
    }
    
    if (_shoutWizController) {
        _shoutWizController.window.close();
        _shoutWizController = null;        
    }
}


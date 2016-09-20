// The contents of this file will be executed before any of
// your view controllers are ever executed, including the index.
// You have access to all functionality on the `Alloy` namespace.
//
// This is a great place to do any initialization for your app
// or create any global variables/functions that you'd like to
// make available throughout your app. You can easily make things
// accessible globally by attaching them to the `Alloy.Globals`
// object. For example:
//
// Alloy.Globals.someGlobalFunction = function(){};

// Since this file will be compiled to Titanium's bootstrap in Resources/app.js
// any variables will polute the global scope. Therefor, it's best practice to
// wrap your code in a self-executing function.
(function (global) {
	// We pass `this` so you could use `global.foo` to force a global variable.

    global.Toast = require("toast");
    global.Log = require("logger");
    Log.info("Loading Alloy globals...", "alloy.js");

    Alloy.Globals.Animation = require("alloy/animation");
    Alloy.Globals.Dialogs = require("alloy/dialogs");
    Alloy.Globals.FAIcons = require("fa_icons");

    ///////////////////////////////////////////////////////////////////////////////
    //
    // Navigation singleton
    //
    ///////////////////////////////////////////////////////////////////////////////

    /**
     * The navigator object which handles all navigation
     * @type {Object}
     */
    Alloy.Globals.Navigator = {};

    /**
     * Init navigation
     * Called from index controller once intro animation is complete
     */
    Alloy.Globals.initNavigation = function() {
        "use strict";
        // Require in the navigation module
        Alloy.Globals.Navigator = require("navigation")({
            parent : Alloy.Globals.navigationWindow || null
        });
    };

})(this);

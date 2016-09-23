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
    "use strict";

    global.Toast = require("toast");
    global.Log = require("logger");
    Log.info("Loading Alloy globals...", "alloy.js");

    Alloy.Globals.Animation = require("alloy/animation");
    Alloy.Globals.Dialogs = require("alloy/dialogs");
    Alloy.Globals.FAIcons = require("fa_icons");
    Alloy.Globals.Moment = require("moment-with-locales");
    Alloy.Globals.Moment.locale(Ti.Locale.currentLocale);
    Log.info("Initialised moment.js with current locale: " + Ti.Locale.currentLocale);

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
        // Require in the navigation module
        Alloy.Globals.Navigator = require("navigation")({
            parent : Alloy.Globals.navigationWindow || null
        });
    };

    ///////////////////////////////////////////////////////////////////////////////
    //
    // Device singleton
    //
    ///////////////////////////////////////////////////////////////////////////////

    /**
     * Device information, some come from the Ti API calls and can be referenced
     * from here so multiple bridge calls aren't necessary, others generated here
     * for ease of calculations and such.
     *
     * @type {Object}
     * @param {String} version The version of the OS
     * @param {Number} versionMajor The major version of the OS
     * @param {Number} versionMinor The minor version of the OS
     * @param {Number} width The width of the device screen
     * @param {Number} height The height of the device screen
     * @param {Number} dpi The DPI of the device screen
     * @param {String} orientation The device orientation, either "landscape" or "portrait"
     * @param {String} statusBarOrientation A Ti.UI orientation value
     */
    Alloy.Globals.Device = {
        version : Ti.Platform.version,
        versionMajor : parseInt(Ti.Platform.version.split(".")[0], 10),
        versionMinor : parseInt(Ti.Platform.version.split(".")[1], 10),
        width : (Ti.Platform.displayCaps.platformWidth > Ti.Platform.displayCaps.platformHeight) ? Ti.Platform.displayCaps.platformHeight : Ti.Platform.displayCaps.platformWidth,
        height : (Ti.Platform.displayCaps.platformWidth > Ti.Platform.displayCaps.platformHeight) ? Ti.Platform.displayCaps.platformWidth : Ti.Platform.displayCaps.platformHeight,
        dpi : Ti.Platform.displayCaps.dpi,
        orientation : ((Ti.Gesture.orientation == Ti.UI.LANDSCAPE_LEFT || Ti.Gesture.orientation == Ti.UI.LANDSCAPE_RIGHT) ? "landscape" : "portrait")
    };

    if (OS_IOS) {
        Alloy.Globals.Device.heightExcludingNav = Alloy.Globals.Device.height - 70;
    }
    if (OS_ANDROID) {
        Alloy.Globals.Device.heightExcludingNav = Alloy.Globals.Device.height - 80;
        Alloy.Globals.Device.width = (Alloy.Globals.Device.width / (Alloy.Globals.Device.dpi / 160));
        Alloy.Globals.Device.height = (Alloy.Globals.Device.height / (Alloy.Globals.Device.dpi / 160));
    }

    Alloy.Globals.dpToPx = function(dp) {
        return dp * (Ti.Platform.displayCaps.platformHeight / Alloy.Globals.Device.height);
    };

    Alloy.Globals.pxToDp = function(px) {
        return px * (Alloy.Globals.Device.height / Ti.Platform.displayCaps.platformHeight);
    };

})(this);

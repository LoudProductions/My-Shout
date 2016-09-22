var _sShoutType = "";

/**
 * self-executing function to organize otherwise inline constructor code
 * @param  {Object} args arguments passed to the controller
 */
(function(args) {

    // Use strict mode for this function scope. We can't do this for all of the
    // controller because after Alloy has compiled all of this file is wrapped.
    // FIXME: https://jira.appcelerator.org/browse/ALOY-1263
    "use strict";

    _sShoutType = args.sShoutType || L("shout_wiz_coffee");

    _.defer(function() {
        init();
    });

})(arguments[0] || {});

function init() {
    "use strict";

    var logContext = "shout_wiz_types.js > init()";

    Log.trace("raising $.loaded event...", logContext);
    $.trigger("loaded");
}

function onDone(e){
  "use strict";

  var logContext = "shout_wiz_types.js > onDone()";

  Log.trace("raising $.done event...", logContext);
  $.trigger("done", {
    sShoutType : _sShoutType
  });

  Alloy.Globals.Navigator.pop();
}

function onChangeShoutType(e){
  "use strict";

  var logContext = "shout_wiz_types.js > onChangeType()";
  Log.debug('entered custom shout type: ' + e.source.value);

  _sShoutType = e.source.value;
}

function onShoutTypeButtonClick(e){
  "use strict";

  var logContext = "shout_wiz_types.js > onShoutTypeButtonClick()";
  Log.debug('selected shout type: ' + e.source.title);

  _sShoutType = e.source.title;
  onDone(e);
}

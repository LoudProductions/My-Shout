var _mShout;
var _aSortedShoutHistory = [];

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

    init();

    /**
     * window open/close
     */
    $.window.addEventListener("open", onWindowOpen);
    $.window.addEventListener("close", onWindowClose);

})(arguments[0] || {});

function init() {
    "use strict";

    var logContext = "history.js > init()";
    Log.trace("initialising...", logContext);

    // fetch history collection if not done yet
    var cHistory = Alloy.Collections.instance("history");
    if (cHistory.length === 0) {
        cHistory.fetch();
    }
    Log.debug("history collection fetched... model count: " + cHistory.length, logContext);

    // read history for shout
    var aShoutHistory = cHistory.getShoutHistory(_mShout.id);
    Log.debug("history for shout:", logContext);
    Log.debug(aShoutHistory, logContext);

    if (aShoutHistory.length > 0) {
        $.no_history_view.setVisible(false);
        $.history_listview.setVisible(true);

        _aSortedShoutHistory = _.sortBy(aShoutHistory, function(mHistory) {
            return mHistory.get("shoutAt");
        }).reverse();
        buildHistoryList(_aSortedShoutHistory);
    }

    Log.trace("raising $.loaded event...", logContext);
    $.trigger("loaded");
}

function buildHistoryList(aShoutHistory) {
    "use strict";

    // create a section for each shout
    var i = 0;
    _.each(aShoutHistory, function(mHistory) {
        var oHistory = mHistory.transform();
        // var oShoutSection = Ti.UI.createListSection({
        //     headerTitle: oHistory.uiWho + ", " + Alloy.Globals.Moment(oHistory.shoutAt).fromNow()
        // });
        var oShoutSection = Ti.UI.createListSection({
            headerView: buildHistorySectionHeader(oHistory, i)
        });
        var aMatesListItems = _.map(oHistory.mates, function(oMate) {
            return mapMateListItem(oMate, i);
        });
        oShoutSection.setItems(aMatesListItems);
        $.history_listview.appendSection(oShoutSection);

        i++;
    });
}

function buildHistorySectionHeader(oHistory, iSectionIndex) {
    "use strict";

    // create section header view
    var oHeaderView = Ti.UI.createView();
    $.addClass(oHeaderView, "listHeader");

    // add label with section title
    var oHeaderTitle = Ti.UI.createLabel({
        text : oHistory.uiWho + ", " + Alloy.Globals.Moment(oHistory.shoutAt).fromNow(),
    });
    $.addClass(oHeaderTitle, "listHeaderTitle appTextStyleBody");
    oHeaderView.add(oHeaderTitle);

    // add view and label for undo icon (to first shout only)
    if (iSectionIndex === 0) {
        var oUndoIconView = Ti.UI.createView();
        $.addClass(oUndoIconView, "appCompositeView");
        var oUndoIconLabel = Ti.UI.createLabel();
        $.addClass(oUndoIconLabel, "listHeaderUndoIcon appListItemRightIcon1");
        oUndoIconLabel._app_iSectionIndex = iSectionIndex;
        oUndoIconLabel.addEventListener("click", onUndoShout);
        oUndoIconView.add(oUndoIconLabel);
        oHeaderView.add(oUndoIconView);
    }

    return oHeaderView;
}

function mapMateListItem(oMate, iSectionIndex, template) {
    "use strict";

    // set mate's background color
    var mateColor = Alloy.CFG.colors.textColor;
    var mateBackgroundColor = Alloy.CFG.colors.backgroundColor;
    if (oMate.isInactive) {
        mateColor = Alloy.CFG.colors.inactiveColor;
        // mateBackgroundColor = Alloy.CFG.colors.inactiveBackgroundColor;
    // } else if (oMate.hasShout) {
    //     mateColor = Alloy.CFG.colors.tintColor;
    }

    return {
        template: template || "shout_mates_template",
        properties: {
            accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE,
            searchableText: oMate.name + oMate.poison + oMate.price,
            itemId: oMate.mateId
                // if using built-in item templates for iOS, uncomment these
                // title : oMate.name
                // subtitle : oMate.poison
                // image : ...
        },
        mate_name: {
            text: oMate.name,
            color: mateColor,
        },
        mate_name_edit: {
            value: oMate.name,
            color: mateColor,
        },
        mate_poison: {
            text: oMate.poison,
            color: mateColor,
        },
        mate_poison_edit: {
            value: oMate.poison,
            color: mateColor,
        },
        mate_price: {
            // text: oMate.price,
            attributedString: getAttributedPriceText(oMate.price, oMate.hasShout),
            color: mateColor,
        },
        mate_price_edit: {
            value: oMate.price,
        },
        mate_balance: {
            // text : oMate.balance,
            attributedString: getAttributedBalanceText(oMate.balance, oMate.hasShout),
            color: mateColor,
        },
        mate_has_shout: {
            color: mateColor,
            text: (oMate.hasShout ? Alloy.Globals.FAIcons.bullhorn : null),
        },
        mate_is_inactive: {
            value: (oMate.isInactive ? false : true),
        },
        mate_undo_icon: {
            // TODO: enable undo for individual shouters? probably just as easy to undo the shout
            // and deactivate a participant before shouting again...
            // visible: (oMate.isInactive || iSectionIndex !== 0 ? false : true),
            visible: false,
            color: mateColor,
            backgroundColor: mateBackgroundColor
        },
        mate_edit_icon: {
            color: mateColor,
            backgroundColor: mateBackgroundColor
        },
        mate_your_shout_icon: {
            visible: (oMate.hasShout ? false : true),
            color: mateColor,
            backgroundColor: mateBackgroundColor
        },
        // if binding to a view then the associated class is overridden
        // and all styling properties must be supplied here
        mate_bg_view: {
        	width: "100%",
        	layout: "horizontal",
        	horizontalWrap: false,
            color: mateColor,
            backgroundColor: mateBackgroundColor
        },
    };
}

function getAttributedPriceText(price, hasShout) {
    "use strict";

    price = isNaN(price) ? 0 : price;
    var oAttributedString = Ti.UI.createAttributedString({
        text: "$" + Number(price).toFixed(2),
    });
    oAttributedString.addAttribute({
        type: Ti.UI.ATTRIBUTE_FONT,
        value: Alloy.CFG.fonts.footnote,
        range: [0, 1]
    });
    return oAttributedString;
}

function getAttributedBalanceText(balance, hasShout) {
    "use strict";

    balance = isNaN(balance) ? 0 : balance;
    var sign = (balance < 0 ? "-" : "");
    var oAttributedString = Ti.UI.createAttributedString({
        text: sign + "$" + Number(Math.abs(balance)).toFixed(2),
    });
    oAttributedString.addAttribute({
        type: Ti.UI.ATTRIBUTE_FONT,
        value: Alloy.CFG.fonts.footnote,
        range: [0, 1]
    });
    if (balance < 0) {
        // change color if balance is negative
        oAttributedString.addAttribute({
            type: Ti.UI.ATTRIBUTE_FOREGROUND_COLOR,
            value: Alloy.CFG.colors.negativeColor,
            range: [0, oAttributedString.text.length]
        });
    }
    return oAttributedString;
}

function createAndroidMenu(menu) {
    "use strict";

    if (OS_ANDROID) {
    }
}

function prepareAndroidMenu(menu) {
    "use strict";

    if (OS_ANDROID) {
    }
}

function changeMenu() {
    "use strict";

    if (OS_ANDROID) {
        // // we have to signal android to invalidate the options menu:
        // // it will be reconfigured in the onPrepareOptionsMenu handler
        // $.window.activity.invalidateOptionsMenu();
    }
    if (OS_IOS) {

    }
}

function onWindowOpen() {
    "use strict";

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

    // reconfigure menus
    changeMenu();
}

function onWindowClose() {
    "use strict";

    $.window.removeEventListener("close", onWindowClose);

    // destroy alloy data bindings
    $.destroy();
}

function onUndoShout(e){
    "use strict";

    var logContext = "history.js > onUndoShout()";

    var iSectionIndex = (e && e.source && _.has(e.source, "_app_iSectionIndex") ? e.source._app_iSectionIndex : -1);
    if (iSectionIndex === -1) {
        Log.error("unable to determine sectionIndex for shout!", logContext);
        Log.debug(e, logContext);
        Toast.show(L("history_could_not_find_shout"));
    }

    var mHistory = _aSortedShoutHistory[iSectionIndex];
    if (mHistory) {
        // undo the shout and destroy history model
        mHistory.undoShout();
        mHistory.destroy();

        Log.trace("raising $.undo event...", logContext);
        $.trigger("undo");

        // let the user know and navigate back
        Toast.show(L("history_shout_has_been_reversed"));
        Alloy.Globals.Navigator.pop();
    }
}

function onMateClick(e){
    "use strict";

}

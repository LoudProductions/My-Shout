var dialogs = require('alloy/dialogs');
var moment = require('alloy/moment');

var _mShout;

/**
 * self-executing function to organize otherwise inline constructor code
 * @param  {Object} args arguments passed to the controller
 */
(function(args) {

    // Use strict mode for this function scope. We can't do this for all of the
    // controller because after Alloy has compiled all of this file is wrapped.
    // FIXME: https://jira.appcelerator.org/browse/ALOY-1263
    'use strict';

    _mShout = args.mShout;

    init();

    /**
     * window open/close
     */
    $.window.addEventListener('open', onWindowOpen);
    $.window.addEventListener('close', onWindowClose);

})(arguments[0] || {});

function init() {
    'use strict';

    var logContext = 'history.js > init()';
    log.trace('initialising...', logContext);

    // fetch history collection if not done yet
    var cHistory = Alloy.Collections.instance('history');
    if (cHistory.length === 0) {
        cHistory.fetch();
    }
    log.debug('history collection fetched... model count: ' + cHistory.length, logContext);

    // read history for shout
    var aShoutHistory = cHistory.getShoutHistory(_mShout.id);
    log.debug('history for shout:', logContext);
    log.debug(aShoutHistory, logContext);

    if (aShoutHistory.length > 0) {
        $.no_history_view.setVisible(false);
        $.history_listview.setVisible(true);

        var aSortedShoutHistory = _.sortBy(aShoutHistory, function(mHistory) {
            return mHistory.get('shoutAt');
        }).reverse();
        buildHistoryList(aSortedShoutHistory);
    }

    log.trace('raising $.loaded event...', logContext);
    $.trigger('loaded');
}

function buildHistoryList(aShoutHistory) {
    'use strict';

    // create a section for each shout
    _.each(aShoutHistory, function(mHistory) {
        var oHistory = mHistory.transform();
        // var oShoutSection = Ti.UI.createListSection({
        //     headerTitle: oHistory.uiWho + ', ' + moment(oHistory.shoutAt).fromNow()
        // });
        var oShoutSection = Ti.UI.createListSection({
            headerView: buildHistorySectionHeader(oHistory)
        });
        var aMatesListItems = _.map(oHistory.mates, function(oMate) {
            return mapMateListItem(oMate);
        });
        oShoutSection.setItems(aMatesListItems);
        $.history_listview.appendSection(oShoutSection);
    });
}

function buildHistorySectionHeader(oHistory) {
    'use strict';

    // create section header view
    var oHeaderView = Ti.UI.createView();
    $.addClass(oHeaderView, 'listHeader');

    // add label with section title
    var oHeaderTitle = Ti.UI.createLabel({
        text : oHistory.uiWho + ', ' + moment(oHistory.shoutAt).fromNow(),
    });
    $.addClass(oHeaderTitle, 'listHeaderTitle');
    oHeaderView.add(oHeaderTitle);

    // add view and label for undo icon
    var oUndoIconView = Ti.UI.createView();
    $.addClass(oUndoIconView, 'appCompositeView');
    var oUndoIconLabel = Ti.UI.createLabel();
    $.addClass(oUndoIconLabel, 'listHeaderUndoIcon appListItemRightIcon1');
    oUndoIconLabel.addEventListener('click', onUndoShout);
    oUndoIconView.add(oUndoIconLabel);
    oHeaderView.add(oUndoIconView);

    return oHeaderView;
}

function mapMateListItem(oMate, template) {
    'use strict';

    // set mate's background color
    var mateColor = Alloy.CFG.colors.textColor;
    var mateBackgroundColor = Alloy.CFG.colors.backgroundColor;
    if (oMate.isInactive) {
        mateColor = Alloy.CFG.colors.inactiveColor;
        // mateBackgroundColor = Alloy.CFG.colors.inactiveBackgroundColor;
    } else if (oMate.hasShout) {
        mateColor = Alloy.CFG.colors.backgroundColor;
        mateBackgroundColor = Alloy.CFG.colors.tintColor;
    }

    return {
        template: template || 'shout_mates_template',
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
        },
        mate_price_edit: {
            value: oMate.price,
        },
        mate_balance: {
            // text : oMate.balance,
            attributedString: getAttributedBalanceText(oMate.balance, oMate.hasShout),
        },
        mate_has_shout: {
            color: mateColor,
            text: (oMate.hasShout ? Alloy.Globals.fa_icons.bullhorn : null),
        },
        mate_is_inactive: {
            value: (oMate.isInactive ? false : true),
        },
        mate_undo_icon: {
            visible: (oMate.isInactive ? false : true),
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
        	width: '100%',
        	layout: 'horizontal',
        	horizontalWrap: false,
            color: mateColor,
            backgroundColor: mateBackgroundColor
        },
    };
}

function getAttributedPriceText(price, hasShout) {
    'use strict';

    price = isNaN(price) ? 0 : price;
    var oAttributedString = Ti.UI.createAttributedString({
        text: '$' + Number(price).toFixed(2),
    });
    oAttributedString.addAttribute({
        type: Ti.UI.ATTRIBUTE_FONT,
        value: {
            fontSize: 12,
            fontFamily: 'OpenSans-Bold'
        },
        range: [0, 1]
    });
    if (hasShout) {
        // change color if mate has the shout
        oAttributedString.addAttribute({
            type: Ti.UI.ATTRIBUTE_FOREGROUND_COLOR,
            value: Alloy.CFG.colors.backgroundColor,
            range: [0, oAttributedString.text.length]
        });

    }
    return oAttributedString;
}

function getAttributedBalanceText(balance, hasShout) {
    'use strict';

    balance = isNaN(balance) ? 0 : balance;
    var sign = (balance < 0 ? '-' : '');
    var oAttributedString = Ti.UI.createAttributedString({
        text: sign + '$' + Number(Math.abs(balance)).toFixed(2),
    });
    oAttributedString.addAttribute({
        type: Ti.UI.ATTRIBUTE_FONT,
        value: {
            fontSize: 8,
            fontFamily: 'OpenSans-Light'
        },
        range: [0, 1]
    });
    if (hasShout || balance < 0) {
        // change color if balance is negative or mate has the shout
        oAttributedString.addAttribute({
            type: Ti.UI.ATTRIBUTE_FOREGROUND_COLOR,
            value: (hasShout ? Alloy.CFG.colors.backgroundColor : Alloy.CFG.colors.negativeColor),
            range: [0, oAttributedString.text.length]
        });

    }
    return oAttributedString;
}

function createAndroidMenu(menu) {
    'use strict';

    if (OS_ANDROID) {
    }
}

function prepareAndroidMenu(menu) {
    'use strict';

    if (OS_ANDROID) {
    }
}

function changeMenu() {
    'use strict';

    if (OS_ANDROID) {
        // // we have to signal android to invalidate the options menu:
        // // it will be reconfigured in the onPrepareOptionsMenu handler
        // $.window.activity.invalidateOptionsMenu();
    }
    if (OS_IOS) {

    }
}

function onWindowOpen() {
    'use strict';

    $.window.removeEventListener('open', onWindowOpen);

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
    'use strict';

    $.window.removeEventListener('close', onWindowClose);

    // destroy alloy data bindings
    $.destroy();
}

function onUndoShout(e){
    'use strict';

    // TODO: get current shout model and credit all mates' balances
    alert('undo of whole shout coming soon...');
}

function onMateClick(e){
    'use strict';

    // TODO: get current shout model and credit mate's balance
    alert('undo of mate participation in shout coming soon...');
}

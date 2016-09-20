var CONST = require('constants');
var animation = require('alloy/animation');
var dialogs = require('alloy/dialogs');

var _mShout;
var _bIsEditingMate = false;
var _iIsEditingIndex = 0;
var _oIsEditingMate;
var _oMateController;
var _oShoutWizController;
var _bDidAnimateIn = false;

if (OS_IOS) {
    var _oEditActions = {
        oYourShout : {
            identifier : CONST.ACTIONS.YOUR_SHOUT,
            title : L('shouts_your_shout'),
            style : Ti.UI.iOS.ROW_ACTION_STYLE_NORMAL,
        },
        oActivate : {
            identifier : CONST.ACTIONS.ACTIVATE,
            title : L('shouts_activate'),
            style : Ti.UI.iOS.ROW_ACTION_STYLE_DEFAULT,
        },
        oDeactivate : {
            identifier : CONST.ACTIONS.DEACTIVATE,
            title : L('shouts_deactivate'),
            style : Ti.UI.iOS.ROW_ACTION_STYLE_DESTRUCTIVE,
        },
        oEdit : {
            identifier : CONST.ACTIONS.EDIT,
            title : L('app_edit'),
            style : Ti.UI.iOS.ROW_ACTION_STYLE_NORMAL,
        },
    };
}
/**
 * self-executing function to organize otherwise inline constructor code
 * @param  {Object} args arguments passed to the controller
 */
(function(args) {

    // Use strict mode for this function scope. We can't do this for all of the
    // controller because after Alloy has compiled all of this file is wrapped.
    // FIXME: https://jira.appcelerator.org/browse/ALOY-1263
    'use strict';

    if (!args.bMustDelayInit) {
        // even if we're not asked to delay init, we throw it onto the stack
        // so intro animations etc. have a chance to get started
        _.defer(function() {
            init();
        });
    }

    $.delayedInit = function() {
        _.defer(function() {
            init();
        });
    };

    $.animateIn = function() {
        var logContext = 'shouts.js > $.animateIn()';
        log.trace('running animateIn...', logContext);

        $.activity_indicator.hide();

        $.shouts_container.animate(Ti.UI.createAnimation({
            opacity: 1,
            duration: 1000
        }));
        _bDidAnimateIn = true;
    };

    $.onShoutWizDone = onShoutWizDone;

    /**
     * window open/close
     */
    $.window.addEventListener('open', onWindowOpen);
    $.window.addEventListener('close', onWindowClose);

})(arguments[0] || {});

function init() {
    'use strict';
    var logContext = 'shouts.js > init()';
    log.trace('running init...', logContext);

    fetchFavShout();
    fillPageIndicatorIcons();
    fillFavShoutSection();
    fillShoutMatesSection();

    log.trace('raising $.loaded event...', logContext);
    $.trigger('loaded');
}

function fetchFavShout() {
    'use strict';

    var logContext = 'shouts.js > fetchFavShout()';

    // find the first shout model marked as favourite
    var cShouts = Alloy.Collections.instance('shouts');
    _mShout = cShouts.findWhere({
        isFav: true
    });

    if (!_mShout) {
        _mShout = cShouts.first();
        log.debug('fav shout not found; selecting first model:', logContext);
    }

    if (_mShout) {
        log.debug('fav shout:', logContext);
        log.debug(_mShout, logContext);
    } else {
        log.debug('fav shout not found!', logContext);
    }
}

function fillPageIndicatorIcons() {
    'use strict';

    $.page_indicator_icons_view.removeAllChildren();
    Alloy.Collections.instance('shouts').each(function(mShout) {
        var oPageIndicatorIcon = Ti.UI.createLabel();
        if (_mShout && _mShout.id === mShout.id) {
            $.addClass(oPageIndicatorIcon, 'currentPageIndicatorIcon');
        } else {
            $.addClass(oPageIndicatorIcon, 'otherPageIndicatorIcon');
        }
        $.page_indicator_icons_view.add(oPageIndicatorIcon);
    });
}

function updatePageIndicatorIcons() {
    'use strict';

    var iCurrentPageIndex = Alloy.Collections.instance('shouts').indexOf(_mShout);
    for (var i = 0; i < $.page_indicator_icons_view.children.length; i++) {
        if (i === iCurrentPageIndex) {
            $.resetClass($.page_indicator_icons_view.children[i], 'currentPageIndicatorIcon');
        } else {
            $.resetClass($.page_indicator_icons_view.children[i], 'otherPageIndicatorIcon');
        }
    }
}

function fetchShoutIndex(iOffset) {
    'use strict';

    iOffset = iOffset || 1;

    // find the index of the current model
    var cShouts = Alloy.Collections.instance('shouts');
    var iCurrent = -1;
    for (var i = 0; i < cShouts.models.length; i++) {
        if (cShouts.models[i].id === _mShout.id) {
            iCurrent = i;
            break;
        }
    }

    // find the next model by index, or if none, the first/last one
    var mNextShout = cShouts.at(iCurrent + iOffset);
    if (!mNextShout) {
        if (iOffset > 0) {
            mNextShout = cShouts.first();
        } else {
            mNextShout = cShouts.last();
        }
    }
    _mShout = mNextShout;

    // reconfigure menus
    changeMenu();
}

function onFavShoutSwipe(e) {
    'use strict';

    if (e.direction === 'up' || e.direction === 'down') {
        if (e.bubbles) {
            e.cancelBubble = true;
        }
        return false;
    }

    switch (e.direction) {
        // case 'up':
        case 'left':
            fetchShoutIndex(1);
            break;

            // case 'down':
        case 'right':
            fetchShoutIndex(-1);
            break;

        default:
            break;
    }

    var onAnimationComplete = function() {
        // update list
        updatePageIndicatorIcons();
        updateFavShoutSection();
        fillShoutMatesSection();
    };

    // repeat a series of 'scale horizontally to zero and back' animations,
    // to create the impression of a spinning coin (slowing down to the end)
    var oView = e.source;
    var aAnimations = [];
    aAnimations.push(Ti.UI.createAnimation({
        transform: Ti.UI.create2DMatrix().scale(0.1,1),
        duration : 10,
        curve : Ti.UI.ANIMATION_CURVE_LINEAR,
    }));
    aAnimations.push(Ti.UI.createAnimation({
        transform: Ti.UI.create2DMatrix().scale(1,1),
        duration : 20,
        curve : Ti.UI.ANIMATION_CURVE_LINEAR,
    }));
    aAnimations.push(Ti.UI.createAnimation({
        transform: Ti.UI.create2DMatrix().scale(0.1,1),
        duration : 40,
        curve : Ti.UI.ANIMATION_CURVE_LINEAR,
    }));
    aAnimations.push(Ti.UI.createAnimation({
        transform: Ti.UI.create2DMatrix().scale(1,1),
        duration : 70,
        curve : Ti.UI.ANIMATION_CURVE_LINEAR,
    }));
    aAnimations.push(Ti.UI.createAnimation({
        transform: Ti.UI.create2DMatrix().scale(0.1,1),
        duration : 110,
        curve : Ti.UI.ANIMATION_CURVE_LINEAR,
    }));
    aAnimations.push(Ti.UI.createAnimation({
        transform: Ti.UI.create2DMatrix().scale(1,1),
        duration : 160,
        curve : Ti.UI.ANIMATION_CURVE_LINEAR,
    }));
    aAnimations.push(Ti.UI.createAnimation({
        transform: Ti.UI.create2DMatrix().scale(0.1,1),
        duration : 220,
        curve : Ti.UI.ANIMATION_CURVE_LINEAR,
    }));
    aAnimations.push(Ti.UI.createAnimation({
        transform: Ti.UI.create2DMatrix().scale(1,1),
        duration : 300,
        curve : Ti.UI.ANIMATION_CURVE_LINEAR,
    }));
    animation.chainAnimate(oView, aAnimations, onAnimationComplete);
}

function resetShoutList() {
    if ($.fav_shout_listsection.items.length) {
        $.fav_shout_listsection.deleteItemsAt(0, $.fav_shout_listsection.items.length, {
            animated: true
        });
    }
    if ($.shout_mates_listsection.items.length) {
        $.shout_mates_listsection.deleteItemsAt(0, $.shout_mates_listsection.items.length, {
            animated: true
        });
    }
}

function updateFavShoutSection() {
    'use strict';

    if (!_mShout) {
        return false;
    }
    if ($.fav_shout_listsection.items.length) {
        $.fav_shout_listsection.updateItemAt(0, mapShoutListItem(_mShout, 'fav_shout_template'), {
            animated: true
        });
    }
    var oShout = _mShout.transform();
    $.window.setTitle(oShout.uiWho);
}

function fillFavShoutSection() {
    'use strict';

    if (!_mShout) {
        return false;
    }
    // add favourite shout to list
    var aFavListItem = [mapShoutListItem(_mShout, 'fav_shout_template')];
    $.fav_shout_listsection.appendItems(aFavListItem, {
        animated: true
    });
    // // add other shouts to list
    // var cShouts = Alloy.Collections.instance('shouts');
    // var aListItems = _.map(cShouts.models, function(mShout) {
    // 'use strict';
    //
    // return mapShoutListItem(mShout);
    // });
    // $.other_shouts_listsection.appendItems(aListItems, {
    // animated : true
    // });

    var oShout = _mShout.transform();
    $.window.setTitle(oShout.uiWho);
}

function fillShoutMatesSection() {
    'use strict';

    if (!_mShout) {
        return false;
    }

    // housekeeping for older mates
    _mShout.generateMissingMateIds();

    // add shout mates to list
    var aMates = _mShout.getMates();
    // note: sortation is also considered when giving new mate the shout (and unmarking old one)!
    var aSortedMates = _.sortBy(aMates, function(oMate) {
        return (oMate.hasShout ? 0 : 1);
    });

    var aMatesListItems = _.map(aSortedMates, function(oMate) {
        return mapMateListItem(oMate);
    });
    if ($.shout_mates_listsection.items.length) {
        $.shout_mates_listsection.deleteItemsAt(0, $.shout_mates_listsection.items.length, {
            animated: true
        });
    }
    $.shout_mates_listsection.appendItems(aMatesListItems, {
        animated: true
    });
}

function mapShoutListItem(mShout, template, bIsSwiping) {
    'use strict';

    var oShout = mShout.transform();

    return {
        template: template || 'other_shouts_template',
        properties: {
            accessoryType: template == 'fav_shout_template' ? Ti.UI.LIST_ACCESSORY_TYPE_NONE : Ti.UI.LIST_ACCESSORY_TYPE_DISCLOSURE,
            searchableText: oShout.name + oShout.type + oShout.place,
            itemId: mShout.id
                // if using built-in item templates for iOS, uncomment these
                // title : oShout.uiWho
                // subtitle : oShout.uiWhere
                // image : ...
        },
        shout_who: {
            text: oShout.uiWho,
            visible: (bIsSwiping ? false : true),
        },
        shout_where: {
            text: oShout.uiWhere,
            visible: (bIsSwiping ? false : true),
        }
    };
}

function mapMateListItem(oMate, template) {
    'use strict';
    // set mate's background color
    var circColor = Alloy.CFG.colors.textColor;
    var circBorderColor = Alloy.CFG.colors.textColor;
    var circBackgroundColor = Alloy.CFG.colors.backgroundColor;
    if (oMate.isInactive) {
        circColor = Alloy.CFG.colors.inactiveColor;
        circBorderColor = Alloy.CFG.colors.inactiveColor;
    } else if (oMate.hasShout) {
        circColor = Alloy.CFG.colors.backgroundColor;
        circBorderColor = Alloy.CFG.colors.tintColor;
        // circBackgroundColor = Alloy.CFG.colors.tintColor;
    }

    var mateColor = Alloy.CFG.colors.textColor;
    var mateBackgroundColor = Alloy.CFG.colors.backgroundColor;
    if (oMate.isInactive) {
        mateColor = Alloy.CFG.colors.inactiveColor;
    //    mateBackgroundColor = Alloy.CFG.colors.inactiveBackgroundColor;
    } else if (oMate.hasShout) {
        mateColor = Alloy.CFG.colors.backgroundColor;
        // mateBackgroundColor = Alloy.CFG.colors.tintColor;
        mateBackgroundColor = Alloy.CFG.colors.shoutBackgroundColor;
    }
    var oMateListItem = {
        template: template || 'shout_mates_template',
        properties: {
            accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE,
            searchableText: oMate.name + oMate.poison + oMate.price,
            itemId: oMate.mateId,
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
        mate_poison_circ: {
            color: circColor,
            borderColor: circBorderColor,
            backgroundColor: circBackgroundColor,
        },
        mate_price: {
            // text: oMate.price,
            attributedString: getAttributedPriceText(oMate.price, oMate.hasShout, oMate.isInactive),
        },
        mate_price_edit: {
            value: oMate.price,
        },
        mate_balance: {
            // text : oMate.balance,
            attributedString: getAttributedBalanceText(oMate.balance, oMate.hasShout, oMate.isInactive),
        },
        mate_has_shout: {
            color: mateColor,
            text: (oMate.hasShout ? Alloy.Globals.fa_icons.bullhorn : null),
        },
        mate_is_inactive: {
            // value: (oMate.isInactive ? false : true),
            text: (oMate.isInactive ? Alloy.Globals.fa_icons.toggle_off : Alloy.Globals.fa_icons.toggle_on),
            color: mateColor,
            visible: (oMate.hasShout ? false : true),
        },
        mate_ellipsis_icon: {
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
    if (OS_IOS) {
        oMateListItem.properties = oMateListItem.properties || {};
        oMateListItem.properties.canEdit = true;
        oMateListItem.properties.editActions = setupMateEditActions(oMate);
    }
    return oMateListItem;
}

function setupMateEditActions(oMate) {
    'use strict';

    var aEditActions = [];
    aEditActions.push(_oEditActions.oEdit);
    if (oMate.isInactive) {
        aEditActions.push(_oEditActions.oActivate);
    }
    if (!oMate.isInactive && !oMate.hasShout) {
        aEditActions.push(_oEditActions.oDeactivate);
    }
    if (!oMate.hasShout) {
        aEditActions.push(_oEditActions.oYourShout);
    }
    return aEditActions;
}

function getAttributedPriceText(price, hasShout, isInactive) {
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
    if (isInactive) {
        // change color if mate is inactive
        oAttributedString.addAttribute({
            type: Ti.UI.ATTRIBUTE_FOREGROUND_COLOR,
            value: Alloy.CFG.colors.inactiveColor,
            range: [0, oAttributedString.text.length]
        });
    }
    return oAttributedString;
}

function getAttributedBalanceText(balance, hasShout, isInactive) {
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
    if (isInactive) {
        // change color if mate is inactive
        oAttributedString.addAttribute({
            type: Ti.UI.ATTRIBUTE_FOREGROUND_COLOR,
            value: Alloy.CFG.colors.inactiveColor,
            range: [0, oAttributedString.text.length]
        });
    }
    return oAttributedString;
}

function onShoutWizDone(e) {
    'use strict';

    var logContext = 'shouts.js > onShoutWizDone()';
    log.debug('_mShout currently bound to view', logContext);
    log.debug(_mShout, logContext);
    log.debug('new mShout model received from shout_wiz:', logContext);
    log.debug(e.mShout, logContext);

    _oShoutWizController = null;

    if (e.mShout) {
        // mark the new fav shout
        var bIsFirstShout = _mShout ? false : true;

        _mShout = e.mShout;
        Alloy.Collections.instance('shouts').markAsFav(_mShout);

        // reconfigure menus
        changeMenu();

        // update list
        if (bIsFirstShout) {
            fillFavShoutSection();
        } else {
            updateFavShoutSection();
        }
        fillPageIndicatorIcons();
        fillShoutMatesSection();


        _.defer(function() {
            if (!_bDidAnimateIn) {
                $.animateIn();
            }
            showAddSomeMatesToast();
        });
    }
}

function showAddSomeMatesToast(message) {
    'use strict';

    toast.show(message || L('shouts_add_some_mates'));
    animation.shake($.go_add_mate_icon, 2000);
}

function goShoutWiz() {
    'use strict';

    _oShoutWizController = Alloy.Globals.Navigator.push('shout_wiz', {
        bCanSkipWelcome: true,
    });
    // register with wizard 'done' event
    _oShoutWizController.once('done', onShoutWizDone);
}

function saveEditingMateChanges() {
    'use strict';

    // save changes, if any
    var oMate = _mShout.getMate(_oIsEditingMate.mateId);
    if (!_.isEqual(oMate, _oIsEditingMate)) {
        _mShout.updateMate(_oIsEditingMate);
        _mShout.save();
    }
}

function toggleMateEditing(mateId, itemIndex) {
    'use strict';

    if (!_bIsEditingMate) {
        // set up a clone of the selected mate for editing
        _oIsEditingMate = _.clone(_mShout.getMate(mateId));

        // render shout mate item with editing template
        $.shout_mates_listsection.updateItemAt(itemIndex, mapMateListItem(_oIsEditingMate, 'edit_mate_template'), {
            animated: true
        });

        // flag that mates list editing is active
        _bIsEditingMate = true;
        _iIsEditingIndex = itemIndex;
    } else {
        // rerender the original mate listitem
        $.shout_mates_listsection.updateItemAt(_iIsEditingIndex, mapMateListItem(_oIsEditingMate), {
            animated: true
        });

        // flag that mates list editing is done
        _bIsEditingMate = false;
        _iIsEditingIndex = 0;
    }
}

function onMateInactiveIconClick(e) {
    'use strict';

    onMateInactiveSwitchClick(e, _oIsEditingMate.isInactive);
}

function onMateInactiveSwitchClick(e, bActive) {
    'use strict';

    bActive = (bActive !== undefined ? bActive : e.value);

    // check that the mate does not currently have the shout before deactivating!
    if (_oIsEditingMate.hasShout && bActive === false) {
        toast.show(L('shouts_give_the_next_shout_to_someone_else_first'));
    } else {
        _oIsEditingMate.isInactive = bActive ? false : true;

        saveEditingMateChanges();
    }
    toggleMateEditing(e.itemId, e.itemIndex);
}

function onMateEditClick(e) {
    'use strict';

    goEditMate(e.itemId);
}

function giveMateTheShout(e) {
    'use strict';

    var logContext = 'shouts.js > giveMateTheShout()';

    var oOldShoutMate = _mShout.giveMateTheShout(e.itemId);
    _mShout.save();

    log.debug('old shouter after giving new mate the shout:', logContext);
    log.debug(oOldShoutMate, logContext);

    // merge the update shouter details into the editing clone
    _.extend(_oIsEditingMate, _mShout.getShouter());

    // the list is sorted (at time of fetch) by who has the shout,
    // so figure out the index of the old shout mate
    var iOldShouterIndex = e.itemIndex;
    for (var i = 0; i < $.shout_mates_listsection.items.length; i++) {
        if ($.shout_mates_listsection.items[i].properties.itemId === oOldShoutMate.mateId) {
            iOldShouterIndex = i;
        }
    }

    // rerender the original shouting mate's listitem
    if (iOldShouterIndex !== e.itemIndex) {
        $.shout_mates_listsection.updateItemAt(iOldShouterIndex, mapMateListItem(oOldShoutMate), {
            animated: true
        });
        // rerender the fav shout listitem
        updateFavShoutSection();
    }
}

function onMateYourShoutClick(e) {
    'use strict';

    try {
        giveMateTheShout(e);
    } catch (oErr) {
        toast.show(oErr.message || oErr);
    } finally {
        toggleMateEditing(e.itemId, e.itemIndex);
    }
}

function onFavShoutClick(e) {
    'use strict';

    switch (e.section) {
        case $.fav_shout_listsection:
            doFavShout();
            break;

        default:
            break;
    }
}

function onFavShoutDelete(e) {
    'use strict';

    dialogs.confirm({
        message: L('shouts_delete_the_shout_are_you_sure'),
        callback: function() {
            // find and destroy history for the shout
            var aHistory = Alloy.Collections.instance('history').getShoutHistory(_mShout.id);
            _.each(aHistory, function(mHistory) {
                Alloy.Collections.instance('history').remove(mHistory);
                mHistory.destroy();
            });
            // destroy the shout itself
            Alloy.Collections.instance('shouts').remove(_mShout);
            _mShout.destroy();
            _mShout = null;
            toast.show(L('shouts_shout_has_been_deleted'));

            // select the first remaining shout as new favourite
            _mShout = Alloy.Collections.instance('shouts').first();
            if (_mShout && _mShout.id) {
                Alloy.Collections.instance('shouts').markAsFav(_mShout);
                updateFavShoutSection();
                fillShoutMatesSection();
            } else {
                // if no shouts left, clear list and navigate to add shout wizard
                goShoutWiz();
                _.defer(function() {
                    resetShoutList();
                });
            }

            // update list
            fillPageIndicatorIcons();

            changeMenu();
        }
    });
}

function onMateClick(e) {
    'use strict';

    if (OS_IOS) {
        // we use editactions on ios
        return false;
    }

    switch (e.section) {
        case $.shout_mates_listsection:
            toggleMateEditing(e.itemId, e.itemIndex);
            // goEditMate(e.itemId);
            break;

        default:
            break;
    }
}

function onMateSwipe(e) {
    'use strict';

    if (OS_IOS) {
        // we use editactions on ios
        return false;
    }

    switch (e.section) {
        case $.shout_mates_listsection:
            toggleMateEditing(e.itemId, e.itemIndex);
            break;

        default:
            break;
    }
}

function onGoEditMateDone(e) {
    'use strict';

    var logContext = 'shouts.js > onGoEditMateDone()';
    _oMateController = null;

    if (e.oMate) {
        log.trace('received changed mate from editing:', logContext);
        log.trace(e.oMate, logContext);
        log.trace('current mate before editing:', logContext);
        log.trace(_oIsEditingMate, logContext);
        var bMustUpdateFavShoutSection = false;
        if (_oIsEditingMate.hasShout && _oIsEditingMate.name !== e.oMate.name) {
            // if the shouter's name has changed then so also the shout
            bMustUpdateFavShoutSection = true;
        }

        // merge changed mate with model
        _.extend(_oIsEditingMate, e.oMate);

        saveEditingMateChanges();

        if (bMustUpdateFavShoutSection) {
            updateFavShoutSection();
        }

        toggleMateEditing(_oIsEditingMate.mateId, _iIsEditingIndex);
    }
}

function onGoEditMateDelete(e) {
    'use strict';

    _oMateController = null;

    if (e.oMate) {
        toggleMateEditing(_oIsEditingMate.mateId, _iIsEditingIndex);

        try {
            _mShout.removeMate(e.oMate.mateId);
            _mShout.save();

            $.shout_mates_listsection.deleteItemsAt(0, $.shout_mates_listsection.items.length, {
                animated: true
            });
            fillShoutMatesSection();
        } catch (oErr) {
            toast.show(oErr.message || oErr);
        } finally {}
    }
}

function goEditMate(mateId) {
    'use strict';

    var oMate = _.clone(_mShout.getMate(mateId));

    _oMateController = Alloy.Globals.Navigator.push('mate', {
        mShout: _mShout,
        oMate: oMate
    });
    // register for 'done' and 'delete' events on controller
    _oMateController.once('done', onGoEditMateDone);
    _oMateController.once('delete', onGoEditMateDelete);
}

/**
 * event listener set via view for when the user clicks a MenuItem
 * @param  {Object} e Event
 */
function doFavShout(e) {
    'use strict';

    if (_mShout.getMates().length === 0) {
        showAddSomeMatesToast(L('shouts_you_need_to_add_some_mates_first'));
    } else {
        dialogs.confirm({
            message: String.format(L('shouts_total_cost'), Number(_mShout.calcShoutCost(true)).toFixed(2)),
            callback: function() {
                // update shouter balance
                var oNextToShout = _mShout.updateShouterBalance();
                // archive shout to history
                Alloy.Collections.instance('history').archiveShout(_mShout);
                // give next mate the shout and save
                _mShout.giveMateTheShout(oNextToShout.mateId);
                _mShout.save();
                // the last shout becomes the favourite
                Alloy.Collections.instance('shouts').markAsFav(_mShout);

                // let the user know who's next up
                toast.show(String.format(L('shouts_next_shout_is_on'), oNextToShout.name));

                // update list
                updateFavShoutSection();
                fillShoutMatesSection();

                changeMenu();
            }
        });
    }
}

function goAddMate() {
    'use strict';

    _oMateController = Alloy.Globals.Navigator.push('mate', {
        mShout: _mShout
    });
    // register for 'done' event on controller
    _oMateController.once('done', function(e) {
        _oMateController = null;

        if (e.oMate) {
            var oAddedMate = _mShout.addMate(e.oMate);
            _mShout.save();

            $.shout_mates_listsection.appendItems([mapMateListItem(oAddedMate)], {
                animated: true
            });

            if (oAddedMate.hasShout) {
                updateFavShoutSection();
            }
        }
    });
}

function goHistory() {
    'use strict';

    var oHistoryController = Alloy.Globals.Navigator.push('history', {
        mShout: _mShout
    });
    oHistoryController.once('undo', function() {
        updateFavShoutSection();
        fillShoutMatesSection();
    });
}

function createAndroidMenu(menu) {
    'use strict';

    if (OS_ANDROID) {
        // var menuItemDoFavShout = menu.add({
        //     itemId : CONST.MENU.SHOUTS_DO_FAV_SHOUT,
        //     title : L('shouts_fav_shout'),
        //     showAsAction : Ti.Android.SHOW_AS_ACTION_IF_ROOM,
        //     visible : false,    // hide until shout is loaded
        // });
        // menuItemDoFavShout.addEventListener('click', doFavShout);

        var menuItemAddShout = menu.add({
            itemId: CONST.MENU.SHOUTS_ADD_SHOUT,
            title: L('shouts_add_shout'),
            showAsAction: Ti.Android.SHOW_AS_ACTION_IF_ROOM,
        });
        menuItemAddShout.addEventListener('click', goShoutWiz);

        // var menuItemAddMate = menu.add({
        //     itemId : CONST.MENU.SHOUTS_ADD_MATE,
        //     title : L('shout_wiz_add_mate'),
        //     showAsAction : Ti.Android.SHOW_AS_ACTION_NEVER,
        //     visible : false,    // hide until shout is loaded
        // });
        // menuItemAddMate.addEventListener('click', goAddMate);

        var menuItemHistory = menu.add({
            itemId: CONST.MENU.SHOUTS_HISTORY,
            title: L('shouts_history'),
            showAsAction: Ti.Android.SHOW_AS_ACTION_NEVER,
            visible: false, // hide until shout is loaded
        });
        menuItemHistory.addEventListener('click', goHistory);

        var menuItemDelete = menu.add({
            itemId: CONST.MENU.SHOUTS_DELETE,
            title: L('app_delete'),
            showAsAction: Ti.Android.SHOW_AS_ACTION_NEVER,
            visible: false, // hide until shout is loaded
        });
        menuItemDelete.addEventListener('click', onFavShoutDelete);
    }
}

function prepareAndroidMenu(menu) {
    'use strict';

    if (OS_ANDROID) {
        // var menuItemDoFavShout = menu.findItem(CONST.MENU.SHOUTS_DO_FAV_SHOUT);
        // var menuItemAddMate = menu.findItem(CONST.MENU.SHOUTS_ADD_MATE);
        var menuItemHistory = menu.findItem(CONST.MENU.SHOUTS_HISTORY);
        var menuItemDelete = menu.findItem(CONST.MENU.SHOUTS_DELETE);
        // show/hide menuitems depending on if we have a current shout
        if (_mShout && _mShout.id) {
            // if (menuItemDoFavShout) {
            //     menuItemDoFavShout.setVisible(true);
            // }
            // if (menuItemAddMate) {
            //     menuItemAddMate.setVisible(true);
            // }
            if (menuItemHistory) {
                menuItemHistory.setVisible(true);
            }
            if (menuItemDelete) {
                menuItemDelete.setVisible(true);
            }
        }
    }
}

function changeMenu() {
    'use strict';

    if (OS_ANDROID) {
        // we have to signal android to invalidate the options menu:
        // it will be reconfigured in the onPrepareOptionsMenu handler
        $.window.activity.invalidateOptionsMenu();
    }
    if (OS_IOS) {

    }
}

function onWindowOpen() {
    'use strict';

    var logContext = 'shouts.js > onWindowOpen()';

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

    log.trace('raising $.open event...', logContext);
    $.trigger('open');
}

function onWindowClose() {
    'use strict';

    $.window.removeEventListener('close', onWindowClose);

    // destroy alloy data bindings
    $.destroy();
}

function onEditAction(e){
    'use strict';

    _bIsEditingMate = true;
    _iIsEditingIndex = e.itemIndex;
    _oIsEditingMate = _.clone(_mShout.getMate(e.itemId));

    // switch (e.identifier) {
    switch (e.action) {
        case CONST.ACTIONS.EDIT:
            goEditMate(e.itemId);
            break;

        case CONST.ACTIONS.YOUR_SHOUT:
            onMateYourShoutClick(e);
            break;

        case CONST.ACTIONS.ACTIVATE:
            onMateInactiveSwitchClick(e, true);
            break;

        case CONST.ACTIONS.DEACTIVATE:
            onMateInactiveSwitchClick(e, false);
            break;

        default:

    }
}

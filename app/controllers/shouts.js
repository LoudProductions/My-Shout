var animation = require('alloy/animation');
var dialogs = require('alloy/dialogs');

var _fnLoadedCallback;
var _bIsEditingMate = false;
var _iIsEditingIndex = 0;
var _oIsEditingMate;
var _oMateController;

/**
 * self-executing function to organize otherwise inline constructor code
 * @param  {Object} args arguments passed to the controller
 */
(function(args) {

    // Use strict mode for this function scope. We can't do this for all of the
    // controller because after Alloy has compiled all of this file is wrapped.
    // FIXME: https://jira.appcelerator.org/browse/ALOY-1263
    'use strict';

    _fnLoadedCallback = args.fnLoadedCallback;

    _.defer(function() {
        init();
    });

    /**
     * animate in view
     */
    $.animateIn = function() {
        $.activity_indicator.hide();

        $.shouts_container.animate(Ti.UI.createAnimation({
            opacity: 1,
            duration: 1000
        }));
    };

})(arguments[0] || {});

function init() {
    'use strict';

    fetchFavShout();
    fillFavShoutSection();
    fillShoutMatesSection();

    if (_.isFunction(_fnLoadedCallback)) {
        _fnLoadedCallback();
    }
}

function fetchFavShout() {
    'use strict';

    // find the first shout model marked as favourite
    var cShouts = Alloy.Collections.instance('shouts');
    var mFavShout = cShouts.findWhere({
        isFav: true
    });
    if (!mFavShout) {
        mFavShout = cShouts.first();
    }

    // fetch model bound to view
    $.mShout.id = mFavShout.id;
    $.mShout.fetch();
}

function fetchShoutIndex(iOffset) {
    'use strict';

    iOffset = iOffset || 1;

    // find the index of the current model
    var cShouts = Alloy.Collections.instance('shouts');
    var iCurrent = -1;
    for (var i = 0; i < cShouts.models.length; i++) {
        if (cShouts.models[i].id === $.mShout.id) {
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

    // fetch model bound to view
    $.mShout.id = mNextShout.id;
    $.mShout.fetch();
}

function onFavShoutSwipe(e) {
    'use strict';

    if (e.direction === 'up' || e.direction === 'down') {
        if (e.bubbles) {
            e.cancelBubble = true;
        }
        return false;
    }
    var oView = e.source;
    animation.fadeOut(oView, 100, function() {
        // fetch the next/previous shout
        switch (e.direction) {
            // case 'up':
            case 'left':
                fetchShoutIndex(-1);
                break;

                // case 'down':
            case 'right':
                fetchShoutIndex(1);
                break;

            default:
                break;
        }
        // update list
        updateFavShoutSection();
        fillShoutMatesSection();

        _.defer(function() {
            animation.fadeIn(oView, 100);
        });
    });

}

function updateFavShoutSection() {
    'use strict';

    if ($.fav_shout_listsection.items.length) {
        var aFavListItem = [mapShoutListItem($.mShout, 'fav_shout_template')];
        $.fav_shout_listsection.replaceItemsAt(0, 1, aFavListItem, {
            animated: true
        });
    }
}

function fillFavShoutSection() {
    'use strict';

    // add favourite shout to list
    var aFavListItem = [mapShoutListItem($.mShout, 'fav_shout_template')];
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

}

function fillShoutMatesSection() {
    'use strict';

    // housekeeping for older mates
    $.mShout.generateMissingMateIds();

    // add shout mates to list
    var aMates = $.mShout.getMates();
    var aMatesListItems = _.map(aMates, function(oMate) {
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

function mapShoutListItem(mShout, template) {
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
            text: oShout.uiWho
        },
        shout_where: {
            text: oShout.uiWhere
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
        mate_poison_circ: {
            color: circColor,
            borderColor: circBorderColor,
            backgroundColor: circBackgroundColor,
        },
        mate_price: {
            // text: oMate.price,
            attributedString: getAttributedPriceText(oMate.price),
        },
        mate_price_edit: {
            value: oMate.price,
        },
        mate_balance: {
            // text : oMate.balance,
            attributedString: getAttributedBalanceText(oMate.balance),
        },
        mate_has_shout: {
            color: mateColor,
            text: (oMate.hasShout ? Alloy.Globals.fa_icons.bullhorn : null),
        },
        mate_is_inactive: {
            value: (oMate.isInactive ? false : true),
        },
        mate_ellipsis_icon: {
            color: mateColor,
            backgroundColor: mateBackgroundColor
        },
        mate_edit_icon: {
            color: mateColor,
            backgroundColor: mateBackgroundColor
        },
        mate_shout_icon: {
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

function getAttributedPriceText(price) {
    'use strict';

    price = Number.isNaN(price) ? 0 : price;
    var oAttributedString = Ti.UI.createAttributedString({
        text: '$' + Number(price).toFixed(2),
    });
    oAttributedString.addAttribute({
        type: Ti.UI.ATTRIBUTE_FONT,
        value: {
            fontSize: 14,
            fontFamily: 'OpenSans-ExtraBold'
        },
        range: [0, 1]
    });
    return oAttributedString;
}

function getAttributedBalanceText(balance) {
    'use strict';

    balance = Number.isNaN(balance) ? 0 : balance;
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

/**
 * event listener set via view for when the user clicks a MenuItem
 * @param  {Object} e Event
 */
function goShoutWiz(e) {
    'use strict';

    Alloy.Globals.Navigator.push('shout_wiz', {
        bCanSkipWelcome: true,
        fnDoneCallback: function(mShout) {
            Alloy.Globals.Navigator.pop();
            if (mShout) {
                // mark the new fav shout
                mShout.markAsFav();
                mShout.save();
                // unmark the current fav shout
                $.mShout.unmarkAsFav();
                $.mShout.save();
                // fetch the shout bound to the view again
                $.mShout.id = mShout.id;
                $.mShout.fetch();

                // update list
                updateFavShoutSection();
                fillShoutMatesSection();

            }
        }
    });
}

function saveEditingMateChanges() {
    'use strict';

    // save changes, if any
    var oMate = $.mShout.getMate(_oIsEditingMate.mateId);
    if (!_.isEqual(oMate, _oIsEditingMate)) {
        _.extend(oMate, _oIsEditingMate);
        $.mShout.save();
    }
}

function toggleMateEditing(mateId, itemIndex) {
    'use strict';

    if (!_bIsEditingMate) {
        // set up a clone of the selected mate for editing
        _oIsEditingMate = _.clone($.mShout.getMate(mateId));

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
            animated : true
        });

        // flag that mates list editing is done
        _bIsEditingMate = false;
        _iIsEditingIndex = 0;
    }
}

function onMateInactiveSwitchClick(e) {
    'use strict';

    // check that the mate does not currently have the shout before deactivating!
    if (_oIsEditingMate.hasShout && e.value === false) {
        toast.show(L('shouts_give_the_next_shout_to_someone_else_first'));
    } else {
        _oIsEditingMate.isInactive = e.value ? false : true;

        saveEditingMateChanges();
    }
    toggleMateEditing(e.itemId, e.itemIndex);
}

function onMateEditClick(e) {
    'use strict';

    goEditMate(e.itemId);
}

function onMateShoutClick(e) {
    'use strict';

    try {
        var oReturn = $.mShout.giveMateTheShout(e.itemId);
        $.mShout.save();

        // merge the update shouter details into the editing clone
        _.extend(_oIsEditingMate, $.mShout.getShouter());

        // rerender the original shouting mate's listitem
        if (oReturn.oldShouterIndex !== e.itemIndex) {
            var oOldShoutMate = $.mShout.getMate(oReturn.oldShouterId);
            $.shout_mates_listsection.updateItemAt(oReturn.oldShouterIndex, mapMateListItem(oOldShoutMate), {
                animated : true
            });
            // rerender the fav shout listitem
            updateFavShoutSection();
        }
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

function onMateClick(e) {
    'use strict';

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

    _oMateController.off('done', onGoEditMateDone);
    _oMateController = null;

    if (e.oMate) {
        var bMustUpdateFavShoutSection = _oIsEditingMate.name === $.mShout.get('name') ? true : false;

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

    _oMateController.off('delete', onGoEditMateDelete);
    _oMateController = null;

    if (e.oMate) {
        toggleMateEditing(_oIsEditingMate.mateId, _iIsEditingIndex);

        try {
            $.mShout.removeMate(e.oMate.mateId);
            $.mShout.save();

            $.shout_mates_listsection.deleteItemsAt(0, $.shout_mates_listsection.items.length, {
                animated: true
            });
            fillShoutMatesSection();
        } catch (oErr) {
            toast.show(oErr.message || oErr);
        } finally {

        }
    }
}

function goEditMate(mateId) {
    'use strict';

    var oMate = _.clone($.mShout.getMate(mateId));

    _oMateController = Alloy.Globals.Navigator.push('mate', {
        mShout: $.mShout,
        oMate: oMate
    });
    // register for 'done' and 'delete' events on controller
    _oMateController.on('done', onGoEditMateDone);
    _oMateController.on('delete', onGoEditMateDelete);
}

/**
 * event listener set via view for when the user clicks a MenuItem
 * @param  {Object} e Event
 */
function doFavShout(e) {
    'use strict';

    dialogs.confirm({
        message: String.format(L('shouts_total_cost'), Number($.mShout.calcShoutCost()).toFixed(2)),
        callback: function() {
            // update shouter balance and toast the next shouter!
            var oNextToShout = $.mShout.updateShouterBalance();
            $.mShout.save();
            toast.show(String.format(L('shouts_next_shout_is_on'), oNextToShout.name));

            // update list
            updateFavShoutSection();
            fillShoutMatesSection();
        }
    });
}

/**
 * event listener set via view for when the user deletes a ListView item
 * @param  {Object} e Event
 */
function deleteShout(e) {
    'use strict';

    log.warn('deleted list item: ' + e.itemId);
    log.debug(e);

    // remove the model from the collection
    var mShout = Alloy.Collections.instance('shouts').get(e.itemId);
    // prompt the user to confirm shout should be deleted
    alloy_dialogs.confirm({
        title: L('shouts_delete_shout'),
        message: L('app_are_you_sure'),
        callback: function() {
            return mShout.destroy({
                wait: true
            });
        }
    });
}

function onGoAddMateDone(e){
    'use strict';

    _oMateController.off('done', onGoAddMateDone);
    _oMateController = null;

    if (e.oMate) {
        $.mShout.addMate(e.oMate);
        $.mShout.save();

        $.shout_mates_listsection.appendItems([mapMateListItem(e.oMate)], {
            animated : true
        });
    }
}

function goAddMate(e){
    'use strict';

    _oMateController = Alloy.Globals.Navigator.push('mate', {
        mShout: $.mShout
    });
    // register for 'done' event on controller
    _oMateController.on('done', onGoAddMateDone);
}

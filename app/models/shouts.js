exports.definition = {
    config : {

        adapter : {
            type : "properties",
            collection_name : "shouts"
        }
    },
    extendModel : function(Model) {
        "use strict";

        _.extend(Model.prototype, {
            // extended functions and properties go here
            transform : function() {
                var logContext = "models/shouts.js > transform()";

                var model = this;
                var t = this.toJSON();

                Object.defineProperty(t, "uiWho", {
                    get : function() {
                        return (t.name && t.name !== L("app_my_shout")) ? String.format(L("shouts_so_and_sos_shout"), t.name) : L("app_my_shout");
                    }
                });

                Object.defineProperty(t, "uiWhere", {
                    get : function() {
                        return t.type + " @ " + (t.place || L("shouts_some_place"));
                    }
                });

                return t;
            },
            generateMissingMateIds : function() {
                var logContext = "models/shouts.js > generateMissingMateIds()";

                var aMates = this.getMates();
                var bDidSetMateIds = false;
                _.each(aMates, function(oMate) {
                    if (!oMate.mateId) {
                        // generate a mate ID
                        oMate.mateId = this.getNextMateId(aMates);
                        bDidSetMateIds = true;
                    }
                }, this);
                if (bDidSetMateIds) {
                    // update the model
                    this.set("mates", aMates);
                    this.save();
                }
            },
            getNextMateId : function(aMates) {
                aMates = _.isArray(aMates) ? aMates : this.getMates();
                // generate a mate ID from the shout's ID and the mate's index
                return this.id + "-" + (aMates.length + 1);
            },
            updateMate : function(oMate, bReplaceCurrentMate) {
                var logContext = "models/shouts.js > updateMate()";

                var aMates = this.getMates();
                // check we have a valid mate
                if (!oMate || (oMate && !oMate.mateId)) {
                    Log.error("updateMate called without a valid oMate!", logContext);
                    throw new Error(L("shouts_could_not_find_mate"));
                }
                if (bReplaceCurrentMate) {
                    // remove current mate and add new one
                    this.removeMate(oMate.mateId, aMates);
                    this.addMate(oMate, aMates);
                } else {
                    // extend current mate with changes
                    var oCurrentMate = this.getMate(oMate.mateId, aMates);
                    _.extend(oCurrentMate, oMate);
                    // update the model
                    this.set("mates", aMates);
                    if (oMate.hasShout) {
                        // set the shout name based on the new shouter
                        this.set("name", oMate.name);
                    }
                }
            },
            removeMate : function(mateId, aMates) {
                var logContext = "models/shouts.js > removeMate()";

                aMates = _.isArray(aMates) ? aMates : this.getMates();
                // find the specified mate
                var oMate = this.getMate(mateId, aMates);
                // check that the mate does not currently have the shout
                if (oMate.hasShout) {
                    // we throw an error but don't log anything as this is a user error
                    throw new Error(L("shouts_give_the_next_shout_to_someone_else_first"));
                }
                // remove mate from model
                var aMatesWithout = _.without(aMates, oMate);
                this.set("mates", aMatesWithout);
            },
            addMate : function(oMate, aMates) {
                var logContext = "models/shouts.js > addMate()";

                aMates = _.isArray(aMates) ? aMates : this.getMates();
                // add to member array keeping track of mates
                // if this will be the first mate, they have the shout by default
                if (aMates.length === 0) {
                    oMate.hasShout = true;
                    this.set("name", oMate.name);
                }
                if (!oMate.mateId) {
                    oMate.mateId = this.getNextMateId(aMates);
                }
                aMates.push(oMate);
                // update shout model
                this.set("mates", aMates);

                // check if new mate has the shout
                if (oMate.hasShout) {
                    this.giveMateTheShout(oMate.mateId, aMates);
                }
                return oMate;
            },
            getMates : function() {
                return this.get("mates") || [];
            },
            getMate : function(mateId, aMates) {
                var logContext = "models/shouts.js > getMate()";

                // find the specified mate
                aMates = _.isArray(aMates) ? aMates : this.getMates();
                var oMate = _.findWhere(aMates, {
                    mateId: mateId
                });
                if (!oMate) {
                    Log.error(String.format("Mate with id %s not found!", mateId), logContext);
                    throw new Error(L("shouts_could_not_find_mate"));
                } else {
                    return oMate;
                }
            },
            getShouter : function(aMates) {
                var logContext = "models/shouts.js > getShouter()";

                aMates = _.isArray(aMates) ? aMates : this.getMates();
                // find the mate that currently has the shout
                var oMate = _.findWhere(aMates, {
                    hasShout: true
                });
                if (!oMate) {
                    Log.error(L("shouts_could_not_find_shouter"), logContext);
                    throw new Error(L("shouts_could_not_find_shouter"));
                } else {
                    return oMate;
                }
            },
            giveMateTheShout : function(mateId, aMates) {
                var logContext = "models/shouts.js > giveMateTheShout()";

                aMates = _.isArray(aMates) ? aMates : this.getMates();
                // find the specified mate
                var oNewShouter = this.getMate(mateId, aMates);
                // if the mate already has the shout there is nothing for us to do here
                if (oNewShouter.hasShout) {
                    Log.debug("new shouter already has the shout: " + oNewShouter.name, logContext);
                    return oNewShouter;
                }

                // unmark previous shouter
                var oOldShouter = this.getShouter(aMates);

                // switch the shout over
                oOldShouter.hasShout = false;
                oNewShouter.hasShout = true;
                oNewShouter.isInactive = false; // automatically activate mate if giving the shout
                Log.debug("unmarked previous shouter: " + oOldShouter.name, logContext);
                Log.debug("marked new shouter: " + oNewShouter.name, logContext);

                // update the model
                this.set("mates", aMates);
                // set the shout name based on the new shouter
                this.set("name", oNewShouter.name);
                Log.debug("model after switching shouts:", logContext);
                Log.debug(this.toJSON(), logContext);

                return oOldShouter;
            },
            calcShoutCost : function(bIncludeShouter, aMates) {
                var logContext = "models/shouts.js > calcShoutCost()";

                aMates = _.isArray(aMates) ? aMates : this.getMates();
                // calculate cost to the shouter
                return _.reduce(aMates, function(memo, oMate) {
                    // add up the cost for active non-shouters
                    if (oMate.isInactive || (oMate.hasShout && !bIncludeShouter)) {
                        return memo + 0;
                    } else {
                        return memo + Number(oMate.price);
                    }
                }, 0);
            },
            updateShouterBalance : function() {
                var logContext = "models/shouts.js > updateShouterBalance()";

                var aMates = this.getMates();
                // calculate cost to the shouter
                var shoutCost = this.calcShoutCost(false, aMates);
                // add cost to shouters balance
                var oShouter = this.getShouter(aMates);
                oShouter.balance = (Number(oShouter.balance) || 0) + shoutCost;
                Log.debug("crediting " + oShouter.name + ": " + shoutCost, logContext);
                // subtract price from each mates balance
                _.each(aMates, function(oMate) {
                    if (!oMate.isInactive && oMate !== oShouter) {
                        oMate.balance = (Number(oMate.balance) || 0) - Number(oMate.price);
                        Log.debug("debiting " + oMate.name + ": " + oMate.price, logContext);
                    }
                });
                // find next to shout and swap the shout
                var oNextToShout = _.min(aMates, function(oMate) {
                    return (Number(oMate.balance) || 0);
                });
                return oNextToShout;
            },
            undoShout: function(aUndoMates) {
				var logContext = "models/shouts.js > undoShout()";

                var aMates = this.getMates();
                // calculate cost to the original shouters
                var undoCost = _.reduce(aUndoMates, function(memo, oUndoMate) {
                    // add up the cost for active non-shouters
                    if (oUndoMate.isInactive || oUndoMate.hasShout) {
                        return memo + 0;
                    } else {
                        return memo + Number(oUndoMate.price);
                    }
                }, 0);

                // subtract cost to shouters balance
                var oUndoShouter = _.findWhere(aUndoMates, {
                    hasShout : true
                });
                Log.debug("original shouter: " + oUndoShouter.name, logContext);
                Log.debug("cost to be debited: " + undoCost, logContext);
                var oPreviousShouter = this.getMate(oUndoShouter.mateId, aMates);
                oPreviousShouter.balance = (Number(oPreviousShouter.balance) || 0) - undoCost;
                // add price of original poison to each mate's balance
                _.each(aUndoMates, function(oUndoMate) {
                    var oMate = this.getMate(oUndoMate.mateId, aMates);
                    if (oMate && !oUndoMate.isInactive && oUndoMate !== oUndoShouter) {
                        oMate.balance = (Number(oMate.balance) || 0) + Number(oUndoMate.price);
                        Log.debug("crediting " + oUndoMate.name + ": " + oUndoMate.price, logContext);
                    }
                }, this);
                // find next to shout and swap the shout
                var oNextToShout = _.min(aMates, function(oMate) {
                    return (Number(oMate.balance) || 0);
                });
                Log.debug("giving the next shout to " + oNextToShout.name, logContext);
                this.giveMateTheShout(oNextToShout.mateId, aMates);
                this.save();
			},
            validate : function(bNoFix) {
				var logContext = "models/shouts.js > validate()";

				// check all keys actually exist
				var oShout = this.toJSON();
				Log.debug("validating model:", logContext);
				Log.debug(oShout, logContext);

                var bDidChange = false;
				if (!_.has(oShout, "name")) {
                    bDidChange = true;
					oShout.name = L("app_my_shout");
				}
				if (!_.has(oShout, "type")) {
                    bDidChange = true;
					oShout.type = L("shout_wiz_coffee");
				}
				if (!_.has(oShout, "place")) {
                    bDidChange = true;
					oShout.place = L("shouts_some_place");
				}
				if (!_.has(oShout, "mates")) {
                    bDidChange = true;
					oShout.mates = [];
				}
				if (!_.has(oShout, "isFav")) {
                    bDidChange = true;
					oShout.isFav = false;
				}
				// now check that we have acceptable values for each
				// if (!oShout.name) {
				// 	Log.error(L(""), logContext);
				// 	throw new Error(L("mate_name_is_required"));
				// }
				if (!bNoFix && bDidChange) {
                    Log.debug("model changed as a result of validation:", logContext);
    				Log.debug(oShout, logContext);
					this.set(oShout);
				}
			},
            save : function(options) {
                var logContext = "models/shouts.js > save()";

                // validate model first
                this.validate();

                options = options ? _.clone(options) : {};
                Log.debug("saving..." + (options ? " with options: " + JSON.stringify(options) : ""), logContext);

                return Backbone.Model.prototype.save.call(this, options);
            },
        });

        return Model;
    },
    extendCollection : function(Collection) {
        "use strict";

        _.extend(Collection.prototype, {
            // extended functions and properties go here

            // For Backbone v1.1.2, uncomment the following to override the
            // fetch method to account for a breaking change in Backbone.
            fetch : function(options) {
                options = options ? _.clone(options) : {};
                options.reset = true;
                return Backbone.Collection.prototype.fetch.call(this, options);
            },
            markAsFav : function(mFavShout) {
                var logContext = "models/shouts.js > markAsFav()";

                // mark the new model as favourite and unmark all others
                _.each(this.models, function(mShout) {
                    if (mShout.id === mFavShout.id && mShout.get("isFav") === false) {
                        Log.debug("marking shout as favourite...", logContext);
                        mShout.set("isFav", true);
                        mShout.save();
                    }
                    if (mShout.id !== mFavShout.id && mShout.get("isFav") === true) {
                        Log.debug("unmarking shout as favourite...", logContext);
                        mShout.set("isFav", false);
                        mShout.save();
                    }
                }, this);
            },
        });

        return Collection;
    }
};

exports.definition = {
    config : {

        adapter : {
            type : "properties",
            collection_name : "shouts"
        }
    },
    extendModel : function(Model) {
        'use strict';

        _.extend(Model.prototype, {
            // extended functions and properties go here
            transform : function() {
                var logContext = 'models/shouts.js > model.transform()';

                var model = this;
                var t = this.toJSON();

                Object.defineProperty(t, 'uiWho', {
                    get : function() {
                        return (t.name ? (t.name + "'s " + L('shouts_shout')) : L('app_my_shout'));
                    }
                });

                Object.defineProperty(t, 'uiWhere', {
                    get : function() {
                        return t.type + ' @ ' + (t.place || L('shouts_some_place'));
                    }
                });

                return t;
            },
            generateMissingMateIds : function() {
                var logContext = 'models/shouts.js > model.generateMissingMateIds()';

                var aMates = this.getMates();
                var bDidSetMateIds = false;
                _.each(aMates, function(oMate) {
                    if (!oMate.mateId) {
                        // generate a mate ID
                        oMate.mateId = this.getNextMateId();
                        bDidSetMateIds = true;
                    }
                });
                if (bDidSetMateIds) {
                    // update the model
                    this.set('mates', aMates);
                    this.save();
                }
            },
            getNextMateId : function() {
                // generate a mate ID from the shout's ID and the mate's index
                return this.id + '-' + (this.getMates().length + 1);
            },
            updateMate : function(oMate, bReplaceCurrentMate) {
                var logContext = 'models/shouts.js > model.updateMate()';

                // check we have a valid mate
                if (!oMate || (oMate && !oMate.mateId)) {
                    log.error('updateMate called without a valid oMate!', logContext);
                    throw new Error(L('shouts_could_not_find_mate'));
                }
                if (bReplaceCurrentMate) {
                    // remove current mate and add new one
                    this.removeMate(oMate.mateId);
                    this.addMate(oMate);
                } else {
                    // extend current mate with changes
                    var aMates = this.getMates();
                    var oCurrentMate = this.getMate(oMate.mateId);
                    _.extend(oCurrentMate, oMate);
                    // update the model
                    this.set('mates', aMates);
                    if (oMate.hasShout) {
                        // set the shout name based on the new shouter
                        this.set('name', oMate.name);
                    }
                }
            },
            removeMate : function(mateId) {
                var logContext = 'models/shouts.js > model.removeMate()';

                // find the specified mate
                var oMate = this.getMate(mateId);
                // check that the mate does not currently have the shout
                if (oMate.hasShout) {
                    // we throw an error but don't log anything as this is a user error
                    throw new Error(L('shouts_give_the_next_shout_to_someone_else_first'));
                }
                // remove mate from model
                var aMates = this.getMates();
                var aMatesWithout = _.without(aMates, oMate);
                this.set('mates', aMatesWithout);
            },
            addMate : function(oMate) {
                var logContext = 'models/shouts.js > model.addMate()';

                // add to member array keeping track of mates
                var aMates = this.getMates();
                // if this will be the first mate, they have the shout by default
                if (aMates.length === 0) {
                    oMate.hasShout = true;
                    this.set('name', oMate.name);
                }
                if (!oMate.mateId) {
                    oMate.mateId = this.getNextMateId();
                }
                aMates.push(oMate);
                // update shout model
                this.set('mates', aMates);

                // check if new mate has the shout
                if (oMate.hasShout) {
                    this.giveMateTheShout(oMate.mateId);
                }
                return oMate;
            },
            getMates : function() {
                return this.get('mates') || [];
            },
            getMate : function(mateId) {
                var logContext = 'models/shouts.js > model.getMate()';

                // find the specified mate
                var aMates = this.getMates();
                var oMate = _.findWhere(aMates, {
                    mateId: mateId
                });
                if (!oMate) {
                    log.error(String.format('Mate with id %s not found!', mateId), logContext);
                    throw new Error(L('shouts_could_not_find_mate'));
                } else {
                    return oMate;
                }
            },
            getShouter : function() {
                var logContext = 'models/shouts.js > model.getShouter()';

                // find the mate that currently has the shout
                var oMate = _.findWhere(this.getMates(), {
                    hasShout: true
                });
                if (!oMate) {
                    log.error(L('shouts_could_not_find_shouter'), logContext);
                    throw new Error(L('shouts_could_not_find_shouter'));
                } else {
                    return oMate;
                }
            },
            giveMateTheShout : function(mateId) {
                var logContext = 'models/shouts.js > model.giveMateTheShout()';

                var oReturn = {
                    oldShouterId : null,
                };
                // find the specified mate
                var oNewShouter = this.getMate(mateId);
                // if the mate already has the shout there is nothing for us to do here
                var aMates = this.getMates();
                if (oNewShouter.hasShout) {
                    oReturn.oldShouterId = oNewShouter.mateId;
                    oReturn.oldShouterIndex = _.indexOf(aMates, oNewShouter);
                    log.debug('new shouter already has the shout: ' + oNewShouter.name, logContext);
                    return oReturn;
                }

                // unmark previous shouter
                var oOldShouter = this.getShouter();
                oReturn.oldShouterId = oOldShouter.mateId;
                oReturn.oldShouterIndex = _.indexOf(aMates, oOldShouter);

                // switch the shout over
                oOldShouter.hasShout = false;
                oNewShouter.hasShout = true;
                oNewShouter.isInactive = false; // automatically activate mate if giving the shout
                log.debug('unmarked previous shouter: ' + oOldShouter.name, logContext);
                log.debug('marked new shouter: ' + oNewShouter.name, logContext);

                // update the model
                this.set('mates', aMates);
                // set the shout name based on the new shouter
                this.set('name', oNewShouter.name);
                log.debug('model after switching shouts:', logContext);
                log.debug(this.toJSON(), logContext);

                return oReturn;
            },
            calcShoutCost : function(bIncludeShouter) {
                var logContext = 'models/shouts.js > model.calcShoutCost()';

                var aMates = this.getMates();
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
                var logContext = 'models/shouts.js > model.updateShouterBalance()';

                var aMates = this.getMates();
                // calculate cost to the shouter
                var shoutCost = this.calcShoutCost();
                // add cost to shouters balance
                var oShouter = this.getShouter();
                oShouter.balance = (oShouter.balance || 0) + shoutCost;
                // subtract price from each mates balance
                _.each(aMates, function(oMate) {
                    if (!oMate.isInactive && oMate !== oShouter) {
                        oMate.balance = (oMate.balance || 0) - oMate.price;
                    }
                });
                // find next to shout and swap the shout
                var oNextToShout = _.min(aMates, function(oMate) {
                    return (Number(oMate.balance) || 0);
                });
                return oNextToShout;
            },
            save : function(options) {
                var logContext = 'models/shouts.js > save()';

                options = options ? _.clone(options) : {};
                log.debug('saving...' + (options ? ' with options: ' + JSON.stringify(options) : ''), logContext);
                log.debug(this, logContext);
                return Backbone.Model.prototype.save.call(this, options);
            },
        });

        return Model;
    },
    extendCollection : function(Collection) {
        'use strict';

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
                // mark the new model as favourite and unmark all others
                _.each(this.models, function(mShout) {
                    if (mShout.id === mFavShout.id && !mShout.get('isFav')) {
                        mShout.set('isFav', true);
                        mShout.save();
                    } else if (mShout.get('isFav')) {
                        mShout.set('isFav', false);
                        mShout.save();
                    }
                });
            },
        });

        return Collection;
    }
};

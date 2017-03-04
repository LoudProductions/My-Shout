exports.definition = {
    config: {

        adapter: {
            type: "properties",
            collection_name: "purchases"
        }
    },
    extendModel: function(Model) {
        "use strict";

        _.extend(Model.prototype, {
            // extended functions and properties go here
            validate: function(bNoFix) {
                var logContext = "models/purchases.js > validate()";

                // check all keys actually exist
                var oPurchase = this.toJSON();
                Log.debug("validating purchase model:", logContext);
                Log.debug(oPurchase, logContext);

                var bDidChange = false;
                if (!_.has(oPurchase, "productID")) {
                    bDidChange = true;
                    oPurchase.productID = "";
                }
                if (!_.has(oPurchase, "quantity")) {
                    bDidChange = true;
                    oPurchase.quantity = 0;
                }
                // now check that we have acceptable values for each
                if (!oPurchase.productID) {
                    Log.error(L("purchase_id_is_required"), logContext);
                    throw new Error(L("purchase_id_is_required"));
                }
                if (!bNoFix && bDidChange) {
                    Log.debug("model changed as a result of validation:", logContext);
                    Log.debug(oPurchase, logContext);
                    this.set(oPurchase);
                }
            },
            save: function(options) {
                var logContext = "models/purchases.js > save()";

                // model.validate() is called in standard save() handling...

                options = options ? _.clone(options) : {};
                Log.debug("saving..." + (options ? " with options: " + JSON.stringify(options) : ""), logContext);
                Log.debug(this, logContext);
                return Backbone.Model.prototype.save.call(this, options);
            },
        });

        return Model;
    },
    extendCollection: function(Collection) {
        "use strict";

        _.extend(Collection.prototype, {
            // extended functions and properties go here

            // For Backbone v1.1.2, uncomment the following to override the
            // fetch method to account for a breaking change in Backbone.
            fetch: function(options) {
                options = options ? _.clone(options) : {};
                options.reset = true;
                return Backbone.Collection.prototype.fetch.call(this, options);
            },
            didNotYetSaveNoAds: function() {
                if (!this.findWhere({
                        productID: Alloy.CFG.products.noAds
                    })) {
                    return true;
                } else {
                    return false;
                }
            },
            didPurchaseNoAds: function() {
                if (this.findWhere({
                        productID: Alloy.CFG.products.noAds,
                        quantity: 1
                    })) {
                    return true;
                } else {
                    return false;
                }
            },
            purchaseNoAds: function(quantity, noInAppPurchase) {
                var mPurchase = this.findWhere({
                    productID: Alloy.CFG.products.noAds
                });
                if (!mPurchase) {
                    var oPurchase = {
                        productID: Alloy.CFG.products.noAds,
                        quantity: quantity
                    };
                    // add purchase to collection
                    mPurchase = this.add(oPurchase);
                }
                if (quantity === 1 && !noInAppPurchase) {
                    // TODO: integrate in-app purchases
                }
                mPurchase.set("quantity", quantity);
                mPurchase.save();
                return mPurchase;
            }
        });

        return Collection;
    }
};

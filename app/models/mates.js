exports.definition = {
	config: {

		adapter: {
			type: "properties",
			collection_name: "mates"
		}
	},
	extendModel: function(Model) {
		_.extend(Model.prototype, {
			// extended functions and properties go here
			validate : function(bNoFix) {
				var logContext = "models/mates.js > validate()";

				// check all keys actually exist
				var oMate = this.toJSON();
				Log.debug("validating mate model:", logContext);
				Log.debug(oMate, logContext);

				var bDidChange = false;
				if (!_.has(oMate, "name")) {
					bDidChange = true;
					oMate.name = "";
				}
				if (!_.has(oMate, "poison")) {
					bDidChange = true;
					oMate.poison = "";
				}
				if (!_.has(oMate, "price")) {
					bDidChange = true;
					oMate.price = 0;
				}
				if (!_.has(oMate, "balance")) {
					bDidChange = true;
					oMate.balance = 0;
				}
				if (!_.has(oMate, "hasShout")) {
					bDidChange = true;
					oMate.hasShout = false;
				}
				if (!_.has(oMate, "isInactive")) {
					bDidChange = true;
					oMate.isInactive = false;
				}
				// now check that we have acceptable values for each
				if (!oMate.name) {
					Log.error(L("mate_name_is_required"), logContext);
					throw new Error(L("mate_name_is_required"));
				}
				// check/format price
				var sPrice = isNaN(oMate.price) ? Number(0).toFixed(2) : Number(oMate.price).toFixed(2);
				if (oMate.price !== sPrice) {
					bDidChange = true;
					oMate.price = sPrice;
				}
				if (!bNoFix && bDidChange) {
					Log.debug("model changed as a result of validation:", logContext);
					Log.debug(oMate, logContext);
					this.set(oMate);
				}
			},
			save : function(options) {
					var logContext = "models/mate.js > save()";

					// validate model first
					this.validate();

					options = options ? _.clone(options) : {};
					Log.debug("saving..." + (options ? " with options: " + JSON.stringify(options) : ""), logContext);
					Log.debug(this, logContext);
					return Backbone.Model.prototype.save.call(this, options);
			},
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			// extended functions and properties go here

			// For Backbone v1.1.2, uncomment the following to override the
			// fetch method to account for a breaking change in Backbone.
			fetch: function(options) {
				options = options ? _.clone(options) : {};
				options.reset = true;
				return Backbone.Collection.prototype.fetch.call(this, options);
			}
		});

		return Collection;
	}
};

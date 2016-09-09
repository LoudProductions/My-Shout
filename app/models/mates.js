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
				// check all keys actually exist
				var oMate = this.toJSON();
				log.debug('validating mate model:');
				log.debug(oMate);

				if (!_.has(oMate, 'name')) {
					oMate.name = '';
				}
				if (!_.has(oMate, 'poison')) {
					oMate.poison = '';
				}
				if (!_.has(oMate, 'price')) {
					oMate.price = 0;
				}
				if (!_.has(oMate, 'balance')) {
					oMate.balance = 0;
				}
				if (!_.has(oMate, 'hasShout')) {
					oMate.hasShout = false;
				}
				if (!_.has(oMate, 'isInactive')) {
					oMate.isInactive = false;
				}
				// now check that we have acceptable values for each
				if (!oMate.name) {
					log.error(L('mate_name_is_required'), 'models/mates.js > validate()');
					throw new Error(L('mate_name_is_required'));
				}
				oMate.price = isNaN(oMate.price) ? Number(0).toFixed(2) : Number(oMate.price).toFixed(2);
				if (!bNoFix) {
					this.set(oMate);
				}
			}
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

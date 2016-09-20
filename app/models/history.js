exports.definition = {
	config: {

		adapter: {
			type: "properties",
			collection_name: "history"
		}
	},
	extendModel: function(Model) {
		'use strict';

		_.extend(Model.prototype, {
			transform : function() {
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
			undoShout: function() {
				var logContext = 'models/history.js > model.undoShout()';

				var mShout = Alloy.Collections.instance('shouts').get(this.get('shoutId'));
				if (!mShout) {
						log.error(String.format('Shout with id %s not found!', this.get('shoutId')), logContext);
						throw new Error(L('history_could_not_find_shout'));
				}

				// undo the shout
				mShout.undoShout(this.get('mates'));
				mShout.save();
			},
		});

		return Model;
	},
	extendCollection: function(Collection) {
		'use strict';

		_.extend(Collection.prototype, {
			// extended functions and properties go here
			archiveShout: function(mShout) {
				var logContext = 'models/history.js > archiveShout()';

				// first create a deep copy of the shout object, so we don't
				// inadvertently manipulate the archived shout contents
				var oArchivedShout = _.extend({
					shoutId: mShout.id,
					shoutAt: Date.now(),
				}, _.omit(_.clone(mShout.toJSON()), 'id'));
				// we now have a shallow copy of the shout, but need to copy each mate also
				oArchivedShout.mates = _.map(oArchivedShout.mates, function(oMate) {
					return _.clone(oMate);
				});
				log.debug('archiving shout:', logContext);
				log.debug(oArchivedShout, logContext);

				// add shout to history
				var mHistory = this.add(oArchivedShout);
				mHistory.save();
				return mHistory;
			},
			getShoutHistory: function(shoutId, since) {
				if (this.length === 0) {
						this.fetch();
				}
				if (since) {
					return this.filter(function(oHistory) {
						return oHistory.shoutId === shoutId && shoutAt >= since;
					});
				} else {
					return this.where({
						shoutId: shoutId
					});
				}
			},
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

var _animateOutOnComplete = false;
var _animationComplete = false;
var _callback;

/**
 * self-executing function to organize otherwise inline constructor code
 * @param  {Object} args arguments passed to the controller
 */
(function(args) {

    // Use strict mode for this function scope. We can't do this for all of the
    // controller because after Alloy has compiled all of this file is wrapped.
    // FIXME: https://jira.appcelerator.org/browse/ALOY-1263
    'use strict';

    /**
     * End intro once animation has completed
     * @param {Object} callback
     */
    $.endIntro = function(callback) {
        'use strict';

// temp: skip intro
callback();
return;

        _callback = callback;
        _animateOutOnComplete = true;
        if (_animationComplete) {
            animateOut();
        }
    };

    /**
     * window open
     */
    $.window.addEventListener('open', init);

})(arguments[0] || {});

/**
 * Init, called on window open event
 */
function init() {
    'use strict';

    $.window.removeEventListener('open', init);

// temp: skip animation
return;

    var animation = Ti.UI.createAnimation({
        backgroundColor: Alloy.CFG.colors.backgroundColor,
        duration : 100
    });
    animation.addEventListener('complete', function(e) {
        'use strict';
        var animation = Ti.UI.createAnimation({
            transform: Ti.UI.create2DMatrix({rotate: -160}),
            // transform : Ti.UI.create2DMatrix({
                // rotate : -160,
                // anchorPoint : {
                    // x : 0.5,
                    // y : 0.5
                // }
            // }),
            curve : Ti.UI.ANIMATION_CURVE_EASE_IN,
            duration : 1000
        });
        animation.addEventListener('complete', function(e) {
            'use strict';
            var animation = Ti.UI.createAnimation({
                transform : Ti.UI.create2DMatrix({
                    rotate : 11.3
                }),
                duration : 200
            });
            animation.addEventListener('complete', function(e) {
                'use strict';
                _animationComplete = true;
                if (_animateOutOnComplete) {
                    animateOut();
                } else {
                    $.activity_indicator.show();
                }
            });
            $.my_shout_circle.animate(animation);
        });
        $.my_shout_circle.animate(animation);
    });
    $.window.animate(animation);

}

/**
 * Animate out content and callback
 */
function animateOut() {
    'use strict';
    $.activity_indicator.hide();

    var animation = Ti.UI.createAnimation({
        transform : Ti.UI.create2DMatrix({
            scale : 0.7
        }),
        opacity : 0,
        duration : 1000
    });
    animation.addEventListener('complete', _callback);
    $.window.animate(animation);
}

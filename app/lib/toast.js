exports.show = function(message, options) {
    var oToast;
    var oParams = _.extend({
        message : message
    }, options);
    if (OS_ANDROID) {
        // ensure sensible defaults
        oParams.duration = oParams.duration  || Ti.UI.NOTIFICATION_DURATION_LONG;
        oToast = Ti.UI.createNotification(oParams);
    } else {
        oToast = Ti.UI.createAlertDialog(oParams); 
    }
    oToast.show();
};
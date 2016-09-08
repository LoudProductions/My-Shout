function formatForLogging(thingToLog) {
    var formattedThing = '';
    if (_.isUndefined(thingToLog)) {
        return 'Undefined thingToLog!';
    }
    // first try to convert the thing to log into a string
    try {
        if (_.isObject(thingToLog)) {
            if (_.isFunction(thingToLog)) {
                formattedThing = thingToLog.name ? thingToLog.name : '';
            } else {
                // if we have an object or an array, JSON can serialize it OK
                formattedThing = JSON.stringify(thingToLog);
            }
        } else {
            formattedThing = String(thingToLog);
        }
    } catch(error) {
        formattedThing = 'Ooh, thingToLog cannot be converted to a string!';
    }
    return formattedThing;
}

/**
 * config.json (Alloy.CFG) is checked for logging configuration to determine how to contextualise the message
 */
function contextualiseLogMessage(logMessage, callingContext) {
    if (Alloy.CFG.logging && Alloy.CFG.logging.mustShowCallingContext && callingContext) {
        var formattedContext = formatForLogging(callingContext);
        logMessage = ( formattedContext ? formattedContext + ': ' : '') + logMessage;
    }
    if (Alloy.CFG.logging && Alloy.CFG.logging.mustShowDate) {
        logMessage = new Date() + ': ' + logMessage;
    }
    return logMessage;
}

/**
 * alias for Titanium.API.error that checks for safe string conversion with optional contextualisation of the log message
 * @param {Object} thingTolog
 * @param {Object} callingContext
 */
exports.error = function(thingTolog, callingContext) {
    if (!callingContext) {
        // callingContext = this.error.caller;  // cannot use .caller in strict mode
    }
    Titanium.API.error(contextualiseLogMessage(formatForLogging(thingTolog), callingContext));
};
/**
 * alias for Titanium.API.warn that checks for safe string conversion with optional contextualisation of the log message
 * @param {Object} thingTolog
 * @param {Object} callingContext
 */
exports.warn = function(thingTolog, callingContext) {
    if (!callingContext) {
        // callingContext = this.warn.caller;  // cannot use .caller in strict mode
    }
    Titanium.API.warn(contextualiseLogMessage(formatForLogging(thingTolog), callingContext));
};
/**
 * alias for Titanium.API.info that checks for safe string conversion with optional contextualisation of the log message
 * @param {Object} thingTolog
 * @param {Object} callingContext
 */
exports.info = function(thingTolog, callingContext) {
    if (!callingContext) {
        // callingContext = this.info.caller;  // cannot use .caller in strict mode
    }
    Titanium.API.info(contextualiseLogMessage(formatForLogging(thingTolog), callingContext));
};
/**
 * alias for Titanium.API.debug that checks for safe string conversion with optional contextualisation of the log message
 * @param {Object} thingTolog
 * @param {Object} callingContext
 */
exports.debug = function(thingTolog, callingContext) {
    if (!callingContext) {
        // callingContext = this.debug.caller;  // cannot use .caller in strict mode
    }
    Titanium.API.debug(contextualiseLogMessage(formatForLogging(thingTolog), callingContext));
}; 
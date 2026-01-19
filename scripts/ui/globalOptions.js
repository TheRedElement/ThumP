/**globalOptions.js */

/**imports */

/**definitions */
/**
 * - function to get all global settings set in the UI
 * @returns {Object} globalOptions
 *  - current values global options
 *  - key: html element id
 *  - value: html element value
 */
export function getGlobalOptions() {
    let globalOptionsElements = document.getElementsByClassName("global-option");
    const globalOptions = {};
    for (const element of globalOptionsElements) {
        globalOptions[element.id] = element.value;
    };
    return globalOptions
}

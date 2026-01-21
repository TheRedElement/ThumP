/**globalSelections.js */

/**imports */


/**definitions */
/**
 * - updates state of all matching HTMLElements 
 * @param {HTMLElement} element
 *  - element that triggered the function
 *  - used to obtain
 *      - state for the update 
 *      - subset of selectors to update
 */
export function selectAll(element) {
    const state = element.checked;      //get current state of checkbox
    const kind = element.classList[1];  //get kind of selection

    //get relevant selector elements
    const gridSelectors = document.getElementsByClassName(`select-object ${kind}`);
    
    //update relevant selector instances
    for (const selector of gridSelectors) {
        selector.checked = state;
    };
}
/**definitions */
/**
 * - updates state of all matching HTMLElements 
 * @param {HTMLElement} element
 *  - element that triggered the function
 *  - used to obtain
 *      - state for the update 
 *      - subset of selectors to update
 */
export function invertSelection(element) {
    const state = element.checked;      //get current state of checkbox
    const kind = element.classList[1];  //get kind of selection

    //get relevant selector elements
    const gridSelectors = document.getElementsByClassName(`select-object ${kind}`);
    
    //update relevant selector instances
    for (const selector of gridSelectors) {
        selector.checked = (!selector.checked);
    };
}

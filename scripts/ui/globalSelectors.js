/**globalSelections.js */

/**imports */
import { downloadArrAsCsv } from "../utils.js";
import { getGlobalOptions } from "./globalOptions.js";

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

/**
 * function to export all selected objects into tables
 */
export function exportSelection() {
    //get relevant selector elements
    for (const kind of ["good", "bad", "ugly"]) {
        const gridSelectors = document.getElementsByClassName(`select-object ${kind}`);
        let selectionArr = [];
        for (const selector of gridSelectors) {
            selectionArr.push([
                selector.dataset["objectId"],
            ]);
        };
        downloadArrAsCsv(selectionArr, `${kind}`)
    }
}
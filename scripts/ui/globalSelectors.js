/**globalSelections.js */

/**imports */
import { METADATA } from "../base/base.js";
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
    const objClassification = document.querySelectorAll("input[name='select-object']:checked");  //get all selected objects

    //init output array with column header
    let objClass = [
        ["object_id", "class"]
    ];  //array for object classes

    //add respective objects to their selected class
    for (const obj of objClassification) {
        objClass.push(
            [obj.dataset["objectId"], obj.value]
        )
    };
    downloadArrAsCsv(objClass, `thump_classification_${METADATA["sessionId"]}`)
}

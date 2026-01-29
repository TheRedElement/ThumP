/**base.js
 * defines global constants and objects relevant on EVERY page
 */

export const BASEPATH = "https://theredelement.github.io/ThumP/";             //for deployment (github pages only)
// export const BASEPATH = "/";                                           //for dev

export const THUMBNAILS = {};   //object holding all thumbnails
export const METADATA = {};     //other metadata required for execution
export const colorScales = {    //custom color scales
    TRE: `[[0.0, "#330000"],[0.5, "#C80000"],[1.0, "#ffffff"]]`,
    Fink: `[[0.0, "#15284F"],[0.5, "#3C8DFF"],[1.0, "#D5D5D3"]]`,
};
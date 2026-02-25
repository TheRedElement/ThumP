/**base.js
 * defines global constants and objects relevant on EVERY page
 */

export const BASEPATH = "thump.lukassteinwender.com";           //for deployment (github pages only)
// export const BASEPATH = "/";                                 //for dev

export const THUMBNAILS = {};   //object holding all thumbnails
export const METADATA = {};     //other metadata required for execution
export const colorScales = {    //custom color scales
    TRE: `[[0.0, "hsl(0,0%,95%)"],[0.3, "hsl(0,0%,75%)"],[0.8, "hsl(0,0%,30%)"],[0.9, "hsl(0,100%,22%)"],[1.0, "hsl(0,100%,15%)"]]`,
    TRE_dark: `[[0.0, "hsl(0,0%,5%)"],[0.3, "hsl(0,0%,25%)"],[0.8, "hsl(0,0%,70%)"],[0.9, "hsl(0,100%,22%)"],[1.0, "hsl(0,100%,15%)"]]`,
    Fink: `[[0.0, "#15284F"],[0.5, "#3C8DFF"],[1.0, "#D5D5D3"]]`,
};
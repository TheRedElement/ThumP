
export function reshapeArr(arr, shape) {
    const [nRows, nCols] = shape;
    let outArr = []

    while (arr.length) {
        outArr.push(arr.splice(0, nCols));
    };
    return outArr
}

export function randInt(min, max) {
  min = Math.ceil(min);     //deal with non-int input
  max = Math.floor(max);    //deal with non-int input
  return Math.floor(Math.random() * (max - min + 1)) + min; // The maximum is inclusive and the minimum is inclusive
}

/**
 * computes cartesian product of `arrays`
 * @param  {...any} arrays 
 * @returns 
 */
function cartesian(...arrays) {
  return arrays.reduce(
        (acc, curr) =>
            acc.flatMap(x => curr.map(y => [...x, y])),
        [[]]
  );
}

/**
 * log of base `n`
 * @param {*} n 
 * @param {*} x 
 * @returns 
 */
function logN(x, n) {
    return Math.log(x) / Math.log(n);
}

/**
 * - function to load some preset
 * @param {String} preset
 *  - arg, required
 *  - name of the preset to be loaded
 *  - will be used to load the respective preset file 
 * @returns {Object} presetJSON
 *  - json representation of the preset
 */
export async function loadJSON(path) {
    try {

        const response = await fetch(path);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // const json = await response.json();
        // return json;
        return response.json()
    } catch (error) {
        console.error("Error fetching preset:", error);
        throw error
    }
}

/**
 * - downloads `arr` as `exportName.csv`
 * @param {Array} arr
 *  - data to be downloaded 
 * @param {String} exportName 
 *  - filename of the downloaded file
 * @param {Array} comments
 *  - comments to be  added above the header
 */
export function downloadArrAsCsv(arr, exportName, comments=[]){

    //define download link
    let csvContent = comments.join("\n") + "\n"
        + arr.map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);

    //encode to enable download in correct format
    csvContent = encodeURI(csvContent);
    
    //create temporary <a> element
    let downloadAnchorNode = document.createElement("a");
    // downloadAnchorNode.setAttribute("href",     csvContent);
    downloadAnchorNode.setAttribute("href",     url);
    downloadAnchorNode.setAttribute("download", exportName + ".csv");
    document.body.appendChild(downloadAnchorNode);  //required for firefox
    
    //init download
    downloadAnchorNode.click();
    
    //remove temporary <a> element
    downloadAnchorNode.remove();
}

/**definitions */
/**
 * - function to download a json object from the browser
 * @param {Object} exportObj 
 * @param {String} exportName 
 */
export function downloadObjectAsJson(exportObj, exportName){

    //define download link
    let dataStr = "data:text/json;charset=utf-8," + 
        encodeURIComponent(
            JSON.stringify(exportObj, null, 2)
        );
    
    //create temporary <a> element
    let downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode);  //required for firefox
    
    //init download
    downloadAnchorNode.click();
    
    //remove temporary <a> element
    downloadAnchorNode.remove();
}

/**
 * function to show a custom error message and highlight the faulty html element 
 * @param {HTMLElement} element 
 *  - element that caused the error
 * @param {*} message 
 *  - message to displace
 * @param {*} duration 
 *  - for how long to highlight the element
 */
export function showError(element, message, duration = 2000) {
    alert(message);                             //display error
    element.classList.add("error-highlight");   //highlight faulty element

    //remove highlight  
    setTimeout(() => {
        element.classList.remove("error-highlight");
    }, duration);
}

/**
 * - returns a sequence with length `num` of consecutive characters found in `options`
 * @param {Int} num 
 *  - number of consecutive elements to generate
 * @param {String} options
 *  - optional
 *  - options to use for generating the sequence
 *  - will iterate through `options` and append new characters when needed
 *  - the default is `"abcdefghijklmnopqrstuvwxyz"`
 *      - will result in
 *          - num < 26: ["a", "b", "c", "d", ...]
 *          - 26 < num < 26^2: ["aa", "ab", "ac", "ad", ..., "ba", "bb", ...]
 *          - 26^2 < num < 26^3: ["aaa", "aab", "aac", "aad", ..., "baa", "bab", ...]
 *          - etc.
 * @returns {Array[String]} sequence
 *  - generated sequence
 */
export function abcRange(num, options="abcdefghijklmnopqrstuvwxyz") {
    const nOptions = options.length;
    
    const nChars = Math.ceil(logN(num, nOptions)); //number of characters to use
    const sequence = cartesian(...Array(nChars).fill(options.split(""))).map(e => e.join(""));

    return sequence.splice(0, num);
}
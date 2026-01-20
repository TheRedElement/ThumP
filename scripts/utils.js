
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
 */
export function downloadArrAsCsv(arr, exportName){

    //define download link
    let csvContent = "data:text/csv;charset=utf-8,"
        + arr.map(e => e.join(",")).join("\n");

    //encode to enable download in correct format
    csvContent = encodeURI(csvContent);
    
    //create temporary <a> element
    let downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href",     csvContent);
    downloadAnchorNode.setAttribute("download", exportName + ".csv");
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
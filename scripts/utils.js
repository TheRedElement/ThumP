
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
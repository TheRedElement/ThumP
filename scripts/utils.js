
export function reshapeArr(arr, shape) {
    const [nRows, nCols] = shape;
    let outArr = []
    
    while (arr.length) {
        outArr.push(arr.splice(0, nCols));
    };
    return outArr
}
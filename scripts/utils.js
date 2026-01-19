
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

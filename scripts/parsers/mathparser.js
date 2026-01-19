/**mathparser.js */

/**imports */


/**definitions */
/**
 * function to evaluate a string `expr` if it contains a mathematical meaning
 * @param {*} expr 
 *  - expression to evaluate
 * @returns {Number} expr
 *  - value of the evaluated expression
 */
export function parseMath(expr, evalKwargs={}) {
    const { Parser } = exprEval;
    
    //define parser for math expressions
    const mathParser = new Parser({
        operators: {
            logical: false,
            comparison: false,
            assignment: false,
        }
    });

    if (typeof(expr) === "string") {
        return mathParser.parse(expr).evaluate(evalKwargs);
    }
    return expr
}
/**mosaicGrid.js */

/**imports */
// import * as arrFunctions from "https://cdn.jsdelivr.net/gh/TheRedElement/LuStCodeSnippets@dev/lustCodeSnippets_js/arrFunctions.js"
// import { loadJSON, randInt, reshapeArr } from "../utils.js"
import { getGlobalOptions } from "./globalOptions.js";
import { parseMath } from "../parsers/mathparser.js";
import { colorScales, THUMBNAILS } from "../base/base.js";
import { abcRange, generateColorWay } from "../utils.js";

/**constants */
const resizeObservers = [];

/**definitions */
/**
 * - plots `img` in `thumbnailElement` 
 * @param {Array} img
 *  - 2d-array
 *  - image to be displayed in a heatmap 
 * @param {HTMLElement} thumbnailElement 
 *  - element that contains the `img`
 *  - can be styled in `css`
 * @param {Object} layout 
 *  - layout to use for plotly when creating the plot
 * @param {Object} config
 *  - config to use in plotly when creating the plot 
 * @param {Object} globalOptions
 *  - kwargs, optional
 *  - global options extracted from the UI input
 */
export function plotImg(img, thumbnailElement, layout, config, {
    globalOptions={colwidth: 100, rowheight: 100, zmin: "", zmax: ""},
    } = {}) {
    
    //get ID
    const plotlyId = thumbnailElement.id.replace("thumbnail", "plotly");

    //create a plotly wrapper (for global formatting)
    const plotlyPlotWrapper = document.createElement("div");
    plotlyPlotWrapper.classList = ["plotly-wrapper"];
    plotlyPlotWrapper.style.setProperty("width", `${globalOptions["colwidth"]}px`);
    plotlyPlotWrapper.style.setProperty("height", `${globalOptions["rowheight"]}px`);
    thumbnailElement.appendChild(plotlyPlotWrapper);

    //create the actual plot
    const plotlyPlot = document.createElement("div");
    plotlyPlot.classList = ["plotly-plot"];
    plotlyPlot.id = plotlyId;
    plotlyPlotWrapper.appendChild(plotlyPlot);
    
    //define trace
    let traces = [
        {
            z: img,
            type: "heatmap",
            showscale: false,
        },
    ];
    Plotly.newPlot(plotlyPlot, traces, layout, config);

    //resize plots after build to ensure all plots are contained in cells
    let ro = new ResizeObserver(() => {
        Plotly.Plots.resize(plotlyPlot);
    });
    ro.observe(plotlyPlotWrapper);
    resizeObservers.push(ro);
}

/**
 * - function to fill the grid of thumbnails
 * @param {Boolean} redraw
 *  - kwarg, optional
 *  - whether to redraw the entire grid from scratch
 *      - removes all children before adding new ones
 *  - the default is `false`
 */
export function fillGrid({
    redraw = false,
    } = {}) {

    const globalOptions = getGlobalOptions();
    
    //setup for placeholder mesh
    // const nObj = 10;    //number of placeholder objects to create
    // const resH = 10;     //resolution of placeholder mesh (height)
    // const resW = 10;     //resolution of placeholder mesh (width)
    
    const mosaicElement = document.getElementById("thumbnail-mosaic");
    const mosaicGrid = mosaicElement.getElementsByClassName("mosaic-grid")[0];
    
    if (redraw) {
        mosaicGrid.replaceChildren();       //clear children
        for (const ro of resizeObservers) {
            ro.disconnect();                //clear resize observers (prevents memory leaks)
        };
    };

    //plotly setup
    const layout = {
        autosize: true,
        margin: {
            l: 1,
            r: 1,
            t: 1,
            b: 1,
        },
        xaxis: {
            showticklabels: false,
            visible: false,
        },
        yaxis: {
            showticklabels: false,
            visible: false,
            scaleanchor: "x",
            scaleratio: 1,
        },
        paper_bgcolor: "#00000000",
        plot_bgcolor: "#00000000",
    };
    const config = {
        responsive: true,
        displayModeBar: false,
    };

    //load data
    const objIds = Object.keys(THUMBNAILS).filter((id) => (!id.startsWith("$")));
    // const nThumbnails = THUMBNAILS[objIds[0]]["thumbnails"].length; //infer number of thumbnails from first entry in `THUMBNAILS`

    const nObj = objIds.length;
    const cellNames = abcRange(nObj)
    for (let i = 0; i < nObj; i++) {
        
        if (objIds[i] === "undefined") {
            //deal with problems in the dataset
            console.warn(`objId for obj ${i} is not defined... ignoring...`)
        } else {

            //get formatting parameters
            let nThumbnails = THUMBNAILS[objIds[i]]["thumbnails"].length; //infer number of thumbnails

            //create grid cell (contains selection checkboxes, plot)
            const cellElement = document.createElement("div");
            cellElement.id = `cell-${i}`;
            cellElement.className = "cell";
            cellElement.style.setProperty("grid-auto-columns", `repeat(${nThumbnails}, minmax(0,1fr))`)
            cellElement.addEventListener("click", event => {
                //listener to enable clicking a cell to cycle through selections
                let selectionCycle = {
                    bad: "maybe",
                    maybe: "good",
                    good: "bad", 
                };
                if (event.target === event.currentTarget) {
                    //ignore if trigger is different than target (only activate if actual element and not its children are clicked )
                    const selectObj = cellElement.querySelectorAll("input[name='select-object']:checked")[0];
                    let curValue = selectObj.value;
                    const radioBtn = cellElement.querySelectorAll(`.select-object.${selectionCycle[curValue]}`)[0]
                    radioBtn.checked = true
                };
            })

            //tooltip
            const tooltip = document.createElement("div");
            tooltip.className = "tooltip";
            tooltip.innerHTML = `
                thumbnail order: ${THUMBNAILS[objIds[i]]["thumbnailTypes"]}
            `
            cellElement.appendChild(tooltip)

            //header
            const cellHeader = document.createElement("div");
            cellHeader.className = "cell-header";
            cellElement.appendChild(cellHeader)

            //cellname
            const cellNameContainer = document.createElement("div");
            cellNameContainer.className = "cell-name";
            cellNameContainer.innerText = cellNames[i];
            cellHeader.appendChild(cellNameContainer)
    
            //selection interface
            const selectionContainer = document.createElement("form");
            selectionContainer.classList = ["selection-container"];
            selectionContainer.id = `selection-container-${i}`;
            for (const kind of ["good", "maybe", "bad"]) {
                const selection = document.createElement("input");
                selection.type = "radio";                           //radio for exclusive selection
                selection.name = [`select-object`];                 //all have the same name (exclusive selection)
                selection.className = [`select-object ${kind}`];
                selection.checked = (kind == "bad");                //all are bad by default
                // selection.checked = Boolean(Math.round(Math.random(),0));    //random selection (for testing)
                selection.value = kind;                             //for determining the quality/category
                selection.dataset["objectId"] = objIds[i];          //for saving the objId
                let auxCols = Object.keys(THUMBNAILS[objIds[i]]);
                auxCols = auxCols.filter(c => (!["objectId","thumbnails","thumbnailTypes"].includes(c)))
                for (const auxCol of auxCols) {
                    selection.dataset[auxCol] = THUMBNAILS[objIds[i]][auxCol];
                }
                selectionContainer.appendChild(selection);
            }
            cellHeader.appendChild(selectionContainer);
            
            //label
            const labelElement = document.createElement("a");
            labelElement.textContent = objIds[i];
            labelElement.href = THUMBNAILS[objIds[i]]["link"];
            labelElement.target = "_blank";     //open in new tab/window
            cellHeader.appendChild(labelElement);

            //add thumbnails (plots)
            const thumbnailContainer = document.createElement("div");
            thumbnailContainer.className = "thumbnail-container";
            thumbnailContainer.style.setProperty("grid-auto-columns", `repeat(${nThumbnails}, minmax(0,1fr))`)

            for (let thi = 0; thi < nThumbnails; thi++) {
                //get current thumbnail
                let img = THUMBNAILS[objIds[i]]["thumbnails"][thi];
                
                const thumbnailElement = document.createElement("div");
                thumbnailElement.id = `thumbnail-${i}-${thi}`;
                thumbnailElement.classList = ["thumbnail"];
                thumbnailElement.dataset["objectId"] = objIds[i];   //save to have reference into `THUMBNAILS` for retrieving original data
                thumbnailElement.dataset["thumbnailId"] = thi;      //save to have reference into `THUMBNAILS` for retrieving original data
                thumbnailContainer.appendChild(thumbnailElement);
    
                // //generate placeholder data
                // let imgW = randInt(resW-5, resW+5); //thumbnail sizes can change across thumbnails
                // let imgH = randInt(resH-5, resH+5); //thumbnail sizes can change across thumbnails
                // // let img = arrFunctions.randomNormal({num: imgW*imgH});
                // let img = arrFunctions.linspace(-imgW*imgH/2,imgW*imgH/2,imgW*imgH)
                // img = reshapeArr(img, [imgW,imgH]);
    
                //plot thumbnail
                plotImg(img, thumbnailElement, layout, config, {globalOptions: globalOptions})
            };
            cellElement.appendChild(thumbnailContainer);
    
            //add to parent
            mosaicGrid.appendChild(cellElement);
        };
    };
}

/**
 * - makes updates to the global thumbnail-mosaic grid structure
 * - i.e.
 *      - number of rows
 *      - number of columns
 */
export function updateGridGlobal() {
    const globalOptions = getGlobalOptions();
    // console.log(globalOptions)

    //global updates
    const mosaicGrid = document.getElementById("mosaic-grid");
    mosaicGrid.style.setProperty("grid-template-rows", `repeat(${globalOptions["nrows"]}, minmax(0,max-content))`)

    formatGridRowsCols(globalOptions);
}

/**
 * - makes updates to the thumbnail-mosaic grid on a grid-cell-level
 * @param {Boolean} replot
 *  - kwarg, optional
 *  - whether to also redraw the plot
 *  - if `false`
 *      - will only update layout elements
 *  - if `true`
 *      - will also update the actual data seen in the plot
 *  - implemented for ui-reaction efficiency
 *  - the default is `true`
 */
export function updateGridCell({
    replot=true
    } = {}) {
    const globalOptions = getGlobalOptions();
    // console.log(globalOptions)

    //grid-cell updates

    //thumbnails
    const thumbnailElements = document.getElementsByClassName("thumbnail");
    // const plotlyPlots = document.getElementsByClassName("plotly-plot");
    for (const thElement of thumbnailElements) {
        
        //update layout
        thElement.getElementsByClassName("plotly-wrapper")[0].style.setProperty("width", `${globalOptions["colwidth"]}px`);
        thElement.getElementsByClassName("plotly-wrapper")[0].style.setProperty("height", `${globalOptions["rowheight"]}px`);

        //get indices pointing into `THUMBNAILS`
        const objId = thElement.dataset["objectId"];    //indices pointing into `THUMBNAILS`
        const thId = thElement.dataset["thumbnailId"];  //indices pointing into `THUMBNAILS`
        // console.log(objId, thId)

        if (replot) {
            //only update plot-related things if `replot` is specified

            //apply pixel math
            let img = structuredClone(THUMBNAILS[objId]["thumbnails"][thId]);    //original data (copy to not modify original)
            for (let i = 0; i < img.length; i++) {
                const row = img[i];
                for (let j = 0; j < row.length; j++) {
                    img[i][j] = parseMath(globalOptions["pixelmath"], {z: img[i][j]});
                };
            };
    
            //apply updates to traces
            let colorScale = colorScales[globalOptions["colorscale"]];
            colorScale = (colorScale === undefined) ? globalOptions["colorscale"] : colorScale;
            let curColorScale = colorScale.startsWith("[[") ? JSON.parse(colorScale) : colorScale;  //colorscale to use

            // let curColorscale = (globalOptions["colorscale"] === "Fink") ? customScales["csFink"] : globalOptions["colorscale"];
            let traceUpdate = [];     //init update
            let layoutUpdate = {};    //init update
            if (globalOptions["seriestype"] === "heatmap") {
                traceUpdate = [{
                    z: img,
                    colorscale: curColorScale,
                    zmin: (globalOptions["zmin"].length > 0) ? parseFloat(globalOptions["zmin"]) : Math.min(...img.flat()),
                    zmax: (globalOptions["zmax"].length > 0) ? parseFloat(globalOptions["zmax"]) : Math.max(...img.flat()),
                    type: globalOptions["seriestype"],
                    showscale: false,
                }];
                layoutUpdate = {
                    yaxis: {
                        scaleanchor: "x",
                        scaleratio: 1,
                    },                     
                };
            } else {
                traceUpdate = [];    //clear update
                const nSeries = (globalOptions["seriespattern"] === "xy") ? Math.trunc(img.length / 2) : img.length

                let colorWay = generateColorWay(nSeries, curColorScale);

                //fill update
                for (let idx = 0; idx < nSeries; idx++) {
                    let xi = (globalOptions["seriespattern"] === "xy") ? img[idx*2] : undefined;
                    let yi = (globalOptions["seriespattern"] === "xy") ? img[idx*2+1] : img[idx];
                    traceUpdate.push({
                        x: xi,
                        y: yi,
                        ymin: (globalOptions["zmin"].length > 0) ? parseFloat(globalOptions["zmin"]) : Math.min(...img.flat()),
                        ymax: (globalOptions["zmax"].length > 0) ? parseFloat(globalOptions["zmax"]) : Math.max(...img.flat()),            
                        type: "scatter",
                        mode: globalOptions["seriestype"],
                        showlegend: false,
                    });
                };
                layoutUpdate = {
                    colorway: colorWay,
                    yaxis: {
                        scaleanchor: undefined,
                        scaleratio: undefined,
                    },
                };
            };
    
            const plotlyPlot = thElement.getElementsByClassName("plotly-plot")[0];
            Plotly.deleteTraces(plotlyPlot, Array.from(Array(plotlyPlot.data.length).keys()));  //remove all existing traces
            Plotly.addTraces(plotlyPlot, traceUpdate);                                               //add updated versions of traces
            Plotly.relayout(plotlyPlot, layoutUpdate);
            // Plotly.restyle(
            //     plotlyPlot,
            //     update, [0]
            // );
        };
    }

    //cell headers
    const root = document.documentElement;
    root.style.setProperty("--s_ui", globalOptions["uifontsize"]) 
    root.style.setProperty("--s_input", globalOptions["uifontsize"]) 
}

/**
 * - formats entire grid rows and columns
 * @param {Object} globalOptions
 *  - global options of the app 
 */
export function formatGridRowsCols(globalOptions) {
    const nRows = globalOptions["nrows"];
    const highlightEvery = globalOptions["highlightcells"];

    const mosaicGrid = document.getElementById("mosaic-grid");
    const gridCells = mosaicGrid.getElementsByClassName("cell");

    //highlight blocks of n cells
    const nCells = gridCells.length;   //for highlighting block of n cells
    for (let i = 0; i < nCells/highlightEvery; i++) {
        const curCells = [...gridCells].slice(i*highlightEvery,(i+1)*highlightEvery);
        if (i%2 === 0) {
            curCells.map(cell => cell.classList.add("col-highlight"));
        } else {
            curCells.map(cell => cell.classList.remove("col-highlight"));
        };
    };
    
    // //highlight every n-th column
    // for (let i = 0; i < gridCells.length; i++) {
    //     const cell = gridCells[i];
    //     if (i % (highlightEvery*nRows) < nRows){
    //         cell.classList.add("col-highlight");
    //     } else {
    //         cell.classList.remove("col-highlight");
    //     };
    // };
}
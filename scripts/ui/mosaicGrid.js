/**mosaicGrid.js */

/**imports */
// import * as arrFunctions from "https://cdn.jsdelivr.net/gh/TheRedElement/LuStCodeSnippets@dev/lustCodeSnippets_js/arrFunctions.js"
// import { loadJSON, randInt, reshapeArr } from "../utils.js"
import { getGlobalOptions } from "./globalOptions.js";
import { parseMath } from "../parsers/mathparser.js";
import { THUMBNAILS } from "../base/base.js";

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
    plotlyPlotWrapper.style.setProperty("width", `${globalOptions["colwidth"]}px`)
    plotlyPlotWrapper.style.setProperty("height", `${globalOptions["rowheight"]}px`)
    thumbnailElement.appendChild(plotlyPlotWrapper);

    //create the actual plot
    const plotlyPlot = document.createElement("div");
    plotlyPlot.classList = ["plotly-plot"]
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
export async function fillGrid({
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
    const objIds = Object.keys(THUMBNAILS);
    const nThumbnails = THUMBNAILS[objIds[0]]["thumbnails"].length; //infer number of thumbnails from first entry in `THUMBNAILS`

    const nObj = objIds.length;
    for (let i = 0; i < nObj; i++) {
        //create grid cell (contains selection checkboxes, plot)
        const cellElement = document.createElement("div");
        cellElement.id = `cell-${i}`;
        cellElement.classList = ["cell"];
        cellElement.style.setProperty("grid-auto-columns", `repeat(${nThumbnails}, minmax(0,1fr))`)

        //label
        const labelElement = document.createElement("a");
        labelElement.textContent = objIds[i];
        labelElement.href = THUMBNAILS[objIds[i]]["link"];
        cellElement.appendChild(labelElement);

        //ui-elements
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
            selectionContainer.appendChild(selection);
        }
        cellElement.appendChild(selectionContainer);

        //add thumbnails (plots)
        const thumbnailContainer = document.createElement("div");
        thumbnailContainer.className = "thumbnail-container";
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
    mosaicGrid.style.setProperty("grid-template-rows", `repeat(${globalOptions["nrows"]}, minmax(0,1fr))`)
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

    //grid-cell update
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
            let update = {
                z: [
                    img
                ],
                colorscale: [
                    [
                        [0, "#15284F"],
                        [0.5, "#3C8DFF"],
                        [1.0, "#D5D5D3"],
                    ],
                ],
                zmin: (globalOptions["zmin"].length > 0) ? parseFloat(globalOptions["zmin"]) : Math.min(...img.flat()),
                zmax: (globalOptions["zmax"].length > 0) ? parseFloat(globalOptions["zmax"]) : Math.max(...img.flat()),            
            };
    
            const plotlyPlot = thElement.getElementsByClassName("plotly-plot")[0];
            Plotly.restyle(
                plotlyPlot,
                update, [0]
            );
        };
    }
}

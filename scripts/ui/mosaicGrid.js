/**mosaicGrid.js */

/**imports */
import * as arrFunctions from "https://cdn.jsdelivr.net/gh/TheRedElement/LuStCodeSnippets@dev/lustCodeSnippets_js/arrFunctions.js"
import { randInt, reshapeArr } from "../utils.js"
import { getGlobalOptions } from "./globalOptions.js";
import { parseMath } from "../parsers/mathparser.js";

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
    globalOptions={rowwidth: 100, rowheight: 100, zmin: "", zmax: ""},
    } = {}) {
    
    //get ID
    const plotlyId = thumbnailElement.id.replace("thumbnail", "plotly");

    //create a plotly wrapper (for global formatting)
    const plotlyPlotWrapper = document.createElement("div");
    plotlyPlotWrapper.classList = ["plotly-wrapper"];
    plotlyPlotWrapper.style.setProperty("width", `${globalOptions["rowwidth"]}px`)
    plotlyPlotWrapper.style.setProperty("height", `${globalOptions["rowheight"]}px`)
    thumbnailElement.appendChild(plotlyPlotWrapper);

    //create the actual plot
    const plotlyPlot = document.createElement("div");
    plotlyPlot.classList = ["plotly-plot"]
    plotlyPlot.id = plotlyId;
    plotlyPlotWrapper.appendChild(plotlyPlot);
    

    //apply pixel math
    for (let i = 0; i < img.length; i++) {
        const row = img[i];
        for (let j = 0; j < row.length; j++) {
            img[i][j] = parseMath(globalOptions["pixelmath"], {x: img[i][j]});
        };
    };

    //define trace
    let traces = [
        {
            z: img,
            type: "heatmap",
            showscale: false,
            colorscale: "Viridis",
            zmin: (globalOptions["zmin"].length > 0) ? parseFloat(globalOptions["zmin"]) : Math.min(...img.flat()),
            zmax: (globalOptions["zmax"].length > 0) ? parseFloat(globalOptions["zmax"]) : Math.max(...img.flat()),
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
 * @param {Int} nThumbnails
 *  - kwarg, optional
 *  - number of thumbnails per grid cell
 *  - the default is `3`
 * @param {Boolean} redraw
 *  - kwarg, optional
 *  - whether to redraw the entire grid
 *      - removes all children before adding new ones
 *  - the default is `true`
 */
export function fillGrid({
    nThumbnails = 3,
    redraw = false,
    } = {}) {

    const globalOptions = getGlobalOptions();
    
    //setup for placeholder mesh
    const nObj = 10;    //number of placeholder objects to create
    const resH = 10;     //resolution of placeholder mesh (height)
    const resW = 10;     //resolution of placeholder mesh (width)
    
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

    for (let i = 0; i < nObj; i++) {
        //create grid cell (contains selection checkboxes, plot)
        const cellElement = document.createElement("div");
        cellElement.id = `cell-${i}`;
        cellElement.classList = ["cell"];
        cellElement.style.setProperty("grid-auto-columns", `repeat(${nThumbnails}, minmax(0,1fr))`)

        //ui-elements
        const selectionContainer = document.createElement("div");
        selectionContainer.classList = ["selection-container"];
        for (const kind of ["good", "bad", "ugly"]) {
            const selection = document.createElement("input");
            selection.type = "checkbox";
            selection.className = [`select-object ${kind}`];
            selectionContainer.appendChild(selection);
            selection.checked = true;
        }
        cellElement.appendChild(selectionContainer);

        //add thumbnails (plots)
        for (let thi = 0; thi < nThumbnails; thi++) {
            const thumbnailElement = document.createElement("div");
            thumbnailElement.id = `thumbnail-${i}-${thi}`;
            thumbnailElement.classList = ["thumbnail"];
            cellElement.appendChild(thumbnailElement);

            //generate placeholder data
            let imgW = randInt(resW-5, resW+5); //thumbnail sizes can change across thumbnails
            let imgH = randInt(resH-5, resH+5); //thumbnail sizes can change across thumbnails
            // let img = arrFunctions.randomNormal({num: imgW*imgH});
            let img = arrFunctions.linspace(-imgW*imgH/2,imgW*imgH/2,imgW*imgH)
            img = reshapeArr(img, [imgW,imgH]);

            //plot thumbnail
            plotImg(img, thumbnailElement, layout, config, {globalOptions: globalOptions})
        };

        //add to parent
        mosaicGrid.appendChild(cellElement);
    };
}

/**
 * updates grid based on `globalOptions`
 */
export function updateGrid() {
    const globalOptions = getGlobalOptions();

    const thumbnailElements = document.getElementsByClassName("plotly-wrapper");
    for (const thElement of thumbnailElements) {
        thElement.style.setProperty("width", `${globalOptions["rowwidth"]}px`);
        thElement.style.setProperty("height", `${globalOptions["rowheight"]}px`);
    };
}
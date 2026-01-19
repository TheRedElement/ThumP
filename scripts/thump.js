/**thump.js */

/**imports */
import * as arrFunctions from "https://cdn.jsdelivr.net/gh/TheRedElement/LuStCodeSnippets@dev/lustCodeSnippets_js/arrFunctions.js"
import { reshapeArr } from "./utils.js"

/**definitions */
function plotImg(img, thumbnailElement, layout, config, {
    wrapperStyle={width: "100px", height: "100px"}
    } = {}) {
    
    //get ID
    const plotlyId = thumbnailElement.id.replace("thumbnail", "plotly");

    //create a plotly wrapper (for global formatting)
    const plotlyPlotWrapper = document.createElement("div");
    plotlyPlotWrapper.classList = ["plotly-wrapper"];
    for (const k of Object.keys(wrapperStyle)) {
        //dynamically adjust style (i.e. set thumbnail dimensions in pixels)
        plotlyPlotWrapper.style.setProperty(k, wrapperStyle[k]);
    };
    thumbnailElement.appendChild(plotlyPlotWrapper);

    //create the actual plot
    const plotlyPlot = document.createElement("div");
    plotlyPlot.classList = ["plotly-plot"]
    plotlyPlot.id = plotlyId;
    plotlyPlotWrapper.appendChild(plotlyPlot);
    
    let traces = [
        {
            z: img,
            type: "heatmap",
            showscale: false,
        }
    ]
    Plotly.newPlot(plotlyPlot, traces, layout, config)

    //resize plots after build to ensure all plots are contained in cells
    let ro = new ResizeObserver(() => {
        Plotly.Plots.resize(plotlyPlot);
    });
    ro.observe(plotlyPlotWrapper);    
}

/**
 * - function to fill the grid of thumbnails
 * @param {Int} nThumbnails
 *  - kwarg, optional
 *  - number of thumbnails per grid cell
 *  - the default is `3`
 * @param {Int} imgWidth
 *  - kwarg, optional
 *  - width all displayed thumbnails shall have
 *  - in pixels
 *  - the default is `100`
 * @param {Int} imgHeight
 *  - kwarg, optional
 *  - height all displayed thumbnails shall have
 *  - in pixels
 *  - the default is `100`
 */
function fillGrid({
    nThumbnails = 3,
    imgWidth = 100,
    imgHeight = 100,
    } = {}) {
    
    //setup for placeholder mesh
    const nObj = 10;    //number of placeholder objects to create
    const resH = 10;     //resolution of placeholder mesh (height)
    const resW = 10;     //resolution of placeholder mesh (width)
    
    const mosaicElement = document.getElementById("thumbnail-mosaic");
    const mosaicGrid = mosaicElement.getElementsByClassName("mosaic-grid")[0];

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
        },
        yaxis: {
            showticklabels: false,
        }
    };
    const config = {
        responsive: true,
        displayModeBar: false,
    };

    for (let i = 0; i < nObj; i++) {
        const cellElement = document.createElement("div");
        cellElement.id = `cell-${i}`;
        cellElement.classList = ["cell"];
        cellElement.style.setProperty("grid-auto-columns", `repeat(${nThumbnails}, minmax(0,1fr))`)

        for (let thi = 0; thi < nThumbnails; thi++) {
            const thumbnailElement = document.createElement("div");
            thumbnailElement.id = `thumbnail-${i}-${thi}`;
            thumbnailElement.classList = ["thumbnail"];
            cellElement.appendChild(thumbnailElement);

            //generate placeholder data
            // let img = arrFunctions.randomNormal({num: resW*resH});
            let img = arrFunctions.linspace(0,resW*resH,resW*resH)
            img = reshapeArr(img, [resW,resH]);

            //plot thumbnail 
            plotImg(img, thumbnailElement, layout, config, {wrapperStyle: {width: `${imgWidth}px`, height: `${imgHeight}px`}})
        };

        //add to parent
        mosaicGrid.appendChild(cellElement);
    };
}

/**
 * - function to get all global settings set in the UI
 * @returns {Object} globalOptions
 *  - current values global options
 *  - key: html element id
 *  - value: html element value
 */
function getSettings() {
    let globalOptionsElements = document.getElementsByClassName("global-option");
    const globalOptions = {};
    for (const element of globalOptionsElements) {
        globalOptions[element.id] = element.value;
    };
    return globalOptions
}

function updateGrid() {
    const globalOptions = getSettings();

    const thumbnailElements = document.getElementsByClassName("plotly-wrapper");
    for (const thElement of thumbnailElements) {
        thElement.style.setProperty("width", `${globalOptions["rowwidth"]}px`);
        thElement.style.setProperty("height", `${globalOptions["rowheight"]}px`);
    };
}
window.updateGrid = updateGrid;

/**executions */
const NTHUMBNAILS = 3
fillGrid({nThumbnails: NTHUMBNAILS, imgWidth: 100, imgHeight: 100});

/**listeners */
window.addEventListener("resize", () => {
    document.querySelectorAll(".plotly-plot").forEach(div => {
        Plotly.Plots.resize(div);
    });
});
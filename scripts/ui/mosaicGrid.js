/**mosaicGrid.js */

/**imports */
import * as arrFunctions from "https://cdn.jsdelivr.net/gh/TheRedElement/LuStCodeSnippets@dev/lustCodeSnippets_js/arrFunctions.js"
import { reshapeArr } from "../utils.js"
import { getGlobalOptions } from "./globalOptions.js";


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
 * @param {Object} wrapperStyle
 *  - kwargs, optional
 *  - style override parameters for the wrapper containing the plotly plot
 *  - contained parameters used to dynamically update plot style based on UI input
 *  - the default is `{width: "100px", height: "100px"}` 
 */
export function plotImg(img, thumbnailElement, layout, config, {
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
export function fillGrid({
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
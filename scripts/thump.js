/**thump.js */

/**imports */
import { BASEPATH, METADATA, THUMBNAILS } from "./base/base.js";
import { exportSelection, invertSelection, selectAll } from "./ui/globalSelectors.js";
import { fillGrid, updateGridCell, updateGridGlobal } from "./ui/mosaicGrid.js";
import { downloadArrAsCsv, loadJSON, showError } from "./utils.js";


/**expose to window */
window.fillGrid = fillGrid;
window.updateGridGlobal = updateGridGlobal;
window.updateGridCell = updateGridCell;
window.selectAll = selectAll;
window.invertSelection = invertSelection;
window.exportSelection = exportSelection;

/**constants */

/**definitions */
/**
 * - retrieves files from file upload and updates `THUMBNAILS` with new data
 * - files have to have the following schema
 *      - <objectId> : {<thumbnails>: Array[3], <other attributes>}
 */
async function uploadFiles() {
    const fileUploadElement = document.getElementById("file-upload");

    const wrongFiles = [];      //list of wrong files (for warning message)   
    for (const file of fileUploadElement.files) {
        if (!file.name.toLowerCase().endsWith(".json")) {
            //check for correct extension (take note if wrong extension)
            wrongFiles.push(file.name);
        } else {
            console.log(file)
            try {
                const text = await file.text(); //read file
                const data = JSON.parse(text);  //parse JSON
                
                Object.assign(THUMBNAILS, data);    //update `THUMBNAILS` with new uploaded data
    
            } catch (err) {
                showError(fileUploadElement, `Error reading ${file.name}: ${err}`);
                console.error(`Error reading ${file.name}:`, err);
            };            
        };
    };
    //update grid with uploaded objects
    fillGrid();
    updateGridGlobal();
    updateGridCell({replot:true});

    //update status bar
    document.getElementById("numobjects").innerText = Object.keys(THUMBNAILS).length;
}
window.uploadFiles = uploadFiles;


/**needs to run first */
window.addEventListener("DOMContentLoaded", () => {

    //date and time when session started to have unique file-names that can be identified later-on
    let currentDate = new Date();
    currentDate = String(currentDate.getFullYear()).padStart(4, 0)
        + String(currentDate.getMonth()+1).padStart(2, 0)
        + String(currentDate.getDate()).padStart(2, 0)
        + String(currentDate.getHours()).padStart(2, 0)
        + String(currentDate.getMinutes()).padStart(2, 0)
        + String(currentDate.getSeconds()).padStart(2, 0)
    METADATA["sessionId"] = currentDate;
});

/**executions */
for (let i = 0; i < 1; i++) {
    // console.log(`${BASEPATH}data/processed/processed_${String(i).padStart(4, "0")}.json`)
    Object.assign(THUMBNAILS, await loadJSON(`/data/processed/processed_${String(i).padStart(4, "0")}.json`));    //local file upload at startup
}
document.getElementById("numobjects").innerText = Object.keys(THUMBNAILS).length;
fillGrid();
updateGridGlobal();
updateGridCell({replot:true});

/**listeners */
window.addEventListener("resize", () => {
    document.querySelectorAll(".plotly-plot").forEach(div => {
        Plotly.Plots.resize(div);
    });
});
document.addEventListener("keydown", (event) => {
    // // Prevent the default browser scrolling behavior
    // if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    //     event.preventDefault();
    // };

    const thumbnailMosaic = document.getElementById("thumbnail-mosaic");
    const mosaicGrid = document.getElementById("mosaic-grid");
    const cell = mosaicGrid.getElementsByClassName("cell")[0];
    const mosaicGridStyle = getComputedStyle(mosaicGrid);
    const cellStyle = getComputedStyle(cell);

    const containerWidth = parseInt(thumbnailMosaic.offsetWidth);
    const colWidth = parseInt(cellStyle.width);                     //column width == cell width because all cells have same width
    const gap = parseInt(mosaicGridStyle.gap);                      //gap between columns
    const nCols = parseInt(containerWidth / (colWidth+gap));        //number of (fully) visible columns


    const scrollAmount = colWidth*nCols + gap*nCols;                //width of the visible grid
    if (event.ctrlKey) {
        switch (event.key) {
            case "ArrowLeft":
                thumbnailMosaic.scrollBy({
                    left: -scrollAmount,
                    behavior: "instant",
                });
                break;
            case "ArrowRight":
                thumbnailMosaic.scrollBy({
                    left: scrollAmount,
                    behavior: "instant",
                });
                break;
        
            default:
                break;
        };
    }
});
const controlsHead = document.getElementById("controls-head");
controlsHead.addEventListener("click", (event) => {
    //toggles hidden state
    const controlsWrapper = document.getElementById("controls-wrapper");
    
    if ([...controlsWrapper.classList].includes("hidden")) {
        controlsWrapper.classList.remove("hidden");
    } else {
        controlsWrapper.classList.add("hidden");
    };
});
const legendHead = document.getElementById("legend-head");
legendHead.addEventListener("click", (event) => {
    //toggles hidden state
    const legendWrapper = document.getElementById("legend-wrapper");
    
    if ([...legendWrapper.classList].includes("hidden")) {
        legendWrapper.classList.remove("hidden");
    } else {
        legendWrapper.classList.add("hidden");
    };
});
const navigationHead = document.getElementById("navigation-head");
navigationHead.addEventListener("click", (event) => {
    //toggles hidden state
    const navigationWrapper = document.getElementById("navigation-wrapper");
    
    if ([...navigationWrapper.classList].includes("hidden")) {
        navigationWrapper.classList.remove("hidden");
    } else {
        navigationWrapper.classList.add("hidden");
    };
});

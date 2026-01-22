/**thump.js */

/**imports */
import { BASEPATH, METADATA, THUMBNAILS } from "./base/base.js";
import { invertSelection, selectAll } from "./ui/globalSelectors.js";
import { downloadSchema, exportSelection, fillThumbnails } from "./ui/io.js";
import { fillGrid, updateGridCell, updateGridGlobal } from "./ui/mosaicGrid.js";


/**expose to window */
window.fillGrid = fillGrid;
window.updateGridGlobal = updateGridGlobal;
window.updateGridCell = updateGridCell;
window.selectAll = selectAll;
window.invertSelection = invertSelection;
window.exportSelection = exportSelection;
window.downloadSchema = downloadSchema;

/**constants */

/**definitions */
/**
 * creates temporary popup that disappears once `func` finished its execution
 * @param {Function} func
 *  - function to be run 
 * @param {String} msg
 *  - message to display
 */
async function showOverlayInfo(func, msg) {
    //temporary elements
    const overlay = document.createElement("div");
    overlay.className = "overlay info";
    overlay.innerText = msg;
    document.body.appendChild(overlay);
    
    //close button to not have overlay displayed when `func()` raises an error
    const closeBtn = document.createElement("button");
    closeBtn.className = "close"
    closeBtn.onclick = () => {overlay.remove()};
    overlay.appendChild(closeBtn);
    

    //async to make sure `func()` finishes before removal of popup
    await func();

    //remove popup
    overlay.remove();
}
window.fillThumbnails = async ({pageChange=false} = {}) => {
    if (pageChange) { 
        //only on page-change
        
        //update pageNumber
        const pageNumber = document.getElementById("pagenumber");
        let prevPage = pageNumber.dataset["previous"];              //page before change
        pageNumber.dataset["previous"] = pageNumber.value;          //update previous pageNumber
    
        if (document.getElementById("autoexport").checked) {
            //export only if requested
            await exportSelection({pageNumber:[prevPage]});
        };
        console.log("Page change: " + prevPage + "->"+pageNumber.value)
    };
    showOverlayInfo(fillThumbnails, "Loading Thumbnails... Please Wait...")
}

/**
 * function to show welcome box
 */
function showWelcome(){
    document.getElementById("welcome").classList.remove("hidden");
}
window.showWelcome = showWelcome;
/**
 * function to hide welcome box
*/
function hideWelcome() {
    document.getElementById("welcome").classList.add("hidden");
}
window.hideWelcome = hideWelcome;


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

    //set previous page number to current page
    const pageNumber = document.getElementById("pagenumber");
    pageNumber.dataset["previous"] = pageNumber.value;
});

/**executions */
// for (let i = 0; i < 1; i++) {
//     // console.log(`${BASEPATH}data/processed/processed_${String(i).padStart(4, "0")}.json`)
//     Object.assign(THUMBNAILS, await loadJSON(`/data/processed/processed_${String(i).padStart(4, "0")}.json`));    //local file upload at startup
// }
// document.getElementById("numobjects").innerText = Object.keys(THUMBNAILS).length;
// fillGrid();
// updateGridGlobal();
// updateGridCell({replot:true});


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
const pageNumber = document.getElementById("pagenumber");


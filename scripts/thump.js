/**thump.js */

/**imports */
import { THUMBNAILS } from "./base/base.js";
import { exportSelection, invertSelection, selectAll } from "./ui/globalSelectors.js";
import { fillGrid, updateGrid } from "./ui/mosaicGrid.js";
import { downloadArrAsCsv, loadJSON, showError } from "./utils.js";

/**expose to window */
window.fillGrid = fillGrid;
window.updateGrid = updateGrid;
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
    updateGrid();
}
window.uploadFiles = uploadFiles;


/**executions */
Object.assign(THUMBNAILS, await loadJSON("/data/processed/processed.json"));    //local file upload at startup
fillGrid();
updateGrid();

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

    const scrollAmount = thumbnailMosaic.offsetWidth;
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
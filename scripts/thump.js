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
}
window.uploadFiles = uploadFiles;


/**executions */
Object.assign(THUMBNAILS, await loadJSON("/data/processed/processed.json"));    //local file upload at startup
fillGrid();

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
                    behavior: "smooth",
                });
                break;
            case "ArrowRight":
                thumbnailMosaic.scrollBy({
                    left: scrollAmount,
                    behavior: "smooth",
                });
                break;
        
            default:
                break;
        };
    }
});
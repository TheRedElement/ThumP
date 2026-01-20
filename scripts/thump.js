/**thump.js */

/**imports */
import { exportSelection, invertSelection, selectAll } from "./ui/globalSelectors.js";
import { fillGrid, updateGrid } from "./ui/mosaicGrid.js";
import { downloadArrAsCsv } from "./utils.js";

/**expose to window */
window.fillGrid = fillGrid;
window.updateGrid = updateGrid;
window.selectAll = selectAll;
window.invertSelection = invertSelection;
window.exportSelection = exportSelection;

/**definitions */



/**executions */
const NTHUMBNAILS = 3
fillGrid({nThumbnails: NTHUMBNAILS, imgWidth: 100, imgHeight: 100});

/**listeners */
window.addEventListener("resize", () => {
    document.querySelectorAll(".plotly-plot").forEach(div => {
        Plotly.Plots.resize(div);
    });
});
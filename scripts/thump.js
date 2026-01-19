/**thump.js */

/**imports */
import { invertSelection, selectAll } from "./ui/globalSelectors.js";
import { fillGrid, updateGrid } from "./ui/mosaicGrid.js";

/**expose to window */
window.updateGrid = updateGrid;
window.selectAll = selectAll;
window.invertSelection = invertSelection;

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
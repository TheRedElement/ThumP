/**io.js */


/**imports */
import { BASEPATH, METADATA, THUMBNAILS } from "../base/base.js";
import { downloadArrAsCsv, downloadObjectAsJson, loadJSON, showError } from "../utils.js";

/**definitions */
/**
 * returs quantities describing the schema of some file
 * @param {File} file
 *  - some file to get schema quantities of 
 * @returns {Object}
 *  - inferred schema parameters
 */
export async function getSchema(file) {
    const text = await file.text();     //read file
    const data = JSON.parse(text);      //parse JSON

    return {
        length: Object.keys(data).length,
    }
}

/**
 * retrieves uploaded files to fill `THUMBNAILS` with relevant objects
 */
export async function fillThumbnails() {

    console.log("`fillThumbnails()`: started file upload...")

    //get parameters and files
    const fileUploadElement = document.getElementById("file-upload");
    const objPerPage = document.getElementById("obj-per-page").value;
    
    //infer schema from first uploaded file
    const fileSchema = await getSchema(fileUploadElement.files[0]);

    //reset `THUMBNAILS`
    Object.keys(THUMBNAILS).forEach(key => delete THUMBNAILS[key]);
    
    //populate thumbnails with relevant entries
    const pageIndex = document.getElementById("pagenumber").value;
    let fileIdx = Math.trunc(objPerPage*pageIndex / fileSchema["length"]);
    let curRenderedObj = 0;
    let fileStart = fileIdx;    //for status report
    let objIdxFileStart = 0;    //for status report
    let objIdx = 0;             //for status report (endpoint)
    let objIdxFile = 0;         //for status report (endpoint)
    while (curRenderedObj < objPerPage) {
        
        //get parameters for current iteration
        objIdx = pageIndex*objPerPage + curRenderedObj;     //global object index
        objIdxFile = objIdx - fileIdx*fileSchema["length"]  //object index in the current file
        let curFile = fileUploadElement.files[fileIdx];     //current file

        //read relevant file
        try {
            const text = await curFile.text();  //read file
            const data = JSON.parse(text);      //parse JSON
            const objIds = Object.keys(data);
            THUMBNAILS[objIds[objIdxFile]] = data[objIds[objIdxFile]];
            // console.log(objIds[objIdxFile])
            // console.log(objIds[objIdxFile])
        } catch (err) {
            showError(fileUploadElement, `Error reading ${curFile.name}: ${err}`);
            console.error(`Error reading ${curFile.name}:`, err);
        };

        if (curRenderedObj == 0) {
            objIdxFileStart = objIdxFile;
        }

        
        //updates
        // console.log(objIdx + " " + objIdxFile)
        // console.log(curFile.name + " " + fileSchema["length"] + " " + fileIdx*fileSchema["length"] + " " + (fileIdx+1)*fileSchema["length"])
        if (objIdx+1 >= (fileIdx+1)*fileSchema["length"]) {
            //update file index if next object will be out of bounds
            fileIdx++;
        }
        curRenderedObj++;   //number of currently rendered objects
    };
    console.log("`fillThumbnails()`: finished file upload... rendering `THUMBNAILS`")

    //update grid with uploaded objects
    fillGrid({redraw:true});
    updateGridGlobal();
    updateGridCell({replot:true});

    //update status bar
    document.getElementById("status-bar").innerText = `
    Loaded Objects:
        Global Index: ${objIdx-(objPerPage-1)} - ${objIdx}
        File Index: File ${fileStart} Obj ${objIdxFileStart} - File ${fileIdx} Obj ${objIdxFile}
        Displayed Number: ${Object.keys(THUMBNAILS).length}
        Objects Per File: ${fileSchema["length"]}
    `
    console.log("`fillThumbnails()`: finished rendering `THUMBNAILS`")
}

/**
 * function to export all selected objects into tables
 * @param {Int} pageNumber
 *  - kwarg, optional
 *  - override for currently displayed pageNumber
 *  - to correct for wrong pageNumber when exporting on page-change
 */
export function exportSelection({pageNumber=undefined} = {}) {
    const objClassification = document.querySelectorAll("input[name='select-object']:checked");  //get all selected objects

    //relevant metadata
    pageNumber = (pageNumber === undefined) ? String(document.getElementById("pagenumber").value).padStart(4, 0) : pageNumber;

    //init output array with column header
    let objClass = [
        ["object_id", "class"]
    ];  //array for object classes

    //add respective objects to their selected class
    for (const obj of objClassification) {
        objClass.push(
            [obj.dataset["objectId"], obj.value]
        )
    };
    downloadArrAsCsv(objClass, `thump_classification_${METADATA["sessionId"]}_${pageNumber}`)
}

/**
 * function to download schema.json
 */
export async function downloadSchema() {
    const schema = await loadJSON(`${BASEPATH}data/schema.json`);
    downloadObjectAsJson(schema, "schema");
}

// /**
//  * - retrieves files from file upload and updates `THUMBNAILS` with new data
//  * - files have to have the following schema
//  *      - <objectId> : {<thumbnails>: Array[3], <other attributes>}
//  */
// export async function uploadFiles() {
//     const fileUploadElement = document.getElementById("file-upload");

//     const wrongFiles = [];      //list of wrong files (for warning message)   
//     for (const file of fileUploadElement.files) {
//         if (!file.name.toLowerCase().endsWith(".json")) {
//             //check for correct extension (take note if wrong extension)
//             wrongFiles.push(file.name);
//         } else {
//             console.log(file)
//             try {
//                 const text = await file.text(); //read file
//                 const data = JSON.parse(text);  //parse JSON
                
//                 Object.assign(THUMBNAILS, data);    //update `THUMBNAILS` with new uploaded data
    
//             } catch (err) {
//                 showError(fileUploadElement, `Error reading ${file.name}: ${err}`);
//                 console.error(`Error reading ${file.name}:`, err);
//             };            
//         };
//     };
//     //update grid with uploaded objects
//     fillGrid();
//     updateGridGlobal();
//     updateGridCell({replot:true});

//     //update status bar
//     document.getElementById("numobjects").innerText = Object.keys(THUMBNAILS).length;
// }
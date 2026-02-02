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
    METADATA["filesUploaded"] = [...fileUploadElement.files].map(f => f.name);                               //store some metadata

    //reset `THUMBNAILS`
    Object.keys(THUMBNAILS).forEach(key => delete THUMBNAILS[key]);
    
    //populate thumbnails with relevant entries
    const pageIndex = document.getElementById("pagenumber").value;
    let fileIdx = Math.trunc(objPerPage*pageIndex / fileSchema["length"]);  //index of currently used file
    let curRenderedObj = 0;
    let objIdx = 0;                                                         //global object index
    let objIdxFile = 0;                                                     //object index in the current file
    METADATA["objPerPage"] = objPerPage                                     //for status report
    METADATA["fileIdxStart"] = fileIdx;                                     //for status report
    while ((curRenderedObj < objPerPage) & (fileIdx < METADATA["filesUploaded"].length)) {
        //iterate until required number of objects reached or end of file-list reached

        //get parameters for current iteration
        objIdx = pageIndex*objPerPage + curRenderedObj;     
        objIdxFile = objIdx - fileIdx*fileSchema["length"]  
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
            METADATA["objIdxStart"]     = objIdx;
            METADATA["objIdxStartFile"] = objIdxFile;
        }
        METADATA["fileIdxEnd"] = fileIdx;   //before updating `filIdx` to avoid having non-existent file
        
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

    //get more metadata
    METADATA["objIdxEnd"] = objIdx;
    METADATA["objIdxEndFile"] = objIdxFile;
    METADATA["renderedObjs"] = curRenderedObj;
    METADATA["objsPerFile"] = fileSchema["length"];

    //update status bar
    document.getElementById("statusbar").innerText = `
    Loaded Objects:
        Global Index: ${METADATA["objIdxStart"]} - ${METADATA["objIdxEnd"]}
        File Index: File ${METADATA["fileIdxStart"]} Obj ${METADATA["objIdxStartFile"]} - File ${METADATA["fileIdxEnd"]} Obj ${METADATA["objIdxEndFile"]}
        Rendered Objects: ${METADATA["renderedObjs"]}
        Objects Per File: ${METADATA["objsPerFile"]}
    Loaded Files: ${METADATA["filesUploaded"]}
        First: ${METADATA["filesUploaded"][0]}
        Last: ${METADATA["filesUploaded"][METADATA["filesUploaded"].length-1]}
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

    //check for file suffix
    let fileSuffix = document.getElementById("filesuffix").value;
    fileSuffix = (fileSuffix === "") ? fileSuffix : "_" + fileSuffix
    
    //relevant metadata
    pageNumber = (pageNumber === undefined) ? String(document.getElementById("pagenumber").value).padStart(4, 0) : pageNumber;

    //init output array with column header
    let csvComments = [
        //comments
        `#METADATA:${JSON.stringify(METADATA)}`,
        "#objectId: id of the object as specified in the uploaded files (keys of entries)",
        "#class: classification based on the selection in the user interface",
    ]
    const auxCols = Object.keys(objClassification[0].dataset);
    let csvContent = [
        ["class", ...auxCols], //header
    ];  //array for object classes
    
    //add respective objects to their selected class
    for (const obj of objClassification) {
        // console.log(Object.keys(obj.dataset))
        csvContent.push(
            [obj.value, ...Object.values(obj.dataset)]
        )
    };
    downloadArrAsCsv(csvContent, `thump_${METADATA["sessionId"]}_${pageNumber}${fileSuffix}`, csvComments)
}

/**
 * function to download schema.json
 */
export async function downloadSchema() {
    const schema = await loadJSON(`${BASEPATH}data/schema.json`);
    downloadObjectAsJson(schema, "schema");
}
/**
 * function to download examples
 */
export async function downloadExamples() {
    for (let i = 0; i < 5; i++) {
        const example = await loadJSON(`${BASEPATH}data/examples/example${String(i).padStart(2,0)}.json`);
        downloadObjectAsJson(example, `example${String(i).padStart(2,0)}`);
    }
}

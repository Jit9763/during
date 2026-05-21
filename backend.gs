// Google Apps Script Backend for Census Dashboard

/* ---------- CONFIGURATION ---------- */
// Replace with your actual Spreadsheet ID (the part after /d/ in the URL)
const SPREADSHEET_ID = '1DNCBTvt1Zs43ib1-ghm4gjqk70YRkk9jtGkstEYHTyg';

// Sheet names – change if your sheets have different titles
const SHEET_TASKS       = 'Tasks';
const SHEET_CENSUS_DATA = 'CensusData';
const SHEET_OVERALL     = 'OverallStats';
const SHEET_PDF         = 'PDF';

/* ---------- HELPER ---------- */
function _openSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" नहीं मिला।');
  return sheet;
}

/* ---------- GET ---------- */
// ----- New: Serve latest PDF from Drive folder -----
function getLatestPdfFromFolder(){
  const folderId = '1EKPJ5N9w1QLeSMBCMrIUt33C9c2fb4R9';
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFilesByType(MimeType.PDF);
  let latestFile = null;
  let latestDate = new Date(0);
  while(files.hasNext()){
    const f = files.next();
    const mod = f.getLastUpdated();
    if(mod > latestDate){
      latestDate = mod;
      latestFile = f;
    }
  }
  if(!latestFile) return null;
  // Ensure public access
  latestFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  // Direct preview URL, suitable for <iframe src>
  // Append a timestamp to bypass browser caching of the preview URL
  const baseUrl = 'https://drive.google.com/file/d/' + latestFile.getId() + '/preview';
  const ts = new Date().getTime();
  return baseUrl + '?t=' + ts;
}

// ----- New: Serve latest PDF from Drive folder as Base64 -----
function getLatestPdfBase64(){
  const folderId = '1EKPJ5N9w1QLeSMBCMrIUt33C9c2fb4R9';
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFilesByType(MimeType.PDF);
  let latestFile = null;
  let latestDate = new Date(0);
  while(files.hasNext()){
    const f = files.next();
    const mod = f.getLastUpdated();
    if(mod > latestDate){
      latestDate = mod;
      latestFile = f;
    }
  }
  if(!latestFile) return null;
  
  // Ensure public access just in case
  latestFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  const bytes = latestFile.getBlob().getBytes();
  const base64 = Utilities.base64Encode(bytes);
  return {
    status: 'success',
    fileName: latestFile.getName(),
    pdfData: base64
  };
}

// ----- New: Update PDF preview URL in Sheet -----
function updatePdfInSheet(){
  const url = getLatestPdfFromFolder();
  if(!url){
    Logger.log('No PDF found to update.');
    return;
  }
  const pdfSheet = _openSheet(SHEET_PDF);
  // Store the preview URL in cell A1 (you can change the cell as needed)
  pdfSheet.getRange('A1').setValue(url);
}



// ----- Modified doGet to handle folderPdf param -----
function doGet(e){
  try{
    // Serve latest PDF from Drive folder when ?folderPdf=1
    if(e.parameter && e.parameter.folderPdf){
      const result = getLatestPdfBase64();
      if(!result){
        return ContentService.createTextOutput(JSON.stringify({status:'error',message:'No PDF found in folder'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // ----- New: Serve PDF preview URL from Sheet -----
    if(e.parameter && e.parameter.pdfTab){
      const pdfSheet = _openSheet(SHEET_PDF);
      const storedUrl = pdfSheet.getRange('A1').getValue();
      if(!storedUrl){
        return ContentService.createTextOutput(JSON.stringify({status:'error',message:'No PDF URL stored'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({publicUrl:storedUrl,status:'success'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // Existing PDF endpoint (if needed)
    if(e.parameter && e.parameter.pdf){
      const pdfSheet = _openSheet(SHEET_PDF);
      const b64 = pdfSheet.getRange('A1').getValue() || '';
      if(!b64){
        return ContentService.createTextOutput('PDF उपलब्ध नहीं')
          .setMimeType(ContentService.MimeType.TEXT);
      }
      const decoded = Utilities.base64Decode(b64);
      const blob = Utilities.newBlob(decoded,'application/pdf','report.pdf');
      return ContentService.createBinaryOutput(blob.getBytes())
        .setMimeType(ContentService.MimeType.PDF)

    }
    // ----- Normal data request (all data) -----
    const tasksSheet   = _openSheet(SHEET_TASKS);
    const censusSheet  = _openSheet(SHEET_CENSUS_DATA);
    const overallSheet = _openSheet(SHEET_OVERALL);
    const pdfSheet     = _openSheet(SHEET_PDF);
    const taskVals   = tasksSheet.getDataRange().getValues();
    const taskHeader = taskVals.shift();
    const tasksObj   = {};
    taskVals.forEach(row=>{const obj={};taskHeader.forEach((h,i)=>obj[h]=row[i]);if(obj.id)tasksObj[obj.id]=obj;});
    const censusVals   = censusSheet.getDataRange().getValues();
    const censusHeader = censusVals.shift();
    const censusArr    = censusVals.map(row=>{const o={};censusHeader.forEach((h,i)=>o[h]=row[i]);return o;});
    const overallVals   = overallSheet.getDataRange().getValues();
    const overallHeader = overallVals.shift();
    const overallObj    = {};
    overallVals.forEach(row=>{overallHeader.forEach((h,i)=>overallObj[h]=row[i]);});
    const pdfData = pdfSheet.getRange('A1').getValue() || null;
    const response = {values:tasksObj,censusData:censusArr,overallStats:overallObj,pdfData:pdfData,status:'success'};
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({status:'error',message:err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ---------- POST ---------- */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    // ---- Save Task Values ----
    if (payload.values) {
      const sheet = _openSheet(SHEET_TASKS);
      const header = Object.keys(payload.values[Object.keys(payload.values)[0]] || payload.values);
      sheet.clear();
      sheet.appendRow(header);
      for (const id in payload.values) {
        const row = header.map(col => payload.values[id][col] || '');
        sheet.appendRow(row);
      }
    }

    // ---- Save Census Live Data ----
    if (payload.censusData) {
      const sheet = _openSheet(SHEET_CENSUS_DATA);
      const sample = payload.censusData[0] || {};
      const header = Object.keys(sample);
      sheet.clear();
      sheet.appendRow(header);
      payload.censusData.forEach(item => {
        const row = header.map(col => item[col] || '');
        sheet.appendRow(row);
      });
    }

    // ---- Save Overall Stats ----
    if (payload.overallStats) {
      const sheet = _openSheet(SHEET_OVERALL);
      const header = Object.keys(payload.overallStats);
      sheet.clear();
      sheet.appendRow(header);
      const row = header.map(col => payload.overallStats[col] || '');
      sheet.appendRow(row);
    }

    // ---- Save PDF (Base64) ----
    if (payload.pdfData) {
      const sheet = _openSheet(SHEET_PDF);
      sheet.clear();
      sheet.getRange('A1').setValue(payload.pdfData);
    }

    return ContentService
      .createTextOutput('Saved');
  } catch (err) {
    return ContentService
      .createTextOutput('Error: ' + err.toString());
  }
}

/* ---------- CORS Pre‑flight ---------- */
function doOptions(e) {
  return ContentService.createTextOutput('');
}

// ----- New: Setup time-driven trigger for PDF sync -----
function setupTriggers(){
  // Delete existing triggers for this function to avoid duplicates
  const allTriggers = ScriptApp.getProjectTriggers();
  for(const trig of allTriggers){
    if(trig.getHandlerFunction() === 'updatePdfInSheet'){
      ScriptApp.deleteTrigger(trig);
    }
  }
  // Create a new trigger to run every 5 minutes
  ScriptApp.newTrigger('updatePdfInSheet')
    .timeBased()
    .everyMinutes(5)
    .create();
  Logger.log('Trigger for updatePdfInSheet created (every 5 minutes)');
}

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
function _getSpreadsheet() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch(e) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function _openSheet(name) {
  const ss = _getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    try {
      sheet = ss.insertSheet(name);
    } catch(err) {
      throw new Error('Sheet "' + name + '" नहीं मिला और नया शीट बनाने में विफल: ' + err.toString());
    }
  }
  return sheet;
}
function ensureDriveAuth(){
  try {
    // Trigger authentication by accessing Drive
    DriveApp.getRootFolder();
    return true;
  } catch (e) {
    Logger.log('Drive authentication error: ' + e.toString());
    return false;
  }
}


/* ---------- GET ---------- */
// ----- New: Serve latest PDF from Drive folder -----
function getLatestPdfFromFolder(){
  if (!ensureDriveAuth()) {
    return { status: 'error', message: 'Drive authentication failed' };
  }
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
  // Direct preview URL, suitable for <iframe src>
  // Append a timestamp to bypass browser caching of the preview URL
  const baseUrl = 'https://drive.google.com/file/d/' + latestFile.getId() + '/preview';
  const ts = new Date().getTime();
  return baseUrl + '?t=' + ts;
}

// ----- New: Serve latest PDF from Drive folder as Base64 -----
function getLatestPdfBase64(){
  if (!ensureDriveAuth()) {
    return { status: 'error', message: 'Drive authentication failed' };
  }
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
    // ----- Debug endpoint -----
    if(e && e.parameter && e.parameter.debug){
      const ss = _getSpreadsheet();
      const sheets = ss.getSheets().map(function(s) { return s.getName(); });
      const debugInfo = {
        ssId: ss.getId(),
        ssName: ss.getName(),
        sheets: sheets,
        configSpreadsheetId: SPREADSHEET_ID,
        sheetDetails: {}
      };
      
      sheets.forEach(function(name) {
        try {
          const sheet = ss.getSheetByName(name);
          const vals = sheet.getDataRange().getValues();
          debugInfo.sheetDetails[name] = {
            rows: vals.length,
            cols: vals[0] ? vals[0].length : 0,
            headers: vals[0] || [],
            sampleRows: vals.slice(1, 6) // first 5 data rows
          };
        } catch(err) {
          debugInfo.sheetDetails[name] = { error: err.toString() };
        }
      });
      
      return ContentService.createTextOutput(JSON.stringify({status:'success', debug: debugInfo}))
        .setMimeType(ContentService.MimeType.JSON);
    }

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
    const pdfSheet     = _openSheet(SHEET_PDF);
    const taskVals   = tasksSheet.getDataRange().getValues();
    const taskHeader = taskVals.shift();
    const tasksObj   = {};
    taskVals.forEach(row=>{const obj={};taskHeader.forEach((h,i)=>obj[h]=row[i]);if(obj.id)tasksObj[obj.id]=obj;});
    
    const pdfData = pdfSheet.getRange('A1').getValue() || null;

    // Read from Sheet1 first, fallback to CensusData
    const ss = _getSpreadsheet();
    let censusSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('CensusData');
    
    let censusArr = [];
    let overallObj = {
      expectedHouses: 0,
      completedHouses: 0,
      population: 0,
      totalHlbs: 0,
      inProgress: 0,
      completedHlbs: 0,
      yetToStart: 0
    };
    
    if (censusSheet) {
      const censusVals = censusSheet.getDataRange().getValues();
      if (censusVals.length > 1) {
        const censusHeader = censusVals.shift();
        
        const findIdx = function(keywords) {
          return censusHeader.findIndex(function(h) {
            const hStr = String(h || '').toLowerCase();
            return keywords.some(function(k) {
              return hStr.indexOf(k) !== -1;
            });
          });
        };
        
        const hlbIdx = findIdx(['village', 'town', 'गाँव', 'कस्बा', 'नाम']);
        const hlbColIdx = hlbIdx === -1 ? 0 : hlbIdx;
        
        const totalHlbsIdx = findIdx(['total hlb', 'total_hlb', 'कुल hlb', 'hlb']);
        const inProgressIdx = findIdx(['in progress', 'in_progress', 'प्रगतिरत', 'प्रगति पर']);
        const completedHlbsIdx = findIdx(['completed hlb', 'completed_hlb', 'completed', 'पूर्ण hlb']);
        const yetToStartIdx = findIdx(['yet to start', 'yet_to_start', 'लंबित hlb', 'शुरू नहीं']);
        const expectedHousesIdx = findIdx(['expected', 'total expected', 'कुल अनुमानित', 'लक्ष्य']);
        const completedHousesIdx = findIdx(['total number of census', 'number of census houses', 'completed houses', 'done', 'पूर्ण मकान', 'संख्या']);
        const whollyResIdx = findIdx(['wholly residential', 'wholly_res', 'पूर्ण आवासीय']);
        const partlyResIdx = findIdx(['partly residential', 'partly_res', 'आंशिक आवासीय']);
        const vacantIdx = findIdx(['vacant', 'खाली']);
        const lockedIdx = findIdx(['locked', 'ताला बंद']);
        const otherUseIdx = findIdx(['put to other uses', 'other uses', 'अन्य उपयोग']);
        const householdsIdx = findIdx(['total number of households', 'households', 'कुल परिवार']);
        const verifiedHouseholdsIdx = findIdx(['verified by supervisor', 'verified_households', 'सत्यापित परिवार']);
        const populationIdx = findIdx(['total population', 'population', 'जनसंख्या']);
        const seIdUsedIdx = findIdx(['se id used', 'se_id_used', 'इस्तेमाल id']);
        let totalRowFound = false;
        
        censusVals.forEach(function(row) {
          const villageName = String(row[hlbColIdx] || '').trim();
          if (!villageName || villageName === '-') {
            return;
          }
          
          const getValue = function(idx, fallback) {
            if (idx === -1 || row[idx] === undefined || row[idx] === null) return fallback;
            const parsed = parseInt(row[idx]);
            return isNaN(parsed) ? fallback : parsed;
          };
          
          const rowObj = {
            village: villageName,
            totalHlbs: getValue(totalHlbsIdx, 1),
            inProgress: getValue(inProgressIdx, 0),
            completedHlbs: getValue(completedHlbsIdx, 0),
            yetToStart: getValue(yetToStartIdx, 0),
            expectedHouses: getValue(expectedHousesIdx, 0),
            completedHouses: getValue(completedHousesIdx, 0),
            whollyRes: getValue(whollyResIdx, 0),
            partlyRes: getValue(partlyResIdx, 0),
            vacant: getValue(vacantIdx, 0),
            locked: getValue(lockedIdx, 0),
            otherUse: getValue(otherUseIdx, 0),
            households: getValue(householdsIdx, 0),
            verifiedHouseholds: getValue(verifiedHouseholdsIdx, 0),
            population: getValue(populationIdx, 0),
            seIdUsed: getValue(seIdUsedIdx, 0)
          };
          
          if (villageName.toLowerCase().indexOf('total') !== -1) {
            overallObj.totalHlbs = rowObj.totalHlbs;
            overallObj.inProgress = rowObj.inProgress;
            overallObj.completedHlbs = rowObj.completedHlbs;
            overallObj.yetToStart = rowObj.yetToStart;
            overallObj.expectedHouses = rowObj.expectedHouses;
            overallObj.completedHouses = rowObj.completedHouses;
            overallObj.population = rowObj.population;
            totalRowFound = true;
            return; // Skip adding Total row to the list of villages
          }
          
          censusArr.push(rowObj);
          
          // Accumulate for fallback if no Total row exists
          if (!totalRowFound) {
            overallObj.totalHlbs += rowObj.totalHlbs;
            overallObj.inProgress += rowObj.inProgress;
            overallObj.completedHlbs += rowObj.completedHlbs;
            overallObj.yetToStart += rowObj.yetToStart;
            overallObj.expectedHouses += rowObj.expectedHouses;
            overallObj.completedHouses += rowObj.completedHouses;
            overallObj.population += rowObj.population;
          }
        });
      }
    }

    const response = {
      values: tasksObj,
      censusData: censusArr,
      overallStats: overallObj,
      pdfData: pdfData,
      status: 'success'
    };
    
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
      const ss = _getSpreadsheet();
      const sheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('CensusData') || ss.insertSheet('Sheet1');
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

/* ---------- CUSTOM MENU & PERMISSIONS REVIEW ---------- */

/**
 * Automatically runs when the spreadsheet is opened.
 * Adds a custom menu for administrative operations and permission management.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Dashboard Settings')
    .addItem('Test Drive Auth & Permissions', 'ensureDriveAuthMenu')
    .addItem('Review/Manage App Permissions', 'reviewPermissions')
    .addItem('Setup Trigger & Sync PDF', 'setupTriggers')
    .addToUi();
}

/**
 * Menu action to check if Google Drive access is active.
 */
function ensureDriveAuthMenu() {
  const ui = SpreadsheetApp.getUi();
  if (ensureDriveAuth()) {
    ui.alert('Success', 'Drive authentication is active and working successfully!', ui.ButtonSet.OK);
  } else {
    ui.alert('Error', 'Authentication failed or not fully authorized. Please review permissions.', ui.ButtonSet.OK);
  }
}

/**
 * Menu action to show permission status and instructions/links for review/revocation.
 */
function reviewPermissions() {
  const authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
  const status = authInfo.getAuthorizationStatus();
  const url = authInfo.getAuthorizationUrl();
  const hasAuth = (status !== ScriptApp.AuthorizationStatus.REQUIRED);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 20px;
            color: #202124;
            background-color: #f8f9fa;
          }
          .card {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
            padding: 20px;
            margin-bottom: 20px;
          }
          h2 {
            margin-top: 0;
            color: #1a73e8;
            font-size: 20px;
          }
          .status {
            font-size: 15px;
            font-weight: bold;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 15px;
          }
          .status-authorized {
            background-color: #e6f4ea;
            color: #137333;
            border: 1px solid #ceead6;
          }
          .status-required {
            background-color: #fce8e6;
            color: #c5221f;
            border: 1px solid #fad2cf;
          }
          .btn-container {
            margin-top: 15px;
            margin-bottom: 10px;
          }
          .btn {
            display: inline-block;
            background-color: #1a73e8;
            color: #ffffff;
            padding: 10px 18px;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            text-align: center;
            border: none;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.15);
            transition: background-color 0.2s;
          }
          .btn-secondary {
            background-color: #ffffff;
            color: #1a73e8;
            border: 1px solid #dadce0;
            box-shadow: none;
            margin-left: 10px;
          }
          .btn:hover {
            background-color: #1557b0;
          }
          .btn-secondary:hover {
            background-color: #f8f9fa;
            color: #1557b0;
            border-color: #1a73e8;
          }
          .instructions {
            font-size: 13px;
            line-height: 1.6;
          }
          .instructions h3 {
            margin-top: 10px;
            margin-bottom: 5px;
            color: #3c4043;
            font-size: 14px;
            font-weight: 600;
          }
          .lang-section {
            padding-bottom: 15px;
          }
          .lang-section:not(:last-child) {
            border-bottom: 1px solid #dadce0;
            margin-bottom: 15px;
          }
          ol {
            margin: 5px 0 0 20px;
            padding: 0;
          }
          li {
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>App Permission Status</h2>
          
          <div class="status ${hasAuth ? 'status-authorized' : 'status-required'}">
            Current Status: ${hasAuth ? 'Permissions Active & Authorized' : 'Re-Authorization Required'}
          </div>

          <p style="font-size: 14px; color: #5f6368; margin-top: 5px;">
            ${hasAuth ? 'The application currently has access to required Google services.' : 'The app needs authorization to access Google Drive and other services.'}
          </p>

          <div class="btn-container">
            ${!hasAuth ? `
              <a href="${url}" target="_blank" class="btn">Authorize Now</a>
            ` : ''}
            <a href="https://myaccount.google.com/permissions" target="_blank" class="btn btn-secondary">Manage / Revoke Google Permissions</a>
          </div>
        </div>

        <div class="card instructions">
          <div class="lang-section">
            <h3>English Instructions (How to review permissions again):</h3>
            <ol>
              <li>Click <b>"Manage / Revoke Google Permissions"</b> above to open Google Account Settings.</li>
              <li>Find this project's name (e.g. <i>Census Dashboard</i> or <i>Live Changes Report</i>) and click <b>"Remove Access"</b>.</li>
              <li>Close that window and return here.</li>
              <li>Run any task from the menu (e.g., <b>Test Drive Auth & Permissions</b>).</li>
              <li>Google will prompt you with the authorization consent screen to review and accept scopes again.</li>
            </ol>
          </div>
          
          <div class="lang-section">
            <h3>हिंदी निर्देश (अनुमति की दोबारा समीक्षा कैसे करें):</h3>
            <ol>
              <li>ऊपर दिए गए <b>"Manage / Revoke Google Permissions"</b> बटन पर क्लिक करें।</li>
              <li>इस प्रोजेक्ट का नाम खोजें और <b>"Remove Access"</b> पर क्लिक करके अनुमति हटा दें।</li>
              <li>विंडो बंद करें और वापस इस Google Sheet पर आएं।</li>
              <li>मेन्यू से <b>Test Drive Auth & Permissions</b> विकल्प चलाएं।</li>
              <li>Google आपको फिर से अनुमति देने और समीक्षा (Authorization review) करने का स्क्रीन दिखाएगा।</li>
            </ol>
          </div>
        </div>
      </body>
    </html>
  `;

  const html = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(600)
    .setHeight(550)
    .setTitle('Review & Manage App Permissions');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Permissions Review Console');
}


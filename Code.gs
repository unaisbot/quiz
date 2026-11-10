/**
 * TBARC Biodiversity Quiz — Google Apps Script backend
 * Open the response Google Sheet > Extensions > Apps Script and paste this file.
 * Deploy as Web app: Execute as Me; Who has access: Anyone.
 */
const CONFIG = {
  SHEET_NAME: "Quiz Responses",
  CERTIFICATE_THRESHOLD: 70,
  ORGANISATION: "Tropical Biodiversity Action and Research Centre (TBARC India)",
  REPLY_TO: "tbarcindia@gmail.com",
  CERTIFICATE_FOLDER_ID: "" // Optional: Google Drive folder ID; blank saves in My Drive
};

// The correct answers stay on the server; they are not sent to the public quiz page.
const ANSWER_KEY = {"q01": "D", "q02": "C", "q03": "B", "q04": "B", "q05": "D", "q06": "B", "q07": "B", "q08": "B", "q09": "A", "q10": "A", "q11": "D", "q12": "D", "q13": "B", "q14": "D", "q15": "A", "q16": "C", "q17": "D", "q18": "A", "q19": "C", "q20": "C", "q21": "B", "q22": "D", "q23": "B", "q24": "C", "q25": "C", "q26": "C", "q27": "A", "q28": "B", "q29": "A", "q30": "B"};

function doGet() {
  return HtmlService.createHtmlOutput("TBARC Biodiversity Quiz service is active.");
}

function doPost(e) {
  let requestId = "";
  try {
    if (!e || !e.parameter || !e.parameter.payload) throw new Error("No submission received.");
    const payload = JSON.parse(e.parameter.payload);
    requestId = String(payload.requestId || "");
    const result = processQuiz_(payload);
    return makeResponse_(requestId, true, result, "");
  } catch (error) {
    return makeResponse_(requestId, false, null, error.message || "Unable to process the quiz.");
  }
}

function processQuiz_(payload) {
  const name = cleanText_(payload.name, 100);
  const email = String(payload.email || "").trim().toLowerCase();
  if (!name) throw new Error("Please enter your name.");
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");
  if (!Array.isArray(payload.answers) || payload.answers.length !== 20) throw new Error("Exactly 20 answers are required.");

  const seen = {};
  let score = 0;
  payload.answers.forEach(function(answer) {
    const id = String(answer.id || "");
    const value = String(answer.answer || "");
    if (seen[id]) throw new Error("Duplicate question detected.");
    seen[id] = true;
    if (!Object.prototype.hasOwnProperty.call(ANSWER_KEY, id)) throw new Error("An unrecognised question was submitted.");
    if (!["A","B","C","D"].includes(value)) throw new Error("An invalid answer was submitted.");
    if (ANSWER_KEY[id] === value) score++;
  });

  const total = 20;
  const percentage = Math.round(score / total * 100);
  const eligible = percentage >= CONFIG.CERTIFICATE_THRESHOLD;
  const referenceId = "TBQ-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + "-" + Utilities.getUuid().substring(0,8).toUpperCase();

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Open this Apps Script project from the response Google Sheet.");
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Submitted at","Reference ID","Participant name","Email","Score","Total","Percentage","Certificate status","Question IDs and answers"]);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,9).setFontWeight("bold").setBackground("#14532d").setFontColor("#ffffff");
  }
  sheet.appendRow([new Date(),referenceId,name,email,score,total,percentage,eligible?"Eligible":"Not eligible",payload.answers.map(a=>a.id+":"+a.answer).join(" | ")]);

  let certificatePdf = null;
  if (eligible) certificatePdf = createCertificate_(name, referenceId, percentage);
  sendResultEmail_(name,email,referenceId,score,total,percentage,eligible,certificatePdf);

  return {name:name,email:email,referenceId:referenceId,score:score,total:total,correct:score,incorrect:total-score,percentage:percentage,certificateEligible:eligible};
}

function createCertificate_(participantName, referenceId, percentage) {
  const doc = DocumentApp.create("TBARC Biodiversity Quiz Certificate - " + participantName);
  const body = doc.getBody();
  body.clear();
  body.setMarginTop(48).setMarginBottom(48).setMarginLeft(48).setMarginRight(48);
  let p = body.appendParagraph("TBARC INDIA");
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p.editAsText().setFontFamily("Arial").setFontSize(17).setBold(true).setForegroundColor("#14532d");
  p = body.appendParagraph("CERTIFICATE OF ACHIEVEMENT");
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);p.setSpacingBefore(28);
  p.editAsText().setFontFamily("Georgia").setFontSize(24).setBold(true).setForegroundColor("#173d25");
  p = body.appendParagraph("BIODIVERSITY QUIZ");
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p.editAsText().setFontFamily("Arial").setFontSize(12).setBold(true).setForegroundColor("#6c8f50");
  p = body.appendParagraph("This certificate is proudly presented to");
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);p.setSpacingBefore(32);
  p.editAsText().setFontFamily("Arial").setFontSize(12).setForegroundColor("#555555");
  p = body.appendParagraph(participantName);
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);p.setSpacingBefore(10);p.setSpacingAfter(10);
  p.editAsText().setFontFamily("Georgia").setFontSize(25).setBold(true).setForegroundColor("#14532d");
  p = body.appendParagraph("for successfully completing the TBARC Biodiversity Quiz and demonstrating knowledge of biodiversity, ecology and conservation.");
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p.editAsText().setFontFamily("Arial").setFontSize(12).setForegroundColor("#444444");
  p = body.appendParagraph("Score: " + percentage + "%");
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);p.setSpacingBefore(18);
  p.editAsText().setFontFamily("Arial").setFontSize(13).setBold(true).setForegroundColor("#14532d");
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd MMMM yyyy");
  p = body.appendParagraph("Issued on: " + date + "     |     Certificate ID: " + referenceId);
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);p.setSpacingBefore(25);
  p.editAsText().setFontFamily("Arial").setFontSize(9).setForegroundColor("#666666");
  p = body.appendParagraph(CONFIG.ORGANISATION);
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);p.setSpacingBefore(20);
  p.editAsText().setFontFamily("Arial").setFontSize(10).setBold(true).setForegroundColor("#14532d");
  doc.saveAndClose();

  const docFile = DriveApp.getFileById(doc.getId());
  const pdf = docFile.getAs(MimeType.PDF).setName("TBARC-Biodiversity-Certificate-" + referenceId + ".pdf");
  docFile.setTrashed(true);
  if (CONFIG.CERTIFICATE_FOLDER_ID) {
    DriveApp.getFolderById(CONFIG.CERTIFICATE_FOLDER_ID).createFile(pdf);
  } else {
    DriveApp.createFile(pdf);
  }
  return pdf;
}

function sendResultEmail_(name,email,referenceId,score,total,percentage,eligible,certificatePdf) {
  const message = [
    "Dear " + name + ",",
    "",
    "Thank you for participating in the TBARC Biodiversity Quiz.",
    "Your score: " + score + " / " + total,
    "Percentage: " + percentage + "%",
    "Reference ID: " + referenceId,
    "",
    eligible ? "Congratulations! You qualified for a certificate. Your PDF certificate is attached." :
      "A certificate is awarded for scores of " + CONFIG.CERTIFICATE_THRESHOLD + "% or above. Keep learning and try again!",
    "",
    "With regards,",
    "TBARC India",
    CONFIG.ORGANISATION
  ].join("\\n");
  const options = {to:email,subject:"Your TBARC Biodiversity Quiz Result",body:message,name:"TBARC India",replyTo:CONFIG.REPLY_TO};
  if (certificatePdf) options.attachments = [certificatePdf];
  MailApp.sendEmail(options);
}

function makeResponse_(requestId, ok, result, message) {
  const data = {type:"TBARC_QUIZ_RESPONSE",requestId:requestId,ok:ok,result:result,message:message};
  const json = JSON.stringify(data).replace(/</g,"\\\\u003c");
  const html = "<!doctype html><html><body><script>window.parent.postMessage(" + json + ",'*');</script></body></html>";
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function cleanText_(value,maxLength) {
  return String(value || "").replace(/[<>]/g,"").trim().substring(0,maxLength);
}

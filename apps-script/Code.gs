/**
 * טפסי משתלת חבצלת, גרסה 2.
 *
 * תומך גם בטופס הזר האישי הישן (בלי שדה form) וגם בטפסים חדשים:
 *   { form: "bouquets-today" | "receiving" | "waste", fields: { "שם עמודה": ערך }, photoDataUrl?: "data:image/..." }
 *
 * כדי שהטפסים החדשים יישמרו ללשוניות, צריך לעדכן את הפריסה הקיימת (לא ליצור פריסה חדשה),
 * כדי שכתובת ה-/exec תישאר אותה כתובת.
 *
 * פריסה מחדש, פעם אחת, בחשבון poppelor@gmail.com:
 * 1. לפתוח את הגיליון "דיווח זרים בהתאמה אישית - דמו".
 * 2. תוספים > Apps Script.
 * 3. להחליף את Code.gs בתוכן הקובץ הזה, ולשמור.
 * 4. פריסה > ניהול פריסות > על הפריסה הקיימת (אפליקציית אינטרנט) ללחוץ על עיפרון.
 * 5. ב"גרסה" לבחור "גרסה חדשה", ולאשר פריסה.
 *    להשאיר: הרצה בתור — אני; מי יש לו גישה — כל אחד.
 *    לא ליצור פריסה חדשה, כדי שהכתובת לא תשתנה.
 */
const SPREADSHEET_ID = "1l_JPnqbnNw5dmrVyC6e7q0_EUOnVGSuPij3Ub1Qnoes";
const FORM_TABS = {
  "zer-ishi": "דיווחים",
  "bouquets-today": "זרים שהוכנו",
  "receiving": "קבלת סחורה",
  "waste": "בלאי"
};

function doGet() {
  return json_({ ok: true, service: "havatzelet-forms", version: 2 });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (!data.form) {
      return legacyZerIshi_(data);
    }
    const tabName = FORM_TABS[data.form];
    if (!tabName) {
      return json_({ ok: false, error: "unknown form" });
    }
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      return json_({ ok: false, error: "missing tab" });
    }
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const fields = data.fields || {};
    let photoLink = fields["צילום"] || data.photo || "";
    if (data.photoDataUrl && String(data.photoDataUrl).indexOf("data:image") === 0) {
      photoLink = savePhoto_(data.photoDataUrl, data.photo, data.form);
    }
    const row = headers.map(function (h) {
      if (!h) return "";
      if (h === "חותמת זמן") return new Date();
      if (h === "צילום") return photoLink;
      const v = fields[h];
      return v === undefined || v === null ? "" : v;
    });
    sheet.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function legacyZerIshi_(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("דיווחים");
  const now = new Date();
  let photoLink = data.photo || "";
  if (data.photoDataUrl && String(data.photoDataUrl).indexOf("data:image") === 0) {
    photoLink = savePhoto_(data.photoDataUrl, data.photo, "zer-ishi");
  }
  sheet.appendRow([
    now,
    data.date || "",
    data.who || "",
    Number(data.rose || 0),
    Number(data.lisianthus || 0),
    Number(data.greenery || 0),
    data.wrapping || "",
    Number(data.raw || 0),
    Number(data.calculated || 0),
    Number(data.finalPrice || 0),
    data.notes || "",
    photoLink
  ]);
  return json_({ ok: true });
}

function savePhoto_(dataUrl, filename, form) {
  try {
    const folderName = "צילומי טפסי חבצלת - דמו";
    const folders = DriveApp.getFoldersByName(folderName);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    const parts = String(dataUrl).split(",");
    const mime = String(dataUrl).indexOf("image/png") >= 0 ? "image/png" : "image/jpeg";
    const ext = mime === "image/png" ? ".png" : ".jpg";
    const blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), mime, filename || (form + "-" + Date.now() + ext));
    const file = folder.createFile(blob);
    return file.getUrl();
  } catch (err) {
    return filename || "צילום לא נשמר";
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

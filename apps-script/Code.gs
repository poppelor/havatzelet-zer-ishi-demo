/**
 * סקריפט מוכן לפריסה חד-פעמית, כדי שהטופס בטלפון ישמור שורות בגיליון.
 *
 * איך לפרוס (פעם אחת, מחשבון גוגל של אור):
 * 1. פותחים את הגיליון "דיווח זרים בהתאמה אישית - דמו".
 * 2. תוספים > Apps Script, מדביקים את הקובץ הזה במקום הקוד הריק, ושומרים.
 * 3. פריסה > פריסה חדשה > אפליקציית אינטרנט.
 *    - הרצה בתור: אני
 *    - מי יש לו גישה: כל אחד
 * 4. מעתיקים את כתובת האפליקציה, ומדביקים אותה ב-index.html במשתנה ENDPOINT.
 *
 * מזהה הגיליון כבר משובץ כאן.
 */
const SPREADSHEET_ID = "1l_JPnqbnNw5dmrVyC6e7q0_EUOnVGSuPij3Ub1Qnoes";
const TAB_NAME = "דיווחים";

function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TAB_NAME);
  const data = JSON.parse(e.postData.contents);
  const now = new Date();
  let photoLink = data.photo || "";

  if (data.photoDataUrl && String(data.photoDataUrl).indexOf("data:image") === 0) {
    try {
      const folderName = "צילומי זרים בהתאמה אישית - דמו";
      const folders = DriveApp.getFoldersByName(folderName);
      const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      const parts = String(data.photoDataUrl).split(",");
      const blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), "image/jpeg", data.photo || ("zer-" + now.getTime() + ".jpg"));
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      photoLink = file.getUrl();
    } catch (err) {
      photoLink = data.photo || "צילום לא נשמר";
    }
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

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "zer-ishi-demo" }))
    .setMimeType(ContentService.MimeType.JSON);
}

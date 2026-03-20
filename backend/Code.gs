var ENABLE_DRIVE_OCR = true;

function doGet() {
  return jsonResponse_({
    ok: true,
    service: "NoteCam backend",
    date: new Date().toISOString(),
  });
}

function doPost(e) {
  try {
    var payload = parsePayload_(e);
    var action = payload.action || "health";

    if (action === "health") {
      return jsonResponse_({ ok: true, message: "Backend is healthy." });
    }

    if (action === "uploadImage") {
      return jsonResponse_(handleUploadImage_(payload));
    }

    if (action === "uploadExtractedText") {
      return jsonResponse_(handleUploadExtractedText_(payload));
    }

    if (action === "appendOcrText") {
      return jsonResponse_(handleAppendOcrText_(payload));
    }

    if (action === "extractOcr") {
      return jsonResponse_(handleExtractOcr_(payload));
    }

    return jsonResponse_({ ok: false, message: "Unknown action: " + action });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: error && error.message ? error.message : String(error),
    });
  }
}

function handleUploadImage_(payload) {
  validateRequired_(payload, [
    "docId",
    "docName",
    "imageBase64",
    "mimeType",
    "timestamp",
  ]);

  var doc = DocumentApp.openById(payload.docId);
  var body = doc.getBody();
  var imageBlob = base64ToBlob_(payload.imageBase64, payload.mimeType);
  var ocrText = "";

  appendUploadHeader_(body);

  if (payload.note) {
    body.appendParagraph("Note: " + payload.note);
  }

  body.appendImage(imageBlob);

  if (payload.includeOcr) {
    ocrText = extractTextFromImage_(payload.imageBase64, payload.mimeType);
    if (ocrText) {
      body.appendParagraph("OCR:");
      body.appendParagraph(ocrText);
    }
  }

  body.appendParagraph("");
  doc.saveAndClose();

  return {
    ok: true,
    message: "Image appended to Google Doc.",
    ocrText: ocrText,
  };
}

function handleAppendOcrText_(payload) {
  validateRequired_(payload, ["docId", "docName", "ocrText", "timestamp"]);

  var doc = DocumentApp.openById(payload.docId);
  var body = doc.getBody();

  appendUploadHeader_(body);
  if (payload.note) {
    body.appendParagraph("Note: " + payload.note);
  }
  body.appendParagraph("Extracted text:");
  body.appendParagraph(payload.ocrText);
  body.appendParagraph("");

  doc.saveAndClose();

  return {
    ok: true,
    message: "OCR text appended to Google Doc.",
  };
}

function handleUploadExtractedText_(payload) {
  validateRequired_(payload, [
    "docId",
    "docName",
    "imageBase64",
    "mimeType",
    "timestamp",
  ]);

  if (!ENABLE_DRIVE_OCR) {
    return {
      ok: false,
      message:
        "OCR is not enabled in Apps Script yet. Set ENABLE_DRIVE_OCR = true and enable the Advanced Drive service to upload extracted text.",
      ocrText: "",
    };
  }

  var ocrText = extractTextFromImage_(payload.imageBase64, payload.mimeType);
  var doc = DocumentApp.openById(payload.docId);
  var body = doc.getBody();

  appendUploadHeader_(body);
  if (payload.note) {
    body.appendParagraph("Note: " + payload.note);
  }
  body.appendParagraph("Extracted text:");
  body.appendParagraph(ocrText || "[No text detected]");
  body.appendParagraph("");

  doc.saveAndClose();

  return {
    ok: true,
    message: ocrText
      ? "Extracted text appended to Google Doc."
      : "No text was detected, but a placeholder entry was appended.",
    ocrText: ocrText,
  };
}

function handleExtractOcr_(payload) {
  validateRequired_(payload, ["imageBase64", "mimeType"]);

  if (!ENABLE_DRIVE_OCR) {
    return {
      ok: false,
      message:
        "OCR is not enabled in Apps Script yet. Set ENABLE_DRIVE_OCR = true and enable the Advanced Drive service to finish this feature.",
      ocrText: "",
    };
  }

  var ocrText = extractTextFromImage_(payload.imageBase64, payload.mimeType);
  return {
    ok: true,
    message: ocrText
      ? "OCR complete."
      : "OCR complete, but no text was returned.",
    ocrText: ocrText,
  };
}

function extractTextFromImage_(imageBase64, mimeType) {
  if (!ENABLE_DRIVE_OCR) {
    return "";
  }

  var imageBlob = base64ToBlob_(imageBase64, mimeType);
  var tempFile = Drive.Files.create(
    {
      name: "NoteCam OCR " + new Date().toISOString(),
      mimeType: mimeType,
    },
    imageBlob,
    {
      ocrLanguage: "en",
    },
  );

  var convertedDoc = Drive.Files.copy(
    {
      name: "NoteCam OCR Text " + new Date().toISOString(),
      mimeType: MimeType.GOOGLE_DOCS,
    },
    tempFile.id,
  );

  var textDoc = DocumentApp.openById(convertedDoc.id);
  var text = textDoc.getBody().getText();

  DriveApp.getFileById(tempFile.id).setTrashed(true);
  DriveApp.getFileById(convertedDoc.id).setTrashed(true);

  return text || "";
}

function appendUploadHeader_(body) {
  body.appendParagraph("--------------------------------------------------");
  body.appendParagraph("Uploaded: " + formatTimestamp_(new Date().toISOString()));
}

function formatTimestamp_(value) {
  var date = new Date(value);
  if (isNaN(date.getTime())) {
    return value;
  }

  var formatted = Utilities.formatDate(
    date,
    Session.getScriptTimeZone() || "America/Los_Angeles",
    "MM-dd-yyyy 'at' h:mm a",
  );

  return formatted.replace("AM", "am").replace("PM", "pm");
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  return JSON.parse(e.postData.contents);
}

function validateRequired_(payload, keys) {
  for (var i = 0; i < keys.length; i += 1) {
    if (!payload[keys[i]]) {
      throw new Error("Missing required field: " + keys[i]);
    }
  }
}

function base64ToBlob_(imageBase64, mimeType) {
  var bytes = Utilities.base64Decode(imageBase64);
  return Utilities.newBlob(bytes, mimeType, "notecam-upload");
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

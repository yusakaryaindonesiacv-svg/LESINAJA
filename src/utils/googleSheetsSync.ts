/**
 * Google Apps Script backend generator & Supabase Schema Exporter for LESIN AJA LMS
 */

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * LESIN AJA - Google Sheets LMS Backend Script
 * 
 * CARA PEMASANGAN:
 * 1. Buka Google Sheets baru di https://sheets.new
 * 2. Klik menu 'Ekstensi' > 'Apps Script'
 * 3. Hapus semua kode default, paste seluruh kode ini
 * 4. Klik 'Deploy' (Terapkan) > 'New Deployment' (Penerapan Baru)
 * 5. Pilih tipe 'Web App', set 'Execute as: Me' dan 'Who has access: Anyone'
 * 6. Copy Web App URL dan tempelkan ke Pengaturan Database LESIN AJA
 */

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet USERS
  let userSheet = ss.getSheetByName("USERS");
  if (!userSheet) {
    userSheet = ss.insertSheet("USERS");
    userSheet.appendRow(["ID", "Name", "Email", "Role", "Phone", "EnrolledCourses", "CreatedAt", "Institution"]);
    userSheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#4f46e5").setFontColor("#ffffff");
  }
  
  // Sheet COURSES
  let courseSheet = ss.getSheetByName("COURSES");
  if (!courseSheet) {
    courseSheet = ss.insertSheet("COURSES");
    courseSheet.appendRow(["ID", "Title", "Category", "Level", "Price", "StudentsCount", "Rating", "ModulesCount", "UpdatedAt"]);
    courseSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#4f46e5").setFontColor("#ffffff");
  }

  // Sheet TRANSACTIONS
  let trxSheet = ss.getSheetByName("TRANSACTIONS");
  if (!trxSheet) {
    trxSheet = ss.insertSheet("TRANSACTIONS");
    trxSheet.appendRow(["Code", "StudentName", "StudentEmail", "CourseTitle", "Amount", "Method", "Status", "CreatedAt", "PaidAt"]);
    trxSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#4f46e5").setFontColor("#ffffff");
  }

  // Sheet PROGRESS
  let progSheet = ss.getSheetByName("PROGRESS");
  if (!progSheet) {
    progSheet = ss.insertSheet("PROGRESS");
    progSheet.appendRow(["StudentID", "CourseID", "CompletedModules", "QuizScores", "CertClaimed", "LastActive"]);
    progSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#4f46e5").setFontColor("#ffffff");
  }
  
  return "Database Sheets berhasil di-generate secara otomatis!";
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.payload;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "SYNC_ALL") {
      setupDatabase();
      
      // Update Users
      if (payload.users && payload.users.length) {
        const uSheet = ss.getSheetByName("USERS");
        uSheet.clearContents();
        uSheet.appendRow(["ID", "Name", "Email", "Role", "Phone", "EnrolledCourses", "CreatedAt", "Institution"]);
        payload.users.forEach(u => {
          uSheet.appendRow([u.id, u.name, u.email, u.role, u.phone || "", (u.enrolledCourseIds || []).join(", "), u.createdAt, u.institution || ""]);
        });
      }

      // Update Transactions
      if (payload.transactions && payload.transactions.length) {
        const tSheet = ss.getSheetByName("TRANSACTIONS");
        tSheet.clearContents();
        tSheet.appendRow(["Code", "StudentName", "StudentEmail", "CourseTitle", "Amount", "Method", "Status", "CreatedAt", "PaidAt"]);
        payload.transactions.forEach(t => {
          tSheet.appendRow([t.transactionCode, t.studentName, t.studentEmail, t.courseTitle, t.amount, t.paymentMethod, t.status, t.createdAt, t.paidAt || ""]);
        });
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Sinkronisasi berhasil!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Action tidak dikenali" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "LESIN AJA Google Sheets Backend API is Active.",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

import { SUPABASE_SQL_SCHEMA_FULL } from './supabaseClient';

export const SUPABASE_SQL_SCHEMA = SUPABASE_SQL_SCHEMA_FULL;


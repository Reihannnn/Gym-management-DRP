const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const db = require("./database/db");
const AttendanceService = require("./service/attendance.service");
const runMigrations = require("./database/migrations");
const XLSX = require("xlsx");
const fs = require("fs");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "public/assets/icon/drp_logo.ico"),
  });

  win.loadFile("index.html");
};

// exit program
ipcMain.on("app:exit", () => {
  app.quit();
});

// MPA (open different html page )
ipcMain.on("open-page", (event, page) => {
  const win = BrowserWindow.getFocusedWindow();
  win.loadFile(page);
});

app.commandLine.appendSwitch("disable-features", "AutofillServerCommunication");

app.whenReady().then(async () => {
  await runMigrations();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// function auto update member status
async function autoUpdateAllMemberStatus() {
  const members = await db.allAsync(`SELECT id FROM member`);

  for (const m of members) {
    const latest = await db.getAsync(
      `SELECT end_date FROM membership 
       WHERE member_id=? 
       ORDER BY date(end_date) DESC LIMIT 1`,
      [m.id],
    );

    let newStatus = "Non Active";

    if (latest) {
      const today = new Date();
      const end = new Date(latest.end_date);

      newStatus = today <= end ? "Active" : "Non Active";
    }

    await db.runAsync(`UPDATE member SET status=? WHERE id=?`, [
      newStatus,
      m.id,
    ]);
  }

  return true;
}

// ========= HANDLE CRUD MEMBER (CREATE, READ , UPDATE , DELETE )  =============

// CREATE NEW MEMBER
ipcMain.handle("member:add", async (event, data) => {
  return await db.runAsync(
    `INSERT INTO member (nama, alamat, status, no_telp)
    VALUES (?, ?, ?, ?)`,
    [data.nama, data.alamat, data.status, data.no_telp],
  );
});

// READ / GET / SELECT MEMBER
ipcMain.handle("member:list", async () => {
  return await db.allAsync("SELECT * FROM member ORDER BY id DESC");
});

// GET / READ  BY ONE ID
ipcMain.handle("member:getById", async (event, id) => {
  return await db.getAsync(`SELECT * FROM member WHERE id = ?`, [id]);
});

// UPDATE MEMBER
ipcMain.handle("member:update", async (event, data) => {
  return await db.runAsync(
    `UPDATE member
     SET
        nama = ?,
        alamat = ?,
        no_telp = ?,
        uid_card = ?
     WHERE id = ?`,
    [data.nama, data.alamat, data.no_telp, data.uid_card, data.id],
  );
});

// UPDATE STATUS MEMBER
ipcMain.handle("member:autoUpdateAll", autoUpdateAllMemberStatus);

// DELETE MEMBER
ipcMain.handle("member:delete", async (event, id) => {
  return await db.runAsync(`DELETE FROM member WHERE id=?`, [id]);
});

// CHECK DUPLICATE MEMBER
ipcMain.handle("checkMemberExist", (event, nama) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM member WHERE nama = ?`, [nama], (err, row) => {
      if (err) reject(err);
      resolve(row ? true : false); // kalau ada row berarti nama sudah terdaftar
    });
  });
});

// ========= HANDLE CRUD MEMBERSHIP (CREATE, READ , UPDATE , DELETE )  =============

// CREATE MEMBERSHIP
ipcMain.handle("membership:add", async (event, data) => {
  try {
    const membership = await db.runAsync(
      `INSERT INTO membership (member_id, start_date, end_date)
       VALUES (?, ?, ?)`,
      [data.member_id, data.start_date, data.end_date],
    );

    // Auto income
    const bulan = data.start_date.substring(5, 7);
    const tahun = data.start_date.substring(0, 4);

    // RUN INCOME AFTER ADD MEMBERSHIP
    // await db.runAsync(
    //   `INSERT INTO income (member_id, amount, payment_date, bulan, tahun, keterangan)
    //    VALUES (?, ?, DATE('now'), ?, ?, ?)`,
    //   [data.member_id, data.amount, bulan, tahun, "Pembayaran membership"]
    // );

    return { success: true, id: membership.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// GET MEMBERSHIP

ipcMain.handle("membership:list", async () => {
  return await db.allAsync(`SELECT * FROM membership`);
});

// GET / SELECT / READ MEMBERSHIP BY MEMBER ID
ipcMain.handle("membership:listByMember", async (event, member_id) => {
  return await db.allAsync(
    `SELECT * FROM membership WHERE member_id=? ORDER BY id DESC`,
    [member_id],
  );
});

// GET / READ  MEMBERSHIP BY ID
ipcMain.handle("membership:getById", async (event, id) => {
  return await db.getAsync("SELECT * FROM membership WHERE id = ?", [id]);
});

// GET ALL MEMBERSHIP WITH NAME USE MEMBER_ID
ipcMain.handle("getAllMembershipWithName:list", (event) => {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT 
        membership.id,
        member.nama AS name,
        membership.start_date,
        membership.end_date
      FROM membership
      JOIN member ON member.id = membership.member_id
      ORDER BY membership.id DESC
      `,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      },
    );
  });
});

// UPDATE MEMBERSHIP
ipcMain.handle("membership:update", async (event, data) => {
  return await db.runAsync(
    `UPDATE membership SET start_date=?, end_date=? WHERE id=?`,
    [data.start_date, data.end_date, data.id],
  );
});

// DELETE MEMBERSHIP
ipcMain.handle("membership:delete", async (event, id) => {
  return await db.runAsync(`DELETE FROM membership WHERE id=?`, [id]);
});

// GET INCOME LIST
ipcMain.handle("income:list", async () => {
  return await db.allAsync(`
    SELECT income.*, member.nama 
    FROM income
    LEFT JOIN member ON income.member_id = member.id
    ORDER BY income.id DESC
  `);
});

// ========= HANDLE CRUD ATTENDANCE =============

// ADD ATTENDANCE
ipcMain.handle("attendance:add", async (event, data) => {
  return await db.runAsync(
    `INSERT INTO attendance (member_id, nama, no_telp)
     VALUES (?, ?, ?)`,
    [data.member_id, data.nama, data.no_telp],
  );
});

// LIST ALL ATTENDANCE
ipcMain.handle("attendance:list", async () => {
  return await db.allAsync(
    `SELECT *, DATE(created_at) as tanggal, 
     TIME(created_at) as jam 
     FROM attendance ORDER BY created_at DESC`
  );
});

// GET ATTENDANCE BY DATE (WIB)
ipcMain.handle("attendance:byDate", async (event, date) => {
  return await db.allAsync(
    `SELECT *, DATE(created_at) as tanggal,
     TIME(created_at) as jam
     FROM attendance 
     WHERE DATE(created_at) = DATE(?)
     ORDER BY created_at DESC`,
    [date],
  );
});

// GET ATTENDANCE BY DATE RANGE (WIB)
ipcMain.handle(
  "attendance:byDateRange",
  async (event, { startDate, endDate }) => {
    return await db.allAsync(
      `SELECT *, DATE(created_at) as tanggal,
       TIME(created_at) as jam
       FROM attendance 
       WHERE DATE(created_at) >= DATE(?)
       AND DATE(created_at) <= DATE(?)
       ORDER BY created_at DESC`,
      [startDate, endDate],
    );
  },
);

// DELETE ATTENDANCE
ipcMain.handle("attendance:delete", async (event, id) => {
  return await db.runAsync(`DELETE FROM attendance WHERE id=?`, [id]);3132689978
  
});

// EXPORT ATTENDANCE TO EXCEL
ipcMain.handle("attendance:exportExcel", async (event, { data, filter }) => {
  try {
    const workbook = XLSX.utils.book_new();

    const worksheetData = [
      ["Laporan Absensi DRP Gym"],
      [`Filter: ${filter}`],
      [],
      ["No", "Nama", "No Telepon", "Tanggal", "Jam"],
      ...data.map((item, index) => [
        index + 1,
        item.nama,
        item.no_telp || "-",
        item.tanggal,
        item.jam,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi");

    const savePath = dialog.showSaveDialogSync({
      title: "Save Absensi Excel",
      defaultPath: `Absensi-${filter}.xlsx`,
      filters: [{ name: "Excel File", extensions: ["xlsx"] }],
    });

    if (!savePath) return false;

    XLSX.writeFile(workbook, savePath);
    return true;
  } catch (err) {
    console.error("Export Excel Error:", err);
    return false;
  }
});

// EXPORT ATTENDANCE TO PDF
ipcMain.handle("attendance:exportPDF", async (event, { data, filter }) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // Portrait A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const marginX = 40;
    let y = 780;

    // Title
    page.drawText("Laporan Absensi DRP Gym", {
      x: marginX,
      y,
      size: 22,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    y -= 30;

    // Subtitle / filter
    page.drawText(`Filter: ${filter}`, {
      x: marginX,
      y,
      size: 12,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    y -= 10;

    // Garis pemisah
    page.drawLine({
      start: { x: marginX, y },
      end: { x: 555, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 25;

    // Header tabel
    const colNo = marginX;
    const colNama = marginX + 40;
    const colTelp = marginX + 200;
    const colTanggal = marginX + 320;
    const colJam = marginX + 440;

    const headers = [
      { text: "No", x: colNo },
      { text: "Nama", x: colNama },
      { text: "No Telp", x: colTelp },
      { text: "Tanggal", x: colTanggal },
      { text: "Jam", x: colJam },
    ];

    // Header background
    page.drawRectangle({
      x: marginX,
      y: y - 22,
      width: 515,
      height: 25,
      color: rgb(0.93, 0.93, 0.93),
    });

    headers.forEach((h) => {
      page.drawText(h.text, {
        x: h.x,
        y: y - 17,
        size: 10,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });
    });

    y -= 30;

    // Data rows
    data.forEach((item, index) => {
      // Cek jika halaman penuh, buat halaman baru
      if (y < 60) {
        page = pdfDoc.addPage([595, 842]);
        y = 780;
      }

      const rowData = [
        { text: String(index + 1), x: colNo },
        { text: item.nama || "-", x: colNama },
        { text: item.no_telp || "-", x: colTelp },
        { text: item.tanggal || "-", x: colTanggal },
        { text: item.jam || "-", x: colJam },
      ];

      // Alternating row color
      if (index % 2 === 0) {
        page.drawRectangle({
          x: marginX,
          y: y - 18,
          width: 515,
          height: 20,
          color: rgb(0.97, 0.97, 0.97),
        });
      }

      // Garis bawah baris
      page.drawLine({
        start: { x: marginX, y: y - 20 },
        end: { x: 555, y: y - 20 },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9),
      });

      rowData.forEach((cell) => {
        page.drawText(cell.text, {
          x: cell.x,
          y: y - 15,
          size: 9,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
      });

      y -= 22;
    });

    // Footer
    y -= 20;
    page.drawLine({
      start: { x: marginX, y },
      end: { x: 555, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 15;
    page.drawText(`Total: ${data.length} data`, {
      x: marginX,
      y,
      size: 10,
      font: fontBold,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Save PDF
    const savePath = dialog.showSaveDialogSync({
      title: "Save Absensi PDF",
      defaultPath: `Absensi-${filter}.pdf`,
      filters: [{ name: "PDF File", extensions: ["pdf"] }],
    });

    if (!savePath) return false;

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(savePath, pdfBytes);

    return true;
  } catch (err) {
    console.error("Export PDF Error:", err);
    return false;
  }
});

// SEARCH MEMBER
ipcMain.handle("search-member", (event, keyword) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, nama FROM member WHERE nama LIKE ?`,
      [`%${keyword}%`],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      },
    );
  });
});

// export excel
ipcMain.handle("export-excel", async (event, { data, fileName }) => {
  try {
    // pilih lokasi penyimpanan
    const { filePath } = await dialog.showSaveDialog({
      title: "Save Excel",
      defaultPath: fileName,
      filters: [{ name: "Excel File", extensions: ["xlsx"] }],
    });

    if (!filePath) return; // user cancel

    // Generate workbook
    const workSheet = XLSX.utils.json_to_sheet(data);
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, "Daftar Member");

    // Simpan file
    XLSX.writeFile(workBook, filePath);

    return { success: true };
  } catch (err) {
    console.error("Export Error:", err);
    return { success: false, error: err };
  }
});

ipcMain.handle("print-membership-excel", async (event, year) => {
  const win = BrowserWindow.getFocusedWindow();

  // ⛔ Ambil data tabel dari renderer
  const tableData = await win.webContents.executeJavaScript(`
    (() => {
      const rows = [...document.querySelectorAll("#memberTable tr")];
      return rows.map(row => {
        return [...row.querySelectorAll("td")].map(td => td.innerText);
      });
    })();
  `);

  // HEADER
  const header = [
    "Nama",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Des",
  ];

  const wsData = [header, ...tableData];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Membership-${year}`);

  const filePath = path.join(
    process.env.HOME || process.env.USERPROFILE,
    `Membership-${year}.xlsx`,
  );
  XLSX.writeFile(wb, filePath);

  return filePath;
});

// export to pdf file
// export membership to PDF by year
ipcMain.handle("print-membership-pdf", async (event, { year, tableData }) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // Landscape A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Layout
    const marginX = 40;
    let y = 540;

    const nameColumnWidth = 120;
    const columnWidth = 55;
    const rowHeight = 28;

    // Draw Title
    page.drawText(`Membership Report - ${year}`, {
      x: marginX,
      y,
      size: 26,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    y -= 45;

    // Header
    const headers = [
      "Nama",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Des",
    ];

    let x = marginX;

    headers.forEach((header, idx) => {
      const width = idx === 0 ? nameColumnWidth : columnWidth;

      // header background
      page.drawRectangle({
        x,
        y: y - rowHeight,
        width,
        height: rowHeight,
        color: rgb(0.9, 0.9, 0.9),
        borderWidth: 1,
        borderColor: rgb(0.6, 0.6, 0.6),
      });

      // header text
      page.drawText(header, {
        x: x + 5,
        y: y - rowHeight + 8,
        size: 12,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      x += width;
    });

    y -= rowHeight;

    // Draw Rows
    tableData.forEach((row) => {
      x = marginX;

      row.forEach((cell, idx) => {
        const width = idx === 0 ? nameColumnWidth : columnWidth;

        // cell border
        page.drawRectangle({
          x,
          y: y - rowHeight,
          width,
          height: rowHeight,
          borderWidth: 1,
          borderColor: rgb(0.75, 0.75, 0.75),
        });

        // text
        const text = cell || "----";

        page.drawText(text, {
          x: x + 5,
          y: y - rowHeight + 8,
          size: 11,
          font,
          color: rgb(0, 0, 0),
        });

        x += width;
      });

      y -= rowHeight;
    });

    // Save PDF
    const savePath = dialog.showSaveDialogSync({
      title: "Save Membership PDF",
      defaultPath: `Membership-${year}.pdf`,
      filters: [{ name: "PDF File", extensions: ["pdf"] }],
    });

    if (!savePath) return false;

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(savePath, pdfBytes);

    return true;
  } catch (err) {
    console.error("Error PDF:", err);
    return false;
  }
});

//print excel membership data
ipcMain.handle(
  "export-membership-excel",
  async (event, { year, tableData }) => {
    try {
      const workbook = XLSX.utils.book_new();

      const worksheet = XLSX.utils.aoa_to_sheet([
        [
          "Nama",
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "Mei",
          "Jun",
          "Jul",
          "Ags",
          "Sep",
          "Okt",
          "Nov",
          "Des",
        ],
        ...tableData,
      ]);

      XLSX.utils.book_append_sheet(workbook, worksheet, "Membership");

      const savePath = dialog.showSaveDialogSync({
        title: "Save Membership Excel",
        defaultPath: `Membership-${year}.xlsx`,
        filters: [{ name: "Excel File", extensions: ["xlsx"] }],
      });

      if (!savePath) return false;

      XLSX.writeFile(workbook, savePath);

      return true;
    } catch (err) {
      console.error("Error Excel:", err);
      return false;
    }
  },
);

//dashboard KPI analisa dasar
ipcMain.handle("stats:membershipPerMonth", async (event, { year }) => {
  const rows = await db.allAsync(
    `
    SELECT 
      strftime('%m', start_date) AS month,
      COUNT(*) AS total
    FROM membership
    WHERE strftime('%Y', start_date) = ?
    GROUP BY month
    ORDER BY month ASC
  `,
    [year],
  );

  return rows;
});

ipcMain.handle("stats:activeThisMonth", async () => {
  return await db.getAsync(`
    SELECT COUNT(*) AS aktif
    FROM member
    WHERE status = 'Active'
  `);
});

ipcMain.handle("stats:expiringSoon", async () => {
  return await db.allAsync(`
    SELECT 
      member.nama, membership.end_date
    FROM membership
    JOIN member ON member.id = membership.member_id
    WHERE date(membership.end_date) <= date('now', '+5 day')
      AND date(membership.end_date) >= date('now')
    ORDER BY membership.end_date ASC
  `);
});

// open browser external lewat shellscript
// main.js
let waWindow = null;

ipcMain.on("open-external", (event, url) => {
  if (waWindow && !waWindow.isDestroyed()) {
    waWindow.focus();
    waWindow.loadURL(url);
    return;
  }

  waWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "WhatsApp Web",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  waWindow.loadURL(url); // url = https://wa.me/...

  waWindow.on("closed", () => {
    waWindow = null;
  });
});

// ========= VOICE PLAYER (from Main Process) =============
// Audio di-play dari main process supaya ga ke-kill saat renderer reload
const VOICE_DIR = path.join(__dirname, "public", "assets", "voice");

ipcMain.handle("voice:play", async (event, fileName) => {
  return new Promise((resolve) => {
    const filePath = path.join(VOICE_DIR, fileName).replace(/\\/g, "/");
    const fileUri = `file:///${filePath}`;

    const ps = [
      `Add-Type -AssemblyName presentationCore`,
      `$p = New-Object System.Windows.Media.MediaPlayer`,
      `$p.Open([uri]'${fileUri}')`,
      `$p.Play()`,
      `Start-Sleep -Seconds 3`,
      `$p.Close()`,
    ].join("; ");

    exec(
      `powershell -WindowStyle Hidden -Command "${ps}"`,
      { windowsHide: true },
      () => resolve()
    );
  });
});

// Ambil total membership periode tgl 25 -> 25 berikutnya
ipcMain.handle("membership:getTotalPeriode25", async () => {
  try {
    const now = new Date();

    const currentDay = now.getDate();

    let periodeMonth;
    let periodeYear;

    // ===============================
    // RULE:
    // tanggal 25 - akhir bulan = bulan berikutnya
    // tanggal 1 - 24 = bulan sekarang
    // ===============================

    if (currentDay >= 25) {
      periodeMonth = now.getMonth() + 1; // next month
      periodeYear = now.getFullYear();

      // kalau desember +1 => januari tahun depan
      if (periodeMonth > 11) {
        periodeMonth = 0;
        periodeYear += 1;
      }
    } else {
      periodeMonth = now.getMonth(); // current month
      periodeYear = now.getFullYear();
    }

    // contoh:
    // April 2026 =>
    // start = 25 Maret 2026
    // end   = 25 April 2026

    const startDate = new Date(periodeYear, periodeMonth - 1, 25);
    const endDate = new Date(periodeYear, periodeMonth, 25);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    const total = await new Promise((resolve, reject) => {
      db.get(
        `
        SELECT COUNT(*) as total
        FROM membership
        WHERE DATE(start_date) >= DATE(?)
        AND DATE(start_date) < DATE(?)
        `,
        [start, end],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.total);
        },
      );
    });

    const monthLabel = new Date(periodeYear, periodeMonth, 1).toLocaleString(
      "id-ID",
      {
        month: "long",
        year: "numeric",
      },
    );

    return {
      success: true,
      total,
      start,
      end,
      monthLabel,
    };
  } catch (error) {
    console.log(error);

    return {
      success: false,
      total: 0,
    };
  }
});

// download excel rentang membership bulan ini dari tanggal 25 - 25
ipcMain.handle("membership:exportPeriode25Excel", async () => {
  try {
    const now = new Date();
    const currentDay = now.getDate();

    let periodeMonth;
    let periodeYear;

    // ===============================
    // RULE:
    // tanggal 25 - akhir bulan = bulan berikutnya
    // tanggal 1 - 24 = bulan sekarang
    // ===============================
    if (currentDay >= 25) {
      periodeMonth = now.getMonth() + 1; // next month
      periodeYear = now.getFullYear();

      // kalau desember -> januari tahun depan
      if (periodeMonth > 11) {
        periodeMonth = 0;
        periodeYear += 1;
      }
    } else {
      periodeMonth = now.getMonth(); // current month
      periodeYear = now.getFullYear();
    }

    // ======================================
    // CONTOH:
    // Label April 2026
    // start = 25 Maret 2026
    // end   = 25 April 2026
    // ======================================
    const startDate = new Date(periodeYear, periodeMonth - 1, 25);
    const endDate = new Date(periodeYear, periodeMonth, 25);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    // label bulan laporan
    const monthLabel = new Date(periodeYear, periodeMonth, 1).toLocaleString(
      "id-ID",
      {
        month: "long",
        year: "numeric",
      },
    );

    // ===============================
    // QUERY DATA
    // ===============================
    const rows = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          member.nama,
          membership.start_date
        FROM membership
        JOIN member 
          ON member.id = membership.member_id
        WHERE DATE(membership.start_date) >= DATE(?)
        AND DATE(membership.start_date) < DATE(?)
        ORDER BY membership.start_date ASC
        `,
        [start, end],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        },
      );
    });

    // ===============================
    // DATA EXCEL
    // ===============================
    const excelData = [
      [`Laporan Membership ${monthLabel}`],
      [`Periode ${start} s/d ${end}`],
      [],
      ["No", "Nama", "Tanggal Mulai"],
      ...rows.map((item, index) => [index + 1, item.nama, item.start_date]),
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    // lebar kolom
    worksheet["!cols"] = [{ wch: 8 }, { wch: 30 }, { wch: 18 }];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Membership");

    // ===============================
    // SAVE FILE
    // ===============================
    const savePath = dialog.showSaveDialogSync({
      title: "Save Membership Excel",
      defaultPath: `Membership-${monthLabel}.xlsx`,
      filters: [{ name: "Excel File", extensions: ["xlsx"] }],
    });

    if (!savePath) return false;

    XLSX.writeFile(workbook, savePath);

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
});

// absensi / attendanceService
ipcMain.handle("attendance:scan", async (event, uid) => {
  return await AttendanceService.handle(uid);
});

// ipcMain.on("open-external", (event, url) => { // kode lama
//   shell.openExternal(url);
// });
app.commandLine.appendSwitch("lang", "id-ID");
// if close app => also stop program ketika sedang running
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

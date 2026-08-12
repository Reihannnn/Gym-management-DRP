const sqlite3 = require("sqlite3").verbose();
const { app } = require("electron")
const path = require("path");
const fs = require("fs");
const dbPath = path.join(app.getPath("userData"), "drp-gym-management.db");
const isNewDatabase = !fs.existsSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log("Database not connected");
  } else {
    console.log("Database connected!");
  }

  if (isNewDatabase) {
    console.log("Database baru terdeteksi => membuat tabel...");
    //fungsi buat table
    createTables()
  }
});

// ==================================================================
// CREATE TABLES (hanya jalan ketika DB baru dibuat)
// ==================================================================
function createTables() {
  db.serialize(() => {
    // Table member
    db.run(`
      CREATE TABLE IF NOT EXISTS member (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        alamat TEXT,
        status TEXT NOT NULL CHECK(status IN ('Active', 'Non Active')),
        create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        no_telp TEXT
      )
    `);

    // Table membership
    db.run(`
      CREATE TABLE IF NOT EXISTS membership (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
      )
    `);

    db.run(`
        CREATE TABLE senam (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        no_handphone TEXT NOT NULL DEFAULT "N/A", 
        alamat TEXT NOT NULL DEFAULT "N/A", 
        create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `
    )
    db.run(`
        CREATE TABLE boxing (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT NOT NULL,
        no_handphone TEXT NOT NULL DEFAULT "N/A",
        alamat TEXT NOT NULL DEFAULT "N/A",
        pertemuan INTEGER NOT NULL DEFAULT 0,
        create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
    console.log("Semua tabel berhasil dibuat ✔");
  });
}

// ==================================================================
// Helper untuk query async pakai Promise
// ==================================================================
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

db.getAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = db;

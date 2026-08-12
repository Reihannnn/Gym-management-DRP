const db = require("./db");

async function runMigrations() {
  console.log("Checking database migrations...");

  // =====================================================
  // Tambah kolom uid_card jika belum ada
  // =====================================================
  try {
    const columns = await db.allAsync(`PRAGMA table_info(member)`);

    const hasUidCard = columns.some(c => c.name === "uid_card");

    if (!hasUidCard) {
      await db.runAsync(`
        ALTER TABLE member
        ADD COLUMN uid_card TEXT
      `);

      console.log("✔ member.uid_card berhasil ditambahkan");
    }

    // Pastikan uid_card unique
    await db.runAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_member_uid_card
      ON member(uid_card)
    `);

    console.log("✔ Unique index uid_card siap");

  } catch (err) {
    console.error(err);
  }

  // =====================================================
  // Attendance
  // =====================================================
  try {

    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        uid_card TEXT,
        nama TEXT NOT NULL,
        no_telp TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(member_id)
          REFERENCES member(id)
          ON DELETE CASCADE
      )
    `);

    console.log("✔ attendance siap");

  } catch (err) {
    console.error(err);
  }

  console.log("Migration selesai.");
}

module.exports = runMigrations;
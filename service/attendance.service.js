const db = require("../database/db");
const CardService = require("./card.service");
const VoiceService = require("./voice.service");

function getWIBTimestamp() {
  const now = new Date();
  const offset = 7 * 60 * 60 * 1000;
  const wib = new Date(now.getTime() + offset);
  return wib.toISOString().slice(0, 19).replace("T", " ");
}

function getWIBDate() {
  const now = new Date();
  const offset = 7 * 60 * 60 * 1000;
  const wib = new Date(now.getTime() + offset);
  return wib.toISOString().slice(0, 10);
}

class AttendanceService {
  static async handle(uid) {
    try {
      const member = await CardService.findByUID(uid);

      if (!member) {
        await VoiceService.unknownCard();
        return {
          success: false,
          type: "UNKNOWN_CARD",
          message: "Kartu tidak terdaftar.",
        };
      }

      if (member.status !== "Active") {
        await VoiceService.inactiveMember(member.nama);
        return {
          success: false,
          type: "MEMBER_INACTIVE",
          member,
          message: "Membership sudah tidak aktif.",
        };
      }

      const today = getWIBDate();

      const duplicate = await db.getAsync(
        `SELECT id FROM attendance
         WHERE member_id = ?
         AND DATE(created_at) = DATE(?)`,
        [member.id, today]
      );

      if (duplicate) {
        await VoiceService.duplicate(member.nama);
        return {
          success: false,
          type: "DUPLICATE_SCAN",
          member,
          message: "Anda sudah melakukan absensi hari ini.",
        };
      }

      const wibTimestamp = getWIBTimestamp();

      const result = await db.runAsync(
        `INSERT INTO attendance (member_id, uid_card, nama, no_telp, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [member.id, uid, member.nama, member.no_telp, wibTimestamp]
      );

      await VoiceService.success(member.nama);

      return {
        success: true,
        type: "SUCCESS",
        attendanceId: result.lastID,
        member,
        message: "Absensi berhasil.",
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        type: "SERVER_ERROR",
        message: error.message,
      };
    }
  }
}

module.exports = AttendanceService;

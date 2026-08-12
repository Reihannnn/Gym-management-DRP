const db = require("../database/db");

class CardService {
  /**
   * Cari member berdasarkan UID NFC
   * @param {string} uid
   * @returns {Promise<Object|null>}
   */
  static async findByUID(uid) {
    try {
      const member = await db.getAsync(
        `
        SELECT *
        FROM member
        WHERE uid_card = ?
        LIMIT 1
        `,
        [uid],
      );

      return member || null;
    } catch (error) {
      console.error("CardService.findByUID()", error);
      throw error;
    }
  }

  /**
   * Cek apakah UID sudah dipakai member lain
   * Dipakai saat registrasi kartu
   */
  static async uidExists(uid) {
    try {
      const row = await db.getAsync(
        `
        SELECT id
        FROM member
        WHERE uid_card = ?
        LIMIT 1
        `,
        [uid],
      );

      return !!row;
    } catch (error) {
      console.error("CardService.uidExists()", error);
      throw error;
    }
  }

  /**
   * Assign UID NFC ke member
   */
  static async assignCard(memberId, uid) {
    try {
      const exists = await this.uidExists(uid);

      if (exists) {
        return {
          success: false,
          message: "UID sudah digunakan member lain.",
        };
      }

      await db.runAsync(
        `
        UPDATE member
        SET uid_card = ?
        WHERE id = ?
        `,
        [uid, memberId],
      );

      return {
        success: true,
        message: "Kartu berhasil didaftarkan.",
      };
    } catch (error) {
      console.error("CardService.assignCard()", error);

      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Hapus kartu dari member
   */
  static async removeCard(memberId) {
    try {
      await db.runAsync(
        `
        UPDATE member
        SET uid_card = NULL
        WHERE id = ?
        `,
        [memberId],
      );

      return {
        success: true,
      };
    } catch (error) {
      console.error("CardService.removeCard()", error);

      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Ambil UID berdasarkan member
   */
  static async getCard(memberId) {
    try {
      return await db.getAsync(
        `
        SELECT uid_card
        FROM member
        WHERE id = ?
        `,
        [memberId],
      );
    } catch (error) {
      console.error("CardService.getCard()", error);
      throw error;
    }
  }
}

module.exports = CardService;

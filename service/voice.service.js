const { exec } = require("child_process");
const path = require("path");

const VOICE_DIR = path.join(__dirname, "..", "public", "assets", "voice");

class VoiceService {
  static play(fileName) {
    return new Promise((resolve) => {
      const filePath = path.join(VOICE_DIR, fileName).replace(/\\/g, "/");

      const ps = [
        `Add-Type -AssemblyName presentationCore`,
        `$p = New-Object System.Windows.Media.MediaPlayer`,
        `$p.Open([uri]'file:///${filePath}')`,
        `$p.Play()`,
        `Start-Sleep -Seconds 4`,
        `$p.Close()`,
      ].join("; ");

      exec(
        `powershell -WindowStyle Hidden -Command "${ps}"`,
        { windowsHide: true },
        () => resolve()
      );
    });
  }

  static async success(name) {
    await this.play("selamat_datang.mp3");
  }

  static async inactiveMember(name) {
    await this.play("member_habis_v2.mp3");
  }

  static async unknownCard() {
    await this.play("card_notfound.mp3");
  }

  static async duplicate(name) {
    await this.play("sudah_dateng.mp3");
  }

  static async error() {
    await this.play("card_notfound.mp3");
  }
}

module.exports = VoiceService;

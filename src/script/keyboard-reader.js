// ==============================
//  TOAST NOTIFICATION (auto dismiss)
// ==============================
function showToast(message, type = "info") {
  // Hapus toast lama jika ada
  const existing = document.getElementById("app-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "app-toast";

  // Warna berdasarkan type
  const colors = {
    success: { bg: "#22c55e", icon: "fa-check-circle" },
    error: { bg: "#ef4444", icon: "fa-times-circle" },
    warning: { bg: "#f59e0b", icon: "fa-exclamation-circle" },
    info: { bg: "#3b82f6", icon: "fa-info-circle" },
  };

  const c = colors[type] || colors.info;

  toast.innerHTML = `
    <style>
      #app-toast {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 24px;
        border-radius: 12px;
        background: ${c.bg};
        color: white;
        font-size: 15px;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        transform: translateX(120%);
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      }
      #app-toast.show {
        transform: translateX(0);
      }
      #app-toast i {
        font-size: 20px;
      }
    </style>
    <i class="fas ${c.icon}"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  // Animasi masuk
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });
  });

  // Auto hilang setelah 3 detik
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ==============================
//  KEYBOARD READER (NFC Scanner)
// ==============================
class KeyboardReader {
  constructor() {
    this.buffer = "";
    this.isProcessing = false;
    this.timeout = null;
    this.timeoutDelay = 100;
    this.mode = "attendance";
  }

  setMode(mode) {
    this.mode = mode;
  }

  start() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    console.log("Keyboard Reader Active");
  }

  async handleKeyDown(event) {
    if (this.isProcessing) return;

    const tag = document.activeElement?.tagName;
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      document.activeElement?.isContentEditable
    ) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const uid = this.buffer.trim();
      this.buffer = "";

      if (!uid) return;

      this.isProcessing = true;

      try {
        if (this.mode === "attendance") {
          const result = await window.api.scanAttendance(uid);

          // Tampilkan toast sesuai type
          if (result.type === "SUCCESS") {
            showToast(result.message, "success");
          } else if (result.type === "MEMBER_INACTIVE") {
            showToast(result.message, "warning");
          } else if (result.type === "DUPLICATE_SCAN") {
            showToast(result.message, "warning");
          } else if (result.type === "UNKNOWN_CARD") {
            showToast(result.message, "error");
          } else {
            showToast(result.message || "Terjadi kesalahan", "error");
          }

          // Audio sudah selesai (di-await di main process), reload setelah toast muncul
          setTimeout(() => {
            window.location.reload();
          }, 1500);

        } else if (this.mode === "register") {
          window.dispatchEvent(            
            new CustomEvent("card-scanned", { detail: uid })
          );
        }
      } catch (err) {
        console.error(err);
        showToast("Terjadi kesalahan saat memproses kartu.", "error");
      } finally {
        this.isProcessing = false;
      }

      return;
    }

    if (/^[0-9]$/.test(event.key)) {
      this.buffer += event.key;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.buffer = "";
      }, this.timeoutDelay);
    }
  }
}

const keyboardReader = new KeyboardReader();
window.keyboardReader = keyboardReader;
keyboardReader.start();

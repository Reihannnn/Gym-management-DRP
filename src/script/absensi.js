let cachedAttendanceRows = [];
let currentFilter = "Semua";

document.addEventListener("DOMContentLoaded", () => {
  loadAttendance();

  document.getElementById("filterDate").addEventListener("change", () => {
    loadAttendance();
  });

  document.getElementById("btnAll").addEventListener("click", () => {
    document.getElementById("filterDate").value = "";
    loadAttendance();
  });

  document.getElementById("btnExportExcel").addEventListener("click", exportExcel);
  document.getElementById("btnExportPDF").addEventListener("click", exportPDF);

  initSearchHandler();
});

async function loadAttendance() {
  const selectedDate = document.getElementById("filterDate").value;
  let attendance;

  if (selectedDate) {
    attendance = await window.api.getAttendanceByDate(selectedDate);
    currentFilter = formatDateLabel(selectedDate);
  } else {
    attendance = await window.api.getAttendance();
    currentFilter = "Semua Data";
  }

  updateFilterLabel();
  renderAttendanceTable(attendance);
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function updateFilterLabel() {
  const label = document.getElementById("filterLabel");
  // label.textContent = `Menampilkan: ${currentFilter}`;
}

function renderAttendanceTable(data) {
  const tableBody = document.getElementById("attendanceTable");

  if (!data || data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-inbox text-4xl mb-2 block"></i>
          <p>Tidak ada data absensi</p>
        </td>
      </tr>
    `;
    cachedAttendanceRows = [];
    return;
  }

  cachedAttendanceRows = data.map((item, index) => ({
    id: item.id,
    nama: item.nama.toLowerCase(),
    tanggal: item.tanggal,
    jam: item.jam,
    no_telp: item.no_telp,
    rowHtml: `
      <td class="px-6 py-4 text-center text-sm text-gray-900">${index + 1}</td>
      <td class="px-6 py-4 text-center text-sm font-medium text-gray-900">${item.nama}</td>
      <td class="px-6 py-4 text-center text-sm text-gray-700">${item.no_telp || "-"}</td>
      <td class="px-6 py-4 text-center text-sm text-gray-700">${item.tanggal || "-"}</td>
      <td class="px-6 py-4 text-center text-sm text-gray-700">${item.jam || "-"}</td>
      <td class="px-4 py-4 text-center text-sm font-medium">
        <button 
          onclick="deleteAttendance(${item.id})" 
          class="text-red-600 bg-red-100 px-3 py-1 rounded-lg hover:bg-red-600 hover:text-white transition"
        >
          <i class="fas fa-trash"></i> Hapus
        </button>
      </td>
    `,
  }));

  const tableHtml = cachedAttendanceRows.map((r) => `<tr>${r.rowHtml}</tr>`).join("");
  tableBody.innerHTML = tableHtml;
}

async function deleteAttendance(id) {
  const confirmDelete = confirm("Yakin ingin menghapus data absensi ini?");
  if (!confirmDelete) return;

  await window.api.deleteAttendance(id);
  alert("Data absensi berhasil dihapus!");
  loadAttendance();
}

function initSearchHandler() {
  const input = document.querySelector('input[placeholder="Cari nama..."]');
  if (!input) return;

  input.addEventListener("input", () => {
    const search = input.value.toLowerCase();

    if (search === "") {
      const tableBody = document.getElementById("attendanceTable");
      tableBody.innerHTML = cachedAttendanceRows
        .map((r) => `<tr>${r.rowHtml}</tr>`)
        .join("");
      return;
    }

    const filtered = cachedAttendanceRows.filter((r) =>
      r.nama.includes(search)
    );

    const tableBody = document.getElementById("attendanceTable");
    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-gray-500">
            Tidak ada data ditemukan
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map((r) => `<tr>${r.rowHtml}</tr>`).join("");
  });
}

// ==============================
//  EXPORT EXCEL
// ==============================
async function exportExcel() {
  if (cachedAttendanceRows.length === 0) {
    alert("Tidak ada data untuk diexport!");
    return;
  }

  const data = cachedAttendanceRows.map((r) => ({
    nama: r.nama,
    no_telp: r.no_telp || "-",
    tanggal: r.tanggal,
    jam: r.jam,
  }));

  const result = await window.api.exportAttendanceExcel({
    data,
    filter: currentFilter,
  });

  if (result) {
    alert("File Excel berhasil dibuat!");
  }
}

// ==============================
//  EXPORT PDF
// ==============================
async function exportPDF() {
  if (cachedAttendanceRows.length === 0) {
    alert("Tidak ada data untuk diexport!");
    return;
  }

  const data = cachedAttendanceRows.map((r) => ({
    nama: r.nama,
    no_telp: r.no_telp || "-",
    tanggal: r.tanggal,
    jam: r.jam,
  }));

  const result = await window.api.exportAttendancePDF({
    data,
    filter: currentFilter,
  });

  if (result) {
    alert("File PDF berhasil dibuat!");
  }
}

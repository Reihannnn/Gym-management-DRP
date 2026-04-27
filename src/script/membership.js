// document.addEventListener("DOMContentLoaded", () => {
//   loadMembershipTable();
//   getAllMembership();
//   initSearchHandler();

//   document.getElementById("yearFilter").addEventListener("change", () => {
//     loadMembershipTable();
//   });
// });

// async function loadMembershipTable() {
//   const selectedYear = document.getElementById("yearFilter").value;
//   const members = await window.api.getMember();
//   const tableBody = document.getElementById("memberTable");

//   const months = [
//     "january",
//     "february",
//     "maret",
//     "april",
//     "mei",
//     "juni",
//     "juli",
//     "agustus",
//     "september",
//     "october",
//     "november",
//     "desember",
//   ];

//   tableBody.innerHTML = "";

//   for (const member of members) {
//     const memberships = await window.api.listMembershipByMember(member.id);

//     // template bulan kosong
//     const monthMap = {};
//     months.forEach((m) => (monthMap[m] = { text: "----", color: "" }));

//     memberships.forEach((m) => {
//       const end = new Date(m.end_date);
//       console.log(end);
//       const endYear = end.getFullYear();

//       // ❗ Tampilkan hanya membership yang tahun end_date = filter
//       if (endYear != selectedYear) return;

//       const monthIndex = end.getMonth(); // 0-11
//       const monthName = months[monthIndex - 1];

//       const today = new Date();
//       const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
//       console.log(diffDays);

//       let color = "";
//       if (diffDays < 0) color = "bg-red";
//       else if (diffDays <= 5) color = "bg-yellow";
//       else color = "bg-green";

//       monthMap[monthName] = {
//         text: formatDate(end),
//         color,
//       };
//     });

//     const row = document.createElement("tr");
//     row.innerHTML = `
//       <td class="text-center">${member.nama}</td>
//       ${months
//         .map(
//           (m) => `
//         <td class="px-2 text-center py-2 ${monthMap[m].color}">
//           ${monthMap[m].text}
//         </td>`
//         )
//         .join("")}
//     `;

//     tableBody.appendChild(row);
//   }
// }

// function formatDate(dateObj) {
//   const m = dateObj.getMonth();
//   const d = dateObj.getDate();
//   const y = dateObj.getFullYear();
//   return `${m + 1}/${d}/${y}`;
// }

// async function getAllMembership() {
//   const members = await window.api.getAllMembership();
//   console.table(members);
// }

// function initSearchHandler() {
//   const searchInput = document.querySelector(
//     'input[placeholder="Cari member..."]'
//   );
//   if (!searchInput) return;

//   searchInput.addEventListener("input", async (e) => {
//     const searchTerm = e.target.value.toLowerCase();
//     const members = await window.api.getMember();

//     const filtered = members.filter(
//       (member) =>
//         member.nama.toLowerCase().includes(searchTerm) ||
//         member.no_telp.includes(searchTerm) ||
//         member.status.toLowerCase().includes(searchTerm) ||
//         (member.alamat && member.alamat.toLowerCase().includes(searchTerm))
//     );

//     displayMembers(filtered);
//   });
// }

let cachedMembershipRows = [];
let cachedMembers = [];

document.addEventListener("DOMContentLoaded", () => {
  loadMembershipTable();
  getAllMembership();
  initSearchHandler();

  document.getElementById("yearFilter").addEventListener("change", () => {
    loadMembershipTable();
  });

  document
    .getElementById("expire-soon-member")
    .addEventListener("click", () => {
      loadMembershipTableExpiringSooon();
    });
});

function loadMembershipTableExpiringSooon() {
  const tableBody = document.getElementById("memberTable");

  const filtered = cachedMembershipRows.filter((r) =>
    r.rowHtml.includes("bg-yellow"),
  );

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="13" class="text-center py-4 text-gray-500">
          Tidak ada member yang expiring dalam 5 hari
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map((r) => `<tr>${r.rowHtml}</tr>`).join("");
}

async function loadMembershipTable() {
  const selectedYear = document.getElementById("yearFilter").value;
  const members = await window.api.getMember();
  const tableBody = document.getElementById("memberTable");

  cachedMembers = members;
  cachedMembershipRows = [];

  const months = [
    "january",
    "february",
    "maret",
    "april",
    "mei",
    "juni",
    "juli",
    "agustus",
    "september",
    "october",
    "november",
    "desember",
  ];

  tableBody.innerHTML = "";

  // ============================
  // RENDER SEMUA MEMBER
  // ============================
  for (const member of members) {
    const memberships = await window.api.listMembershipByMember(member.id);

    // template bulan kosong
    const monthMap = {};
    months.forEach((m) => (monthMap[m] = { text: "----", color: "" }));

    memberships.forEach((m) => {
      const end = new Date(m.end_date);
      const endYear = end.getFullYear();

      if (endYear != selectedYear) return;

      const monthIndex = end.getMonth();
      const monthName = months[monthIndex];

      const today = new Date();
      const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

      let color = "";
      if (diffDays < 0) color = "bg-red";
      else if (diffDays <= 5) color = "bg-yellow";
      else color = "bg-green";

      monthMap[monthName] = {
        text: formatDate(end),
        color,
      };
    });

    console.log("===tes123===")
    console.log(memberships)

    // mengubah nomer whatapp dari 0895 menjadi => 62895
    const noWhatsappMember = `62` + member.no_telp.substring(1);

    const lastMembership =
      memberships.length > 0
        ? memberships[0].end_date
        : null
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="text-center font-semibold flex justify-between">
        <h1 style= "margin-left:20px; ">${member.nama}</h1> 
        <div style="margin-right : 18px;">
          <i class="fa-brands fa-whatsapp hover:cursor-pointer whatsapp" id="whatsapp_member" 
             data-phone = "${noWhatsappMember}"
             data-name = "${member.nama}"
             data-tanggalhabis = "${lastMembership}"
             >
          </i>
        </div>
      </td>
      
      ${months
        .map(
          (m) => `
        <td class="px-2 text-center py-2 ${monthMap[m].color}">
          ${monthMap[m].text}
          </td>`,
        )
        .join("")}
        `;

    cachedMembershipRows.push({
      name: member.nama.toLowerCase(),
      rowHtml: row.innerHTML,
    });

    tableBody.appendChild(row);
  }

  // ============================
  // SETELAH SEMUA MEMBER TERISI → HITUNG TOTAL
  // ============================
  const totals = {};
  months.forEach((m) => (totals[m] = 0));

  cachedMembershipRows.forEach((r) => {
    const temp = document.createElement("tr");
    temp.innerHTML = r.rowHtml;

    const tds = temp.querySelectorAll("td");

    months.forEach((m, i) => {
      const text = tds[i + 1].textContent.trim();
      if (text !== "----") totals[m] += 1;
    });
  });

  // ============================
  // RENDER ROW TOTAL
  // ============================
  const totalRow = document.createElement("tr");
  totalRow.classList.add("bg-gray", "font-bold");

  totalRow.innerHTML = `
    <td class="text-center py-2 font-semibold">TOTAL</td>
    ${months
      .map(
        (m) => `
      <td class="text-center py-2">${totals[m]}</td>
    `,
      )
      .join("")}
  `;

  tableBody.appendChild(totalRow);
}
function formatDate(dateObj) {
  const m = dateObj.getMonth() + 1;
  const d = dateObj.getDate();
  const y = dateObj.getFullYear();
  return `${m}/${d}/${y}`;
}

async function getAllMembership() {
  const members = await window.api.getAllMembership();
  console.table(members);
}

// ===============================
// 🔍 SEARCH HANDLER (FINAL)
// ===============================
function initSearchHandler() {
  const input = document.querySelector(
    'input[placeholder="Cari membership..."]',
  );
  if (!input) return;

  input.addEventListener("input", () => {
    const search = input.value.toLowerCase();
    const tableBody = document.getElementById("memberTable");

    // Jika pencarian kosong → tampilkan semua row
    if (search === "") {
      tableBody.innerHTML = cachedMembershipRows
        .map((r) => `<tr>${r.rowHtml}</tr>`)
        .join("");
      return;
    }

    // Filter berdasarkan nama
    const filtered = cachedMembershipRows.filter((r) =>
      r.name.includes(search),
    );

    // Render hasil filter
    tableBody.innerHTML = filtered.map((r) => `<tr>${r.rowHtml}</tr>`).join("");

    // Jika tidak ada hasil
    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="13" class="text-center py-4 text-gray-500">
            Tidak ada member ditemukan
          </td> 
        </tr>
      `;
    }
  });
}

// template pesan whatsapp
const templateMessageWhatsapp = (name, tanggal_habis) => {
  return `Halo ${name},

Kami ingin mengingatkan bahwa membership Anda akan berakhir pada *${tanggal_habis}*.

Silahkan perpanjang membership Anda agar progress latihan tetap konsisten dan tidak terputus.  
Tetap semangat menuju tubuh yang lebih sehat dan kuat

Salam hangat,  
Admin DRP Gym Cibitung`;
};

document.getElementById("memberTable").addEventListener("click", (e) => {
  if (e.target.classList.contains("whatsapp")) {
    const phone = e.target.dataset.phone;
    const name = e.target.dataset.name;
    const tanggal_habis = e.target.dataset.tanggalhabis;

    const msg = templateMessageWhatsapp(name, tanggal_habis);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

    console.log(url);
    window.wa.open(url);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  showStatusAccount();
  showGrowthRateMember();
  showGrowthRateMembership();
  showExpiringSoon();
  countTotalMember();
  showTotalMembershipPeriode25();
  loadTotalMembership();
  // showActiveThisMonth();

  const btnExport = document.getElementById("btnExportMembership");

  btnExport.addEventListener("click", async () => {
    btnExport.disabled = true;
    btnExport.innerText = "Exporting...";

    const result = await window.api.exportMembershipExcelPeriode25();

    alert("Excel Berhasil dibuat")

    btnExport.disabled = false;
    btnExport.innerText = "Print Excel";
  });
});

// 1. HITUNG MEMBER AKTIF & NON AKTIF
async function countMemberStatus() {
  const members = await window.api.getMember();

  const active = members.filter((m) => m.status === "Active").length;
  const nonActive = members.filter((m) => m.status === "Non Active").length;

  return { active, nonActive };
}

async function showStatusAccount() {
  const { active, nonActive } = await countMemberStatus();
  document.getElementById("member-active").innerText = active;
  document.getElementById("member-non-active").innerText = nonActive;
}

// 2. GROWTH RATE
async function showGrowthRateMember() {
  const members = await window.api.getMember();

  const badgeSuccess = document.querySelector(".badge-success");
  const badgeWarning = document.querySelector(".badge-warning");
  console.log(badgeSuccess);
  console.log(badgeWarning);

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;

  // untuk mengecek tahun bulan lalu
  // misal sekarang 2026 january ini akan membaca bulan lalu di tahun itu jadi desember 2025
  const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

  const memberBulanIni = members.filter((m) => {
    const d = new Date(m.create_at);
    return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear; // output => true
  }).length;

  const MemberBulanLalu = members.filter((m) => {
    const d = new Date(m.create_at);
    return d.getMonth() + 1 === lastMonth && d.getFullYear() === lastMonthYear;
  }).length;

  let growth = 0;

  console.log("member bulan ini : " + memberBulanIni);
  console.log("member bulan lalu : " + MemberBulanLalu);
  // growth formula
  // A = nilai awal
  // B = nilai akhir
  // Rumus  = (Nilai Akhir - Nilai Awal) / Nilai Awal x 100%.
  // contoh :
  // Jika penjualan bulan ini Rp120 juta dan bulan lalu Rp100 juta: (120 - 100) / 100 x 100% = 20%

  if (MemberBulanLalu === 0) {
    growth = memberBulanIni > 0 ? 100 : 0; // kalo misal
  } else {
    growth = ((memberBulanIni - MemberBulanLalu) / MemberBulanLalu) * 100;
  }

  document.getElementById("growth-rate").innerText = `${growth.toFixed(1)}%`;

  // Isi elemen tambahan
  document.getElementById("member-monthNow").innerText = memberBulanIni;
  document.getElementById("member-lastMonth").innerText = MemberBulanLalu;

  // Reset semua badge dulu
  badgeSuccess.classList.add("hidden");
  badgeWarning.classList.add("hidden");

  // Tampilkan sesuai kondisi
  if (growth > 0) {
    badgeSuccess.classList.remove("hidden");
  } else if (growth < 0) {
    badgeWarning.classList.remove("hidden");
  }
  // kalau growth = 0 → dua-duanya tetap hidden
}

// // 3. MEMBERSHIP AKTIF BULAN INI
// async function showActiveThisMonth() {
//   const members = await window.api.getMember();

//   const now = new Date();
//   const monthNow = now.getMonth() + 1;
//   const yearNow = now.getFullYear();

//   const activeThisMonth = members.filter(m => {
//     const d = new Date(m.create_at);
//     return (
//       m.status === "Active" &&
//       d.getMonth() + 1 === monthNow &&
//       d.getFullYear() === yearNow
//     );
//   }).length;

//   document.getElementById("active-this-month").innerText = activeThisMonth || " ";
// }

// 4. EXPIRING SOON (≤ 5 HARI)
async function showExpiringSoon() {
  const membership = await window.api.getAllMembership();

  const now = new Date();
  const soon = membership.filter((m) => {
    const end = new Date(m.end_date);
    const diff = (end - now) / (1000 * 60 * 60 * 24);

    return Math.ceil(diff) >= 0 && Math.ceil(diff) <= 5;
  }).length;

  document.getElementById("expiring-soon").innerText = soon + " " + "Member";
}

async function countTotalMember() {
  const members = await window.api.getMember();
  const total_member = members.length;

  const totalMemberField = document.getElementById("total-member");
  totalMemberField.innerText = total_member;
}

async function showGrowthRateMembership() {
  const membership = await window.api.getAllMembership();

  console.log("asdasda");
  console.log(membership);

  const badgeSuccess = document.querySelector(".badge-success-membership");
  const badgeWarning = document.querySelector(".badge-warning-membership");

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;

  const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

  // === Tinggal pastikan FIELD tanggalnya apa ===
  // contoh: m.pay_date atau m.created_at
  const membershipBulanIni = membership.filter((m) => {
    const d = new Date(m.create_at); // <-- sesuaikan
    // console.log(d);

    return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const membershipBulanLalu = membership.filter((m) => {
    const d = new Date(m.create_at); // <-- sesuaikan
    return d.getMonth() + 1 === lastMonth && d.getFullYear() === lastMonthYear;
  }).length;

  let growth = 0;

  if (membershipBulanLalu === 0) {
    growth = membershipBulanIni > 0 ? 100 : 0;
  } else {
    growth =
      ((membershipBulanIni - membershipBulanLalu) / membershipBulanLalu) * 100;
  }

  // === Masukkan ke elemen HTML ===
  document.getElementById("membership-growth-rate").innerText =
    `${growth.toFixed(1)}%`;
  document.getElementById("membership-monthNow").innerText = membershipBulanIni;
  document.getElementById("membership-lastMonth").innerText =
    membershipBulanLalu;

  // Reset badge
  badgeSuccess.classList.add("hidden");
  badgeWarning.classList.add("hidden");

  // tampilkan badge sesuai nilai growth
  if (growth > 0) {
    badgeSuccess.classList.remove("hidden");
  } else if (growth < 0) {
    badgeWarning.classList.remove("hidden");
  }
}

// FUNGSI MENGAMBIL MEMBERSHIP PERTANGGAL 25 - 25 BERIKUTNYA
async function showTotalMembershipPeriode25() {
  const result = await window.api.getTotalMembershipPeriode25();

  if (!result.success) return;

  document.querySelector(".this-month").innerText =
    result.monthLabel.charAt(0).toUpperCase() + result.monthLabel.slice(1);

  document.getElementById("total-membership-this-month").innerText =
    result.total + " ";

  document.querySelector(".stat-detail").innerText =
    `${result.start} s/d ${result.end}`;
}

async function loadTotalMembership() {
  const result = await window.api.getTotalMembership();

  if (result.success) {
    document.getElementById("totalMembership").innerText = result.total;

    document.getElementById("periodeMembership").innerText =
      `${result.start} s/d ${result.end}`;
  }
}

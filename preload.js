const { contextBridge, ipcRenderer, shell } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // EXIT APP
  exitApp: () => ipcRenderer.send("app:exit"),

  // MEMBER
  getMemberById: (id) => ipcRenderer.invoke("member:getById", id), // get member by id
  addMember: (data) => ipcRenderer.invoke("member:add", data),
  getMember: () => ipcRenderer.invoke("member:list"),
  updateMember: (data) => ipcRenderer.invoke("member:update", data),
  deleteMember: (id) => ipcRenderer.invoke("member:delete", id),
  // UPDATE STATUS MEMBER
  autoUpdateAllMember: () => ipcRenderer.invoke("member:autoUpdateAll"),

  // CHECK MEMBER EXIST
  checkMemberExist: (nama) => ipcRenderer.invoke("checkMemberExist", nama),

  // MEMBERSHIP
  addMembership: (data) => ipcRenderer.invoke("membership:add", data),
  getAllMembership: () => ipcRenderer.invoke("membership:list"),
  getMembershipById: (id) => ipcRenderer.invoke("membership:getById", id),
  //GET ALL MEMBERSHIP USE NAME
  getAllMembershipWithName: () =>
    ipcRenderer.invoke("getAllMembershipWithName:list"),
  listMembershipByMember: (id) =>
    ipcRenderer.invoke("membership:listByMember", id),
  updateMembership: (data) => ipcRenderer.invoke("membership:update", data),
  deleteMembership: (id) => ipcRenderer.invoke("membership:delete", id),

  // SEARCH
  searchMember: (keyword) => ipcRenderer.invoke("search-member", keyword),

  // INCOME
  listIncome: () => ipcRenderer.invoke("income:list"),

  // chnage DIFFERENT PAGE
  openPage: (page) => ipcRenderer.send("open-page", page),

  // print to excel and pdf file
  exportExcel: (data, fileName) =>
    ipcRenderer.invoke("export-excel", { data, fileName }),

  printMembershipExcel: (year) =>
    ipcRenderer.invoke("print-membership-excel", year),
  printMembershipPDF: (year) =>
    ipcRenderer.invoke("print-membership-pdf", year),
  exportMembershipExcel: (data) =>
    ipcRenderer.invoke("export-membership-excel", data),

  // --- STATS MEMBERSHIP PER MONTH ---
  getMembershipPerMonth: (year) =>
    ipcRenderer.invoke("stats:membershipPerMonth", { year }),

  // --- TOTAL MEMBER ACTIVE THIS MONTH ---
  getActiveThisMonth: () => ipcRenderer.invoke("stats:activeThisMonth"),

  // --- MEMBER YANG MAU HABIS MASA AKTIF ---
  getExpiringSoon: () => ipcRenderer.invoke("stats:expiringSoon"),
  // --- AMBIL MEMBERSHIP DARI TANGGAL 25 SAMPAI TANGGAL 25 BULAN DEPAN : CONTOH 25 APRIL - 25 MEI
  getTotalMembershipPeriode25: () =>
    ipcRenderer.invoke("membership:getTotalPeriode25"),

  // --- PRINT MEMBERSHIP DARI TANGGAL 25 SAMPAI TANGGAL 25 BULAN DEPAN : CONTOH 25 APRIL - 25 MEI
  exportMembershipExcelPeriode25: () =>
    ipcRenderer.invoke("membership:exportPeriode25Excel"),

  // ATTENDANCE
  addAttendance: (data) => ipcRenderer.invoke("attendance:add", data),

  // NFC Attendance
  scanAttendance: (uid) => ipcRenderer.invoke("attendance:scan", uid),

  getAttendance: () => ipcRenderer.invoke("attendance:list"),
  getAttendanceByDate: (date) => ipcRenderer.invoke("attendance:byDate", date),
  getAttendanceByDateRange: (data) =>
    ipcRenderer.invoke("attendance:byDateRange", data),
  deleteAttendance: (id) => ipcRenderer.invoke("attendance:delete", id),
  exportAttendanceExcel: (data) =>
    ipcRenderer.invoke("attendance:exportExcel", data),
  exportAttendancePDF: (data) =>
    ipcRenderer.invoke("attendance:exportPDF", data),

  // VOICE
  playVoice: (fileName) => ipcRenderer.invoke("voice:play", fileName),
});

// open Whatsapp
contextBridge.exposeInMainWorld("wa", {
  open: (url) => ipcRenderer.send("open-external", url),
});

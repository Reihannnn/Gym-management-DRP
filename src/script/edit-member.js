window.addEventListener("DOMContentLoaded", async () => {
  const id = localStorage.getItem("edit_member_id");

  const member = await window.api.getMemberById(Number(id));

  document.getElementById("nama").value = member.nama;
  document.getElementById("alamat").value = member.alamat ?? "";
  document.getElementById("status").value = member.status;
  document.getElementById("no_telp").value = member.no_telp;
  document.getElementById("uid_card").value = member.uid_card ?? "";

  const btnScan = document.getElementById("btnScanCard");

  btnScan.addEventListener("click", () => {
    window.keyboardReader.setMode("register");
    console.log("SCAN MODE");
  });

  // submit handler
  document
    .getElementById("formEditMember")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const confirmEdit = confirm(
        "Apakah Anda yakin ingin menyimpan perubahan data member?",
      );

      if (!confirmEdit) return;

      const data = {
        id,
        nama: nama.value,
        alamat: alamat.value,
        status: status.value,
        no_telp: no_telp.value,
        uid_card: uid_card.value,
      };

      await window.api.updateMember(data);

      alert("Member berhasil diupdate!");

      localStorage.removeItem("edit_member_id");

      window.api.openPage("src/views/member.html");
    });
});

function editMember(id) {
  localStorage.setItem("edit_member_id", id);
  api.openPage("src/views/edit_member.html");
}


window.addEventListener("card-scanned", (e) => {

    document.getElementById("uid_card").value = e.detail;

    alert("Kartu berhasil dibaca.");

    window.keyboardReader.setMode("attendance");

});
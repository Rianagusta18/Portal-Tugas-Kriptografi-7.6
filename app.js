// ==========================
//  CONFIG API BACKEND
// ==========================
const API_BASE = "http://localhost:5000/api";

// ==========================
//  ELEMENT DOM
// ==========================
const formRegister = document.getElementById("form-register");
const regNama = document.getElementById("reg-nama");
const regNim = document.getElementById("reg-nim");
const regPass = document.getElementById("reg-password");
const regPass2 = document.getElementById("reg-password2");
const registerMsg = document.getElementById("register-message");

const studentsTableBody = document.querySelector("#students-table tbody");

const uploadModal = document.getElementById("upload-modal");
const modalCloseBtn = document.getElementById("modal-close");
const modalInfo = document.getElementById("modal-student-info");

const formUpload = document.getElementById("form-upload");
const uploadStudentIdInput = document.getElementById("upload-student-id");
const uploadPasswordInput = document.getElementById("upload-password");
const uploadMsg = document.getElementById("upload-message");
const uploadHistoryDiv = document.getElementById("upload-history");

// ==========================
//  HELPER MESSAGE
// ==========================
function showMessage(el, text, type = "success") {
  el.textContent = text;
  el.classList.remove("success", "error");
  el.classList.add(type);
}

// ==========================
//  LOAD MAHASISWA DARI BACKEND
// ==========================
async function renderStudentsTable() {
  try {
    const res = await fetch(`${API_BASE}/students`);
    const students = await res.json();

    if (!students.length) {
      studentsTableBody.innerHTML = `
      <tr>
        <td colspan="3" class="empty">Belum ada mahasiswa terdaftar.</td>
      </tr>`;
      return;
    }

    studentsTableBody.innerHTML = "";

    for (const s of students) {
      const resSub = await fetch(`${API_BASE}/submissions/${s._id}/history`);
      const subs = await resSub.json();

      const tr = document.createElement("tr");
      tr.dataset.id = s._id;

      tr.innerHTML = `
        <td>${s.nama}</td>
        <td>${s.nim}</td>
        <td>${subs.length}</td>
      `;

      studentsTableBody.appendChild(tr);
    }
  } catch (err) {
    console.log("Gagal load mahasiswa:", err);
  }
}

// ==========================
//  REGISTER MAHASISWA
// ==========================
formRegister.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = regNama.value.trim();
  const nim = regNim.value.trim();
  const pass = regPass.value.trim();
  const pass2 = regPass2.value.trim();

  if (!nama || !nim || !pass || !pass2) {
    showMessage(registerMsg, "Semua field wajib diisi.", "error");
    return;
  }

  if (pass !== pass2) {
    showMessage(registerMsg, "Konfirmasi sandi tidak cocok.", "error");
    return;
  }

  const res = await fetch(`${API_BASE}/students/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nama, nim, password: pass }),
  });

  const data = await res.json();

  if (data.status === "error") {
    showMessage(registerMsg, data.message, "error");
  } else {
    showMessage(registerMsg, data.message, "success");
    formRegister.reset();
    renderStudentsTable();
  }
});

// ==========================
//  KLIK MAHASISWA → BUKA MODAL
// ==========================
// ==========================
//  KLIK MAHASISWA → HALAMAN BARU
// ==========================
studentsTableBody.addEventListener("click", (e) => {
  const tr = e.target.closest("tr");
  if (!tr || !tr.dataset.id) return;

  const studentId = tr.dataset.id;
  window.location.href = `mahasiswa.html?id=${studentId}`;
});


// CLOSE MODAL
modalCloseBtn.addEventListener("click", () => {
  uploadModal.classList.remove("show");
});
uploadModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) {
    uploadModal.classList.remove("show");
  }
});

// ==========================
//  HISTORY TUGAS DARI BACKEND
// ==========================
async function renderUploadHistory(studentId) {
  const res = await fetch(`${API_BASE}/submissions/${studentId}/history`);
  const subs = await res.json();

  if (!subs.length) {
    uploadHistoryDiv.innerHTML = `<p class="hint">Belum ada tugas diupload.</p>`;
    return;
  }

  let html = `<h4>Riwayat Tugas:</h4><ul>`;

  subs.forEach((sub) => {
    html += `
      <li>
        <strong>${sub.taskName}</strong><br>
        <span style="opacity:.7">${new Date(
          sub.uploadedAt
        ).toLocaleString()}</span>
        <ul style="padding-left:12px; margin-top:6px;">
    `;

    sub.files.forEach((f) => {
      html += `
        <li>
          <a href="http://localhost:5000/${f.filePath}" download="${f.fileName}" style="color:#93c5fd">
            ${f.fileName}
          </a>
        </li>
      `;
    });

    html += `
        </ul>
      </li><br>
    `;
  });

  html += `</ul>`;

  uploadHistoryDiv.innerHTML = html;
}

// ==========================
//  UPLOAD TUGAS → BACKEND
// ==========================
formUpload.addEventListener("submit", async (e) => {
  e.preventDefault();

  const studentId = uploadStudentIdInput.value;
  const password = uploadPasswordInput.value.trim();
  const taskName = document.getElementById("upload-task").value.trim();
  const files = Array.from(document.getElementById("upload-files").files);

  if (!studentId || !password || !taskName || files.length === 0) {
    showMessage(uploadMsg, "Semua field wajib diisi.", "error");
    return;
  }

  const fd = new FormData();
  fd.append("password", password);
  fd.append("taskName", taskName);

  files.forEach((f) => fd.append("files", f));

  const res = await fetch(`${API_BASE}/submissions/${studentId}/upload`, {
    method: "POST",
    body: fd,
  });

  const data = await res.json();

  if (data.status === "error") {
    showMessage(uploadMsg, data.message, "error");
  } else {
    showMessage(uploadMsg, data.message, "success");
    await renderUploadHistory(studentId);
    await renderStudentsTable();
  }
});

// ==========================
//  INIT
// ==========================
renderStudentsTable();

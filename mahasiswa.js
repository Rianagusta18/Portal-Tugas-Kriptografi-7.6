const API_BASE = "http://localhost:5000/api";

// Ambil ID mahasiswa dari URL
const params = new URLSearchParams(window.location.search);
const studentId = params.get("id");

// Elemen
const studentNameEl = document.getElementById("student-name");
const studentInfoEl = document.getElementById("student-info");
const formUpload = document.getElementById("form-upload-link");
const msgEl = document.getElementById("upload-message");
const riwayatEl = document.getElementById("riwayat-tugas");

// Helper pesan
function showMessage(el, text, type = "success") {
  el.textContent = text;
  el.classList.remove("success", "error");
  el.classList.add(type);
}

// Ambil data mahasiswa
async function loadStudent() {
  try {
    const res = await fetch(`${API_BASE}/students`);
    const students = await res.json();
    const s = students.find((x) => x._id === studentId);

    if (!s) {
      studentNameEl.textContent = "Mahasiswa tidak ditemukan";
      return;
    }

    studentNameEl.textContent = s.nama;
    studentInfoEl.textContent = `NIM: ${s.nim}`;
    loadRiwayat();
  } catch (err) {
    console.error("Gagal load mahasiswa:", err);
  }
}

// Ambil riwayat tugas (link)
async function loadRiwayat() {
  const res = await fetch(`${API_BASE}/submissions/${studentId}/links`);
  const links = await res.json();

  if (!links.length) {
    riwayatEl.innerHTML = `<p class="hint">Belum ada link tugas yang diupload.</p>`;
    return;
  }

  let html = `<h4>Riwayat Link Tugas:</h4><ul>`;
  links.forEach((item) => {
    html += `
      <li>
        <strong>${item.title}</strong><br>
        <a href="${item.url}" target="_blank" style="color:#93c5fd">${item.url}</a>
        <br><span style="opacity:0.7">${new Date(item.uploadedAt).toLocaleString()}</span>
      </li><br>`;
  });
  html += `</ul>`;
  riwayatEl.innerHTML = html;
}

// Upload link tugas baru
formUpload.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("judul-tugas").value.trim();
  const url = document.getElementById("link-tugas").value.trim();
  const password = document.getElementById("password-tugas").value.trim();

  if (!title || !url || !password) {
    showMessage(msgEl, "Semua field wajib diisi", "error");
    return;
  }

  const res = await fetch(`${API_BASE}/submissions/${studentId}/link-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, url, password }),
  });

  const data = await res.json();

  if (data.status === "error") {
    showMessage(msgEl, data.message, "error");
  } else {
    showMessage(msgEl, data.message, "success");
    formUpload.reset();
    loadRiwayat();
  }
});

// Init
loadStudent();

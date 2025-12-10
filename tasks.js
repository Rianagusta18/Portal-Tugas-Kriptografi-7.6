// tasks.js
const API_BASE = "http://localhost:5000/api";

const studentLabel = document.getElementById("student-label");
const tasksHistoryDiv = document.getElementById("tasks-history");
const pagePasswordInput = document.getElementById("page-password");
const pageMsg = document.getElementById("page-message");

function showPageMessage(text, type = "success") {
  pageMsg.textContent = text;
  pageMsg.classList.remove("success", "error");
  pageMsg.classList.add(type);
}

function getStudentIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("studentId");
}

async function loadStudentAndTasks() {
  const studentId = getStudentIdFromQuery();

  if (!studentId) {
    studentLabel.textContent = "Student ID tidak ditemukan di URL.";
    tasksHistoryDiv.innerHTML = "";
    return;
  }

  try {
    const resStudents = await fetch(`${API_BASE}/students`);
    const students = await resStudents.json();
    const student = students.find((s) => s._id === studentId);

    if (!student) {
      studentLabel.textContent = "Mahasiswa tidak ditemukan.";
      tasksHistoryDiv.innerHTML = "";
      return;
    }

    studentLabel.textContent = `${student.nama} (NIM ${student.nim})`;

    await renderTasks(studentId);
  } catch (err) {
    console.error(err);
    studentLabel.textContent = "Terjadi kesalahan saat memuat data.";
    tasksHistoryDiv.innerHTML = "";
  }
}

async function renderTasks(studentId) {
  const resSubs = await fetch(`${API_BASE}/submissions/${studentId}/history`);
  const subs = await resSubs.json();

  if (!subs.length) {
    tasksHistoryDiv.innerHTML =
      '<p class="hint">Belum ada link tugas yang disimpan.</p>';
    return;
  }

  let html = "<h4>Daftar Tugas:</h4><ul>";

  subs.forEach((sub) => {
    html += `
      <li>
        <div>
          <strong>${sub.taskName}</strong><br>
          <span style="opacity:.7">${new Date(
            sub.uploadedAt
          ).toLocaleString()}</span><br>
          <a href="${sub.link}" target="_blank" rel="noopener" style="color:#93c5fd">
            Buka Link Tugas
          </a>
        </div>
        <button 
          type="button" 
          class="btn btn-xsmall btn-delete-task"
          data-sub-id="${sub._id}"
          data-student-id="${studentId}"
        >
          Hapus
        </button>
      </li>
    `;
  });

  html += "</ul>";

  tasksHistoryDiv.innerHTML = html;
}

// HANDLE KLIK HAPUS DI HALAMAN TASKS
tasksHistoryDiv.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-delete-task");
  if (!btn) return;

  const studentId = btn.dataset.studentId;
  const submissionId = btn.dataset.subId;
  const password = pagePasswordInput.value.trim();

  if (!password) {
    showPageMessage("Isi sandi dulu sebelum menghapus tugas.", "error");
    return;
  }

  const ok = window.confirm("Yakin ingin menghapus tugas ini?");
  if (!ok) return;

  try {
    const res = await fetch(
      `${API_BASE}/submissions/${studentId}/${submissionId}/delete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      }
    );

    const data = await res.json();

    if (data.status === "error") {
      showPageMessage(data.message, "error");
    } else {
      showPageMessage(data.message, "success");
      await renderTasks(studentId);
    }
  } catch (err) {
    console.error(err);
    showPageMessage("Gagal menghapus tugas (network error).", "error");
  }
});

loadStudentAndTasks();

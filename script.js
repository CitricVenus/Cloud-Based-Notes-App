const API_URL =
  "https://po1m3fxkk9.execute-api.us-east-2.amazonaws.com/profNotes";
const form = document.getElementById("noteForm");
const notesList = document.getElementById("notesList");
const spinner = document.getElementById("spinner");

function showSpinner() {
  spinner.classList.remove("hidden");
}

function hideSpinner() {
  spinner.classList.add("hidden");
}

window.addEventListener("error", (event) => {
  console.error("Error global detectado:", event.error);
  hideSpinner();
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Promesa no manejada:", event.reason);
  hideSpinner();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!title || !content) {
    alert("Por favor completa título y contenido.");
    return;
  }

  showSpinner();
  try {
    let fileName = null;
    let fileContent = null;

    if (file) {
      fileName = file.name;

      // Leer archivo y convertir a base64
      fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result.split(",")[1]; // quitar "data:*/*;base64,"
          resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    }

    const payload = {
      title,
      content,
      fileName,
      fileContent,
    };

    const res = await fetch(`${API_URL}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Error al crear nota");

    form.reset();
    await loadNotes();
  } catch (error) {
    alert("Error creando nota");
    console.error(error);
  } finally {
    hideSpinner();
  }
});

async function loadNotes() {
  showSpinner();
  try {
    const res = await fetch(`${API_URL}/notes`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);

    const notes = await res.json();

    notesList.innerHTML = "";
    if (!Array.isArray(notes) || notes.length === 0) {
      notesList.innerHTML = "<li>No hay notas disponibles.</li>";
    } else {
      notes.forEach((note) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${note.Title}</strong><br/>
          ${note.Content}<br/>
          <button onclick="deleteNote('${note.NoteID}')">Delete</button>
        `;
        notesList.appendChild(li);
      });
    }
  } catch (error) {
    notesList.innerHTML = `<li>Error cargando notas: ${error.message}</li>`;
    console.error("Error en loadNotes:", error);
  } finally {
    hideSpinner();
  }
}

async function deleteNote(id) {
  if (!confirm("¿Seguro que quieres eliminar esta nota?")) return;

  showSpinner();
  try {
    const res = await fetch(`${API_URL}/notes/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar nota");

    await loadNotes();
  } catch (error) {
    alert("Error eliminando nota");
    console.error(error);
  } finally {
    hideSpinner();
  }
}

loadNotes().catch((e) => {
  console.error("Error en carga inicial:", e);
  hideSpinner();
});

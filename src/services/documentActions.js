const documentPath = (filename) =>
  `${import.meta.env.BASE_URL}documents/${filename}`;

const DOCUMENTS = {
  "conox-brochure-pdf": documentPath("CONOX_2D_Produktbroschuere.pdf"),
  "conox-datasheet-pdf": documentPath("CONOX_2D_Datenblatt.pdf"),
};

function showToast(message) {
  let toast = document.querySelector(".sb-email-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "sb-email-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(
    () => toast.classList.remove("is-visible"),
    6500,
  );
}

function downloadOutlookTemplate() {
  const download = document.createElement("a");
  download.href = documentPath("CONOX_2D_Kontaktvorlage.oft");
  download.download = "CONOX 2D.oft";
  document.body.appendChild(download);
  download.click();
  download.remove();

  showToast(
    "Outlook-Template mit Broschüre und Datenblatt bereitgestellt. Bitte die heruntergeladene OFT-Datei öffnen und Empfänger sowie Anrede ergänzen.",
  );
}

export function initializeDocumentActions() {
  document.addEventListener("click", (event) => {
    const emailLink = event.target.closest?.("a[data-conox-email-draft]");

    if (emailLink) {
      event.preventDefault();
      downloadOutlookTemplate();
      return;
    }

    const link = event.target.closest?.("a[data-embedded-pdf]");
    if (!link) return;

    const path = DOCUMENTS[link.dataset.embeddedPdf];
    if (!path) return;

    event.preventDefault();
    window.open(path, "_blank", "noopener");
  });
}

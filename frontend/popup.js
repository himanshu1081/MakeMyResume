document.addEventListener("DOMContentLoaded", () => {

  const generateBtn = document.getElementById("generateBtn");
  const pdfinput = document.getElementById("pdfinput");
  const jdinput = document.getElementById("jdInput");

  generateBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      action: "generateResume"
    });
    generateBtn.innerText = "Generating..."

  });

  chrome.runtime.sendMessage(
    { action: "getJD" },
    (response) => {
      if (response && response.jobDescription) {
        jdinput.value = response.jobDescription;
      }
    }
  );

  pdfinput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    chrome.runtime.sendMessage({
      action: "uploadPDF",
      pdf: file
    });
  })
});
document.addEventListener("DOMContentLoaded", () => {

  const generateBtn = document.getElementById("generateBtn");
  const pdfinput = document.getElementById("pdfinput");
  const jdinput = document.getElementById("jdInput");

  generateBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      action: "generateResume"
    }, (response) => {
      if (response.button) {
        let warning = document.getElementById("warning");
        if(warning){
          warning.remove()
        }
        generateBtn.innerText = "Generating..."
        generateBtn.style.opacity=0.9
      } else {
        let warning = document.getElementById("warning");
        if (!warning) {
          warning = document.createElement("p");
          warning.id = "warning";
          warning.innerText = "Something went wrong";
          warning.style.color = "red"
          generateBtn.before(warning)
        }
      }
    });
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
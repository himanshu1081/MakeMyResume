
document.addEventListener("DOMContentLoaded", () => {

  const generateBtn = document.getElementById("generateBtn");
  const pdfinput = document.getElementById("pdfinput");
  const pdfinputui = document.getElementById("pdfInputUi")
  const jdinput = document.getElementById("jdInput");
  let resumeText = document.getElementById("resumeText")
  let warning = document.getElementById("warning")
  let linkedinUrl = document.getElementById("linkedinurl")
  let githubUrl = document.getElementById("githuburl")
  let links = document.querySelectorAll("#linkedinurl", "#githuburl")

  linkedinUrl.addEventListener("change", () => {
    localStorage.setItem("linkedinUrl", linkedinUrl.value)
  })


  githubUrl.addEventListener("change", () => {
    localStorage.setItem("githubUrl", githubUrl.value)
  })

  pdfinputui.addEventListener("click", () => {
    pdfinput.click()
  })


  let file = getfile() || null;
  if (file) {
    resumeText.innerHTML = "<div>Click here to upload new file</div>"
  }

  linkedinUrl.value = localStorage.getItem("linkedinUrl") || "";
  githubUrl.value = localStorage.getItem("githubUrl") || "";

  generateBtn.addEventListener("click", () => {
    if (!jdinput.value || !file) {
      if (!warning) {
        warning = document.createElement("div")
        warning.style.color = "red"
        if (!file) {
          warning.innerText = "Upload old resume."
          generateBtn.before(warning)
        } else {
          warning.innerText = "Provide job description."
          generateBtn.before(warning)
        }
        return
      }
    }
    generateBtn.innerText = "Generating..."
    getResume(jdinput, file);
  });

  chrome.runtime.sendMessage(
    { action: "getJD" },
    (response) => {
      if (response && response.jobDescription) {
        jdinput.value = response.jobDescription;
      }
    }
  );

  function savefile(file) {
    const request = indexedDB.open("resumeDB", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      db.createObjectStore("files", { keyPath: "id" })
    }

    request.onsuccess = (event) => {

      const db = event.target.result

      const tx = db.transaction("files", "readwrite")

      const store = tx.objectStore("files");

      store.put({
        id: "oldresume",
        file: file
      })
    }
  }

  function getfile() {
    const request = indexedDB.open("resumeDB", 1);

    request.onsuccess = (event) => {

      const db = event.target.result;

      const tx = db.transaction("files", "readonly");

      const store = tx.objectStore("files");

      const getRequest = store.get("oldresume");

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        let file = null
        if (data) {
          file = data.file;
        }
        return file;
      }
    }
  }

  pdfinput.addEventListener("change", (e) => {
    file = e.target.files[0];
    resumeText.innerText = "File Uploaded!"
    savefile(file)
  });

});

async function getResume(jdinput, file) {

  if (!file) {
    console.log("No resume uploaded");
    return;
  }

  const formData = new FormData();
  formData.append("jobdescription", jdinput.value);
  formData.append("oldResume", file);
  if (linkedinUrl.value !== "")
    formData.append("linkedinUrl", linkedinUrl.value
    )
  if (githubUrl.value !== "")
    formData.append("githubUrl", githubUrl.value
    )
  try {

    const response = await fetch(
      "https://makemyresume.onrender.com/getresume",
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {
      const err = await response.text();
      generateBtn.innerText = "Generate resume"
      warning.innerText = "Something went wrong."
      console.error(err);
      return;
    }

    const blob = await response.blob();

    const reader = new FileReader();

    reader.onload = function () {
      chrome.downloads.download({
        url: reader.result,
        filename: "generated-resume.pdf"
      });
    };

    reader.readAsDataURL(blob);
    generateBtn.innerText = "Generate resume"
  } catch (error) {
    generateBtn.innerText = "Generate resume"
    console.error(error);
  }

}
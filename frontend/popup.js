
document.addEventListener("DOMContentLoaded", async () => {

  const generateBtn = document.getElementById("generateBtn");
  const pdfinput = document.getElementById("pdfinput");
  const pdfinputui = document.getElementById("pdfInputUi")
  const jdinput = document.getElementById("jdInput");
  let resumeText = document.getElementById("resumeText")
  let warning = document.getElementById("warning")
  let linkedinUrl = document.getElementById("linkedinurl")
  let githubUrl = document.getElementById("githuburl")

  //will check if there is any old resume inside IndexedDB
  let file = await getfile();
  linkedinUrl.value = localStorage.getItem("linkedinUrl") || "";
  githubUrl.value = localStorage.getItem("githubUrl") || "";

  if (file) {
    resumeText.innerText = "Resume loaded ✓ Upload new if needed"
  }

  //stores linkedIn url in localstorage when user paste it
  linkedinUrl.addEventListener("change", () => {
    localStorage.setItem("linkedinUrl", linkedinUrl.value)
  })

  //stores github url in localstorage when user paste it
  githubUrl.addEventListener("change", () => {
    localStorage.setItem("githubUrl", githubUrl.value)
  })

  //stores old resume inside IndexedDB 
  pdfinput.addEventListener("change", (e) => {
    file = e.target.files[0];
    resumeText.innerText = "File Uploaded!"
    savefile(file)
  });


  pdfinputui.addEventListener("click", () => {
    pdfinput.click()
  })

  generateBtn.addEventListener("click", () => {
    if (!jdinput.value || !file) {
      if (!warning) {
        warning = document.createElement("div")
        warning.style.color = "red"
        generateBtn.before(warning)
      }

      if (!file) {
        warning.innerText = "Upload old resume."
      } else {
        warning.innerText = "Provide job description."
      }
      return
    }
    generateBtn.innerText = "Generating..."
    if (warning) {
      warning.remove();
      warning = null;
    }
    getResume(jdinput, file, linkedinUrl, githubUrl, generateBtn);
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
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" });
      }
    }

    request.onsuccess = (event) => {

      const db = event.target.result

      const tx = db.transaction("files", "readwrite")

      const store = tx.objectStore("files");

      store.put({
        id: "oldresume",
        file: file
      })
      tx.oncomplete = () => db.close();
    }
  }

  function getfile() {
    return new Promise((resolve, reject) => {

      const request = indexedDB.open("resumeDB", 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files", { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {

        const db = event.target.result;
        if (!db.objectStoreNames.contains("files")) {
          resolve(null);   // table doesn't exist yet
          return;
        }
        const tx = db.transaction("files", "readonly");

        const store = tx.objectStore("files");

        const getRequest = store.get("oldresume");

        getRequest.onsuccess = () => {
          const data = getRequest.result;
          if (data) {
            resolve(data.file);
          } else {
            resolve(null)
          }
          getRequest.onerror = () => reject(req.error);
        }
        request.onerror = () => reject(request.error);
      }
    })
  }

});

async function getResume(jdinput, file, linkedinUrl, githubUrl, generateBtn) {

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
      const warning = document.createElement("div");
      warning.style.color = "red";
      warning.innerText = "Something went wrong.";
      generateBtn.before(warning);
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
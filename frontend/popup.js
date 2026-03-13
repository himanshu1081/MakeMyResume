
document.addEventListener("DOMContentLoaded", () => {

  const generateBtn = document.getElementById("generateBtn");
  const pdfinput = document.getElementById("pdfinput");
  const jdinput = document.getElementById("jdInput");
  const resumeText = document.getElementById("resumeText")


  resumeText.addEventListener("click", () => {
    pdfinput.click()
  })

  let file = localStorage?.getItem("oldResume") || null;
  if (file) {
    resumeText.innerHTML = "<div>Click here to upload new file</div>"
  }



  generateBtn.addEventListener("click", () => {
    if (!jdinput || !file) {
      let warning = document.getElementById("warning")
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

  pdfinput.addEventListener("change", (e) => {
    const reader = new FileReader()
    file = e.target.files[0];
    reader.onload = () => {
      localStorage.setItem("oldResume", reader.result)
      resumeText.innerHTML = "<div>Click here to upload new file</div>"
    }
    reader.readAsDataURL(file)
  });

});

async function getResume(jdinput, file) {

  if (!file.value) {
    console.log("No resume uploaded");
    return;
  }

  const formData = new FormData();
  formData.append("jobdescription", jdinput.value);
  formData.append("oldResume", file);

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
    console.error(error);
  }

}
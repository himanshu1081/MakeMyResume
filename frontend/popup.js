document.addEventListener("DOMContentLoaded", () => {

  const generateBtn = document.getElementById("generateBtn");
  const textarea = document.getElementById("jdInput");
  const status = document.getElementById("status");

  generateBtn.addEventListener("click", async () => {

    const jdText = textarea.value.trim();

    if (!jdText) {
      status.innerText = "Please paste job description.";
      status.style.color = "red";
      return;
    }

    status.innerText = "Processing...";
    status.style.color = "black";

    try {
      // Example backend call
      const response = await fetch("http://localhost:3000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ jobDescription: jdText })
      });

      const data = await response.json();

      status.innerText = "Resume generated successfully!";
      status.style.color = "green";

      console.log(data);

    } catch (error) {
      console.error(error);
      status.innerText = "Error generating resume.";
      status.style.color = "red";
    }

  });

});
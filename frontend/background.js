let jobDescription = null;
let file = null;

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "generateResume",
        title: "Generate Resume",
        contexts: ["all"]
    })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "generateResume") {

        // Chrome automatically gives selected text here
        jobDescription = info.selectionText;
        chrome.action.openPopup();

    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action == "uploadPDF") {
        file = request.pdf
    }
    if (request.action == "generateResume") {
        getResume()
    }
    if (request.action === "getJD") {
        sendResponse({ jobDescription });
    }
})

async function getResume() {
    if (!jobDescription || !file) {
        console.log("Missing job description or resume file");
        return;
    }
    const formData = new FormData();

    formData.append("jobdescription", jobDescription)
    formData.append("oldResume", file)
    try {
        await fetch("https://makemyresume.onrender.com/getresume", {
            method: "POST",
            body: formData
        });

        jobDescription = null;
        file = null;
    } catch (error) {
        console.error(error.message)
    }
}   
let jobDescription = null;
let file = null;

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "generateResume",
        title: "Generate Resume",
        contexts: ["selection"]
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

    if (request.action === "uploadPDF") {
        file = request.pdf;
    }

    if (request.action === "getJD") {
        sendResponse({ jobDescription });
    }

    if (request.action === "generateResume") {

        if (!jobDescription || !file) {
            console.log("Missing job description or resume file");
            sendResponse({ button: false });
            return;
        }

        getResume(sendResponse);
        return true; // keeps channel open
    }

});

async function getResume(sendResponse) {

    const formData = new FormData();
    formData.append("jobdescription", jobDescription);
    formData.append("oldResume", file);
    sendResponse({ button: true });

    try {

        const response = await fetch("https://makemyresume.onrender.com/getresume", {
            method: "POST",
            body: formData
        });

        const blob = await response.blob();
        const url = URL.createObjectURL(blob)

        const a = document.createElement("a")
        a.href = url;
        a.download = "generated-resume.pdf"
        a.click()
        URL.revokeObjectURL(url)


        jobDescription = null;
        file = null;


    } catch (error) {
        sendResponse(false);
    }

}
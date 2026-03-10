chrome.runtime.onMessage.addListener((request) => {
    if (request.id == "generateResume") {
        formData.append(request.jobDescription)
        formData.append("oldResume",oldResume)
        getResume(request.selectedText)
    }
})

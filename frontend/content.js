
const formData = new FormData()
chrome.runtime.onMessage.addListener((request) => {
    if (request.id == "generateResume") {
        formData.append(request.jobDescription)
        formData.append("oldResume",oldResume)
        getResume(request.selectedText)
    }
})



//generating resume
async function getResume() {
    var jobDescription = "no jd"
    try {
        const response = await fetch("http://localhost:3000/",{
            method:"POST",
            body:{
                jobDescription:jobDescription,
                formData:
            }
        }).method
        var resumeLatex = await response.json()
        alert(jobDescription)
    } catch (error) {
        console.log(error.message)
    }
}

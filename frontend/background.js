chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "generateResume",
        title: "Generate Resume",
        context: ["selection"]
    })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {

    // Make sure correct menu item was clicked
    if (info.menuItemId === "generateResume") {

        // Chrome automatically gives selected text here
        const selectedText = info.selectionText;

        // Send selected text to content script running in that tab
        chrome.tabs.sendMessage(tab.id, {
            action: "generateResume",
            jobDescription: selectedText
        });
    }
});
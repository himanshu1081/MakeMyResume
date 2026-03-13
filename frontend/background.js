let jobDescription = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generateResume",
    title: "Generate Resume",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "generateResume") {

    jobDescription = info.selectionText;

    chrome.action.openPopup();

  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === "getJD") {
    sendResponse({ jobDescription });
  }

});
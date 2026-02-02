const action = typeof browser !== 'undefined' ? browser.action : chrome.action;
const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;

action.onClicked.addListener(() => {
	runtime.openOptionsPage();
});

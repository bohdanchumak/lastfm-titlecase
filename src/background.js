const action = typeof browser !== 'undefined' ? browser.action : chrome.action;
const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
const menus = typeof browser !== 'undefined' ? browser.contextMenus : chrome.contextMenus;

action.onClicked.addListener(() => {
	runtime.openOptionsPage();
});

menus.create({
	id: 'add-replacement',
	title: 'Add to replacements...',
	contexts: ['all'],
	documentUrlPatterns: ['*://*.last.fm/*']
});

menus.onClicked.addListener((info, tab) => {
	if (info.menuItemId !== 'add-replacement')
		return;

	chrome.tabs.sendMessage(tab.id, { type: 'getRightClickedTitle' }, (title) => {
		if (!title)
			return;

		const optionsUrl = runtime.getURL('src/config.html') + '?from=' + encodeURIComponent(title);
		chrome.tabs.create({ url: optionsUrl });
	});
});

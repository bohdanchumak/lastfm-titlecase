import { titleCase } from 'title-case';

const TITLE_SELECTORS = [
	'h1.header-new-title',
	'.chartlist-name a'
].join(', ');

function processElement(el) {
	const text = el.textContent.trim();
	const fixed = titleCase(text);

	if (fixed !== text)
		el.textContent = fixed;
}

document.querySelectorAll(TITLE_SELECTORS).forEach(processElement);

new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const node of mutation.addedNodes) {
			if (node.nodeType !== Node.ELEMENT_NODE)
				continue;

			if (node.matches?.(TITLE_SELECTORS))
				processElement(node);

			node.querySelectorAll?.(TITLE_SELECTORS).forEach(processElement);
		}
	}
}).observe(document.body, { childList: true, subtree: true });

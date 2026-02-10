import {DEFAULT_LOWERCASE, DEFAULT_UPPERCASE} from './defaults.js';

const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;

const TITLE_SELECTORS = [
	'.grid-items-item-aux-block',
	'h1.header-new-title',
	'h2.library-header-title',
	'.link-block-target',
	'.chartlist-artist a',
	'.chartlist-album a',
	'.chartlist-name a'
].join(', ');

let lowercaseWords = new Set(DEFAULT_LOWERCASE);
let uppercaseWords = new Set(DEFAULT_UPPERCASE);
let capitalizedWords = new Set();
let titleReplacements = [];

async function loadSettings() {
	return new Promise((resolve) => {
		storage.sync.get(['lowercaseWords', 'uppercaseWords', 'capitalizedWords', 'titleReplacements'], (result) => {
			if (result.lowercaseWords)
				lowercaseWords = new Set(result.lowercaseWords);

			if (result.uppercaseWords)
				uppercaseWords = new Set(result.uppercaseWords);

			if (result.capitalizedWords)
				capitalizedWords = new Set(result.capitalizedWords);

			if (result.titleReplacements)
				titleReplacements = result.titleReplacements;

			resolve();
		});
	});
}

const sentenceCaseRegex = /[\u0400-\u04FFæøåäöőűłąęćńśźżčďěňřšťůžßñãõàâçèéêëîïôùûüœ]/i;
const romanNumeralRegex = /(?<!\w)(?=[IVX])X{0,3}(?:IX|IV|V?I{0,3})(?!\w)/gi;

function toTitleCase(text, smallWords) {
	const words = text.split(/\s+/);

	return words.map((word, i) => {
		if (i > 0 && i < words.length - 1 && smallWords.has(word.toLowerCase()))
			return word.toLowerCase();

		return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	}).join(' ');
}

function toSentenceCase(text) {
	return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function applyWordOverrides(text) {
	return text.replace(/\p{L}+/gu, word => {
		const lower = word.toLowerCase();
		const replacement = titleReplacements.find(r => !r.from.includes(' ') && r.from.toLowerCase() === lower);

		if (replacement)
			return replacement.to;

		if (uppercaseWords.has(lower))
			return word.toUpperCase();

		if (capitalizedWords.has(lower))
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

		return word;
	});
}

function uppercaseAcronyms(text) {
	return text.replace(/\b([a-z]\.){2,}/gi, match => match.toUpperCase());
}

function uppercaseRomanNumerals(text) {
	return text.replace(romanNumeralRegex, match => match.toUpperCase());
}

const capitalizeAfter = (pattern) => (text) =>
	text.replace(pattern, (_, prefix, letter) => prefix + letter.toUpperCase());

const capitalizeAfterDot = capitalizeAfter(/(\.\s+)(\p{L})/gu);
const capitalizeAfterPunctuation = capitalizeAfter(/(-|\/|=|"|(?<!\p{L})'|[(\[{]\s*)(\p{L})/gu);

function capitalizeMusicalKeys(text) {
	return text.replace(/\ba(?=(?:[\s-](?:sharp|flat))?[\s-](?:major|minor)\b)/gi, 'A');
}

const commonProcessors = [
	uppercaseRomanNumerals,
	applyWordOverrides,
	uppercaseAcronyms,
	capitalizeAfterDot
];

const titleCaseProcessors = [
	capitalizeAfterPunctuation,
	capitalizeMusicalKeys
];

function processElement(el) {
	const text = el.textContent.trim();
	const replacement = titleReplacements.find(r => r.from.includes(' ') && r.from.toLowerCase() === text.toLowerCase());

	if (replacement) {
		if (replacement.to !== text)
			el.textContent = replacement.to;

		return;
	}

	const isSentenceCase = sentenceCaseRegex.test(text);

	let fixed = isSentenceCase
		? toSentenceCase(text)
		: toTitleCase(text, lowercaseWords);

	const processors = isSentenceCase
		? commonProcessors
		: [...commonProcessors, ...titleCaseProcessors];

	fixed = processors.reduce((result, fn) => fn(result), fixed);

	if (fixed !== text)
		el.textContent = fixed;
}

let lastRightClickedTitle = null;

document.addEventListener('contextmenu', (e) => {
	const titleEl = e.target.closest(TITLE_SELECTORS);
	lastRightClickedTitle = titleEl ? titleEl.textContent.trim() : null;
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.type === 'getRightClickedTitle')
		sendResponse(lastRightClickedTitle);
});

(async () => {
	await loadSettings();

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
})();

import {titleCase} from 'title-case';
import {DEFAULT_LOWERCASE, DEFAULT_UPPERCASE} from './defaults.js';

const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;

const TITLE_SELECTORS = [
	'.grid-items-item-aux-block',
	'h1.header-new-title',
	'h2.library-header-title',
	'.link-block-target',
	'.chartlist-album a',
	'.chartlist-name a'
].join(', ');

let lowercaseWords = new Set(DEFAULT_LOWERCASE);
let uppercaseWords = new Set(DEFAULT_UPPERCASE);
let capitalizedWords = new Set();

async function loadSettings() {
	return new Promise((resolve) => {
		storage.sync.get(['lowercaseWords', 'uppercaseWords', 'capitalizedWords'], (result) => {
			if (result.lowercaseWords) lowercaseWords = new Set(result.lowercaseWords);
			if (result.uppercaseWords) uppercaseWords = new Set(result.uppercaseWords);
			if (result.capitalizedWords) capitalizedWords = new Set(result.capitalizedWords);
			resolve();
		});
	});
}

const sentenceCaseRegex = /[\u0400-\u04FFæøåäöőűłąęćńśźżčďěňřšťůžßñãõàâçèéêëîïôùûüœ]/i;
const romanNumeralRegex = /(?<!\w)(?=[IVX])X{0,3}(?:IX|IV|V?I{0,3})(?!\w)/gi;

function toSentenceCase(text) {
	return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function applyWordOverrides(text) {
	return text.replace(/\p{L}+/gu, word => {
		const lower = word.toLowerCase();
		if (uppercaseWords.has(lower)) return word.toUpperCase();
		if (capitalizedWords.has(lower)) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		return word;
	});
}

function uppercaseAcronyms(text) {
	return text.replace(/\b([a-z]\.){2,}/gi, match => match.toUpperCase());
}

function uppercaseRomanNumerals(text) {
	return text.replace(romanNumeralRegex, match => match.toUpperCase());
}

function capitalizeAfterOpeningBrackets(text) {
	return text.replace(/([(\[{])\s*(\w)/g, (_, bracket, letter) => bracket + letter.toUpperCase());
}

function capitalizeMusicalKeys(text) {
	return text.replace(/\ba(?=(?:[\s-](?:sharp|flat))?[\s-](?:major|minor)\b)/gi, 'A');
}

const commonProcessors = [
	uppercaseRomanNumerals,
	applyWordOverrides,
	uppercaseAcronyms
];

const titleCaseProcessors = [
	capitalizeAfterOpeningBrackets,
	capitalizeMusicalKeys
];

function processElement(el) {
	const text = el.textContent.trim();
	const isSentenceCase = sentenceCaseRegex.test(text);

	let fixed = isSentenceCase
		? toSentenceCase(text)
		: titleCase(text.toLowerCase(), {smallWords: lowercaseWords});

	const processors = isSentenceCase
		? commonProcessors
		: [...commonProcessors, ...titleCaseProcessors];

	fixed = processors.reduce((result, fn) => fn(result), fixed);

	if (fixed !== text)
		el.textContent = fixed;
}

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

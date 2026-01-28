import {titleCase} from 'title-case';

const TITLE_SELECTORS = [
	'.grid-items-item-aux-block',
	'h1.header-new-title',
	'h2.library-header-title',
	'.link-block-target',
	'.chartlist-album a',
	'.chartlist-name a'
].join(', ');

const lowercaseWords = new Set([
	'a', 'aka', 'an', 'and', 'as', 'at', 'by', 'de', 'en', 'feat', 'for',
	'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'via', 'vs'
]);

const uppercaseWords = new Set([
	'dj', 'ep', 'lp', 'tv', 'uk', 'us', 'ufo', 'nyc', 'ok'
]);

const sentenceCaseRegex = /[\u0400-\u04FFæøåäöőűłąęćńśźżčďěňřšťůžßñãõàâçèéêëîïôùûüœ]/i;
const romanNumeralRegex = /(?<!\w)(?=[IVX])X{0,3}(?:IX|IV|V?I{0,3})(?!\w)/gi;

function toSentenceCase(text) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

function applyUppercaseWords(text) {
	return text.replace(/\b\w+\b/g, word =>
		uppercaseWords.has(word.toLowerCase()) ? word.toUpperCase() : word
	);
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
	applyUppercaseWords,
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

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

const romanNumeralRegex = /(^|[\s(\[{])((?=[IVX])X{0,3}(?:IX|IV|V?I{0,3}))(?=$|[\s)\]}.,:;!?])/gi;
const sentenceCaseRegex = /[\u0400-\u04FFæøåäöőűłąęćńśźżčďěňřšťůžßñãõàâçèéêëîïôùûüœ]/i;

function toSentenceCase(text) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

function uppercaseAcronyms(text) {
	return text.replace(/\b([a-z]\.){2,}/gi, match => match.toUpperCase());
}

function uppercaseRomanNumerals(text) {
	return text.replace(romanNumeralRegex, (_, prefix, numeral) => prefix + numeral.toUpperCase());
}

function applyUppercaseWords(text) {
	return text.replace(/\b\w+\b/g, word =>
		uppercaseWords.has(word.toLowerCase()) ? word.toUpperCase() : word
	);
}

function capitalizeAfterOpeningBrackets(text) {
	return text.replace(/([(\[{])\s*(\w)/g, (_, bracket, letter) => bracket + letter.toUpperCase());
}

function processElement(el) {
	const text = el.textContent.trim();
	let fixed = sentenceCaseRegex.test(text)
		? toSentenceCase(text)
		: titleCase(text.toLowerCase(), {smallWords: lowercaseWords});

	fixed = uppercaseRomanNumerals(fixed);
	fixed = applyUppercaseWords(fixed);
	fixed = uppercaseAcronyms(fixed);
	fixed = capitalizeAfterOpeningBrackets(fixed);

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

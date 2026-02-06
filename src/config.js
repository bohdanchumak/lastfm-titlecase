import {DEFAULT_LOWERCASE, DEFAULT_UPPERCASE} from './defaults.js';

const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;
const lowercaseSection = document.querySelector('.section.lowercase');
const uppercaseSection = document.querySelector('.section.uppercase');
const capitalizedSection = document.querySelector('.section.capitalized');
const lowercaseInput = document.getElementById('lowercase-input');
const uppercaseInput = document.getElementById('uppercase-input');
const capitalizedInput = document.getElementById('capitalized-input');
const saveButton = document.getElementById('save-button');

let state = {
	lowercaseWords: [...DEFAULT_LOWERCASE],
	uppercaseWords: [...DEFAULT_UPPERCASE],
	capitalizedWords: []
};

function setState(updates, dirty = true) {
	state = { ...state, ...updates };

	if (dirty)
		saveButton.classList.add('dirty');

	render();
}

function saveToStorage() {
	storage.sync.set({
		lowercaseWords: state.lowercaseWords,
		uppercaseWords: state.uppercaseWords,
		capitalizedWords: state.capitalizedWords
	}, () => {
		saveButton.classList.remove('dirty');
		saveButton.textContent = 'Saved';
		saveButton.classList.add('saved');
		setTimeout(() => {
			saveButton.textContent = 'Save';
			saveButton.classList.remove('saved');
		}, 1500);
	});
}

function loadFromStorage() {
	return new Promise((resolve) => {
		storage.sync.get(['lowercaseWords', 'uppercaseWords', 'capitalizedWords'], (result) => {
			setState({
				lowercaseWords: result.lowercaseWords || [...DEFAULT_LOWERCASE],
				uppercaseWords: result.uppercaseWords || [...DEFAULT_UPPERCASE],
				capitalizedWords: result.capitalizedWords || []
			}, false);
			resolve();
		});
	});
}

function validateWord(word) {
	if (word.length > 50) 
		return 'Word is too long (max 50 characters)';

	if (/:\/\//.test(word) || /^www\./i.test(word))
		return 'URLs are not allowed';

	if (/<[^>]*>/.test(word))
		return 'HTML tags are not allowed';

	return null;
}

function addWord(type, word) {
	const key = type + 'Words';
	const normalized = word.trim().toLowerCase();

	if (!normalized)
		return;

	const error = validateWord(normalized);

	if (error)
		return alert(error);

	if (!state[key].includes(normalized))
		setState({ [key]: [...state[key], normalized] });
}

function removeWord(type, word) {
	const key = type + 'Words';

	setState({ [key]: state[key].filter(w => w !== word) });
}

function render() {
	renderSection(lowercaseSection, state.lowercaseWords, 'lowercase');
	renderSection(uppercaseSection, state.uppercaseWords, 'uppercase');
	renderSection(capitalizedSection, state.capitalizedWords, 'capitalized');
}

function renderSection(section, words, type) {
	const container = section.querySelector('.chips-container');
	container.innerHTML = '';

	[...words].sort().forEach(word => {
		container.appendChild(createChip(word, () => removeWord(type, word)));
	});
}

function createChip(word, onRemove) {
	const chip = document.createElement('span');

	chip.className = 'chip';
	chip.role = 'button';
	chip.ariaLabel = `Remove ${word}`;
	chip.textContent = word;
	chip.addEventListener('click', onRemove);

	return chip;
}

saveButton.addEventListener('click', saveToStorage);

[
	{ type: 'lowercase', input: lowercaseInput, buttonId: 'lowercase-add' },
	{ type: 'uppercase', input: uppercaseInput, buttonId: 'uppercase-add' },
	{ type: 'capitalized', input: capitalizedInput, buttonId: 'capitalized-add' }
].forEach(({ type, input, buttonId }) => {
	const submit = () => {
		addWord(type, input.value);
		input.value = '';
		input.focus();
	};

	document.getElementById(buttonId).addEventListener('click', submit);

	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			submit();
		}
	});
});

loadFromStorage();

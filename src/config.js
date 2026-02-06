import {DEFAULT_LOWERCASE, DEFAULT_UPPERCASE} from './defaults.js';

const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;

let state = {
	lowercaseWords: [...DEFAULT_LOWERCASE],
	uppercaseWords: [...DEFAULT_UPPERCASE]
};

const lowercaseSection = document.querySelector('.section.lowercase');
const uppercaseSection = document.querySelector('.section.uppercase');
const lowercaseInput = document.getElementById('lowercase-input');
const uppercaseInput = document.getElementById('uppercase-input');
const saveButton = document.getElementById('save-button');

function setState(updates) {
	state = { ...state, ...updates };

	render();
}

function saveToStorage() {
	storage.sync.set({
		lowercaseWords: state.lowercaseWords,
		uppercaseWords: state.uppercaseWords
	}, () => {
		saveButton.classList.add('saved');
		setTimeout(() => saveButton.classList.remove('saved'), 2000);
	});
}

function loadFromStorage() {
	return new Promise((resolve) => {
		storage.sync.get(['lowercaseWords', 'uppercaseWords'], (result) => {
			setState({
				lowercaseWords: result.lowercaseWords || [...DEFAULT_LOWERCASE],
				uppercaseWords: result.uppercaseWords || [...DEFAULT_UPPERCASE]
			});
			resolve();
		});
	});
}

function addWord(type, word) {
	const key = type + 'Words';
	const normalized = word.trim().toLowerCase();

	if (normalized && !state[key].includes(normalized))
		setState({ [key]: [...state[key], normalized] });
}

function removeWord(type, word) {
	const key = type + 'Words';

	setState({ [key]: state[key].filter(w => w !== word) });
}

function render() {
	renderSection(lowercaseSection, state.lowercaseWords, 'lowercase');
	renderSection(uppercaseSection, state.uppercaseWords, 'uppercase');
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
	{ type: 'uppercase', input: uppercaseInput, buttonId: 'uppercase-add' }
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

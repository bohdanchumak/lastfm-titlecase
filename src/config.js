import {DEFAULT_LOWERCASE, DEFAULT_UPPERCASE} from './defaults.js';

const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;
const lowercaseSection = document.querySelector('.section.lowercase');
const uppercaseSection = document.querySelector('.section.uppercase');
const capitalizedSection = document.querySelector('.section.capitalized');
const replacementsSection = document.querySelector('.section.replacements');
const settingsSection = document.querySelector('.section.settings');
const lowercaseInput = document.getElementById('lowercase-input');
const uppercaseInput = document.getElementById('uppercase-input');
const capitalizedInput = document.getElementById('capitalized-input');
const replacementFromInput = document.getElementById('replacement-from');
const replacementToInput = document.getElementById('replacement-to');
const sentenceCaseToggle = document.getElementById('sentence-case-toggle');
const saveButton = document.getElementById('save-button');

let state = {
	sentenceCaseEnabled: true,
	lowercaseWords: [...DEFAULT_LOWERCASE],
	uppercaseWords: [...DEFAULT_UPPERCASE],
	capitalizedWords: [],
	titleReplacements: []
};

let savedState = null;

const sectionByKey = {
	sentenceCaseEnabled: settingsSection,
	lowercaseWords: lowercaseSection,
	uppercaseWords: uppercaseSection,
	capitalizedWords: capitalizedSection,
	titleReplacements: replacementsSection
};

function setState(updates) {
	state = { ...state, ...updates };

	if (savedState) {
		let anyDirty = false;

		for (const [key, section] of Object.entries(sectionByKey)) {
			const dirty = JSON.stringify(state[key]) !== JSON.stringify(savedState[key]);
			section.classList.toggle('dirty', dirty);

			if (dirty)
				anyDirty = true;
		}

		saveButton.classList.toggle('dirty', anyDirty);
	}

	render();
}

function saveToStorage() {
	storage.sync.set({
		sentenceCaseEnabled: state.sentenceCaseEnabled,
		lowercaseWords: state.lowercaseWords,
		uppercaseWords: state.uppercaseWords,
		capitalizedWords: state.capitalizedWords,
		titleReplacements: state.titleReplacements
	}, () => {
		savedState = JSON.parse(JSON.stringify(state));

		for (const section of Object.values(sectionByKey))
			section.classList.remove('dirty');

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
		storage.sync.get(['sentenceCaseEnabled', 'lowercaseWords', 'uppercaseWords', 'capitalizedWords', 'titleReplacements'], (result) => {
			setState({
				sentenceCaseEnabled: result.sentenceCaseEnabled !== undefined ? result.sentenceCaseEnabled : true,
				lowercaseWords: result.lowercaseWords || [...DEFAULT_LOWERCASE],
				uppercaseWords: result.uppercaseWords || [...DEFAULT_UPPERCASE],
				capitalizedWords: result.capitalizedWords || [],
				titleReplacements: result.titleReplacements || []
			});

			savedState = JSON.parse(JSON.stringify(state));
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

function addReplacement(from, to) {
	from = from.trim();
	to = to.trim();

	if (!from || !to)
		return;

	const fromError = validateWord(from);
	const toError = validateWord(to);

	if (fromError)
		return alert(fromError);

	if (toError)
		return alert(toError);

	if (state.titleReplacements.some(r => r.from.toLowerCase() === from.toLowerCase()))
		return;

	setState({ titleReplacements: [...state.titleReplacements, { from, to }] });
}

function removeReplacement(from) {
	setState({ titleReplacements: state.titleReplacements.filter(r => r.from !== from) });
}

function renderReplacements() {
	const container = replacementsSection.querySelector('.replacements-list');
	container.innerHTML = '';

	[...state.titleReplacements]
		.sort((a, b) => a.from.localeCompare(b.from))
		.forEach(({ from, to }) => {
			const item = document.createElement('span');
			item.className = 'replacement-item';
			item.role = 'button';
			item.ariaLabel = `Remove replacement ${from}`;

			const arrow = document.createElement('span');
			arrow.className = 'arrow';
			arrow.textContent = '\u2192';

			item.append(from + ' ', arrow, ' ' + to);
			item.addEventListener('click', () => removeReplacement(from));
			container.appendChild(item);
		});
}

function render() {
	sentenceCaseToggle.checked = state.sentenceCaseEnabled;
	renderSection(lowercaseSection, state.lowercaseWords, 'lowercase');
	renderSection(uppercaseSection, state.uppercaseWords, 'uppercase');
	renderSection(capitalizedSection, state.capitalizedWords, 'capitalized');
	renderReplacements();
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

sentenceCaseToggle.addEventListener('change', () => {
	setState({ sentenceCaseEnabled: sentenceCaseToggle.checked });
});

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

const submitReplacement = () => {
	addReplacement(replacementFromInput.value, replacementToInput.value);
	replacementFromInput.value = '';
	replacementToInput.value = '';
	replacementFromInput.focus();
};

document.getElementById('replacement-add').addEventListener('click', submitReplacement);

replacementToInput.addEventListener('keydown', (e) => {
	if (e.key === 'Enter') {
		e.preventDefault();
		submitReplacement();
	}
});

loadFromStorage().then(() => {
	const from = new URLSearchParams(location.search).get('from');

	if (from) {
		replacementFromInput.value = from;
		replacementsSection.open = true;
		replacementToInput.focus();
	}
});

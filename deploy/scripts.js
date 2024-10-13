// scripts.js

// Code for lampe_chambre.shtml
function initializeLampeChambrePage() {
    function updateSliderBackground(slider, color) {
        var value = slider.value;
        var min = slider.min;
        var max = slider.max;
        var percentage = (value - min) / (max - min) * 100;

        slider.style.background = 'linear-gradient(to right, ' + color + ' 0%, ' + color + ' ' + percentage + '%, #cccccc ' + percentage + '%, #cccccc 100%)';
        slider.style.setProperty('--range-progress', percentage + '%');
        slider.style.setProperty('--slider-color', color);
    }

    var sliders = [
        {id: 'slider-red', color: '#a50f01'},
        {id: 'slider-green', color: '#299e37'},
        {id: 'slider-blue', color: '#4d8dd6'},
        {id: 'slider-warm-white', color: '#ffeac1'}
    ];

    var lastSentValues = {red: -1, green: -1, blue: -1, warmWhite: -1};
    var isSending = false;
    var queuedValue = null;

    function displayPresets(presets) {
        const presetsList = document.getElementById('presets-list');
        if (!presetsList) {
            console.error('Element with ID "presets-list" not found.');
            return;
        }

        presets.forEach(preset => {
            const presetContainer = document.createElement('div');
            presetContainer.className = 'preset-container';

            const presetName = document.createElement('span');
            presetName.textContent = preset.name;
            presetContainer.appendChild(presetName);

            const loadButton = document.createElement('button');
            loadButton.textContent = 'Load';
            loadButton.onclick = () => loadPreset(preset);
            presetContainer.appendChild(loadButton);

            presetsList.appendChild(presetContainer);
        });
    }

    function loadPreset(preset) {
        document.getElementById('slider-red').value = preset.r;
        document.getElementById('slider-green').value = preset.g;
        document.getElementById('slider-blue').value = preset.b;
        document.getElementById('slider-warm-white').value = preset.w;

        updateSliderBackground(document.getElementById('slider-red'), '#a50f01');
        updateSliderBackground(document.getElementById('slider-green'), '#299e37');
        updateSliderBackground(document.getElementById('slider-blue'), '#4d8dd6');
        updateSliderBackground(document.getElementById('slider-warm-white'), '#ffeac1');

        sendRGBWValues();
    }

    function sendRGBWValues() {
        if (isSending) {
            queuedValue = getSliderValues();
            return;
        }

        var currentValues = getSliderValues();

        if (hasValuesChanged(currentValues)) {
            lastSentValues = currentValues;
            sendValues(currentValues);
        }
    }

    function getSliderValues() {
        return {
            red: document.getElementById('slider-red').value,
            green: document.getElementById('slider-green').value,
            blue: document.getElementById('slider-blue').value,
            warmWhite: document.getElementById('slider-warm-white').value
        };
    }

    function hasValuesChanged(currentValues) {
        return currentValues.red != lastSentValues.red ||
               currentValues.green != lastSentValues.green ||
               currentValues.blue != lastSentValues.blue ||
               currentValues.warmWhite != lastSentValues.warmWhite;
    }

    function sendValues(values) {
        isSending = true;
        var rgbwString = `${values.red} ${values.green} ${values.blue} ${values.warmWhite}\n`;

        fetch('http://barry.local:5000/setRGBW', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({R: values.red, G: values.green, B: values.blue, W: values.warmWhite})
        }).then(response => {
            if (response.ok) {
                console.log('RGBW values sent:', rgbwString);
            } else {
                console.error('Failed to send RGBW values');
            }
        }).catch(error => {
            console.error('Error sending RGBW values:', error);
        }).finally(() => {
            isSending = false;

            if (queuedValue) {
                var tempQueuedValue = queuedValue;
                queuedValue = null;
                lastSentValues = tempQueuedValue;
                sendValues(tempQueuedValue);
            }
        });
    }

    sliders.forEach(function(s) {
        var slider = document.getElementById(s.id);
        updateSliderBackground(slider, s.color);

        slider.addEventListener('input', function() {
            updateSliderBackground(slider, s.color);
            sendRGBWValues();
        });

        slider.addEventListener('change', function() {
            updateSliderBackground(slider, s.color);
            sendRGBWValues();
        });
    });
}

// Code for sequences.shtml
function initializeSequencesPage() {
    function fetchSequences() {
        fetch('http://barry.local:5000/sequences/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                const sequencesList = document.getElementById('sequences-list');
                sequencesList.innerHTML = '';

                Object.keys(data).forEach(sequenceName => {
                    const listItem = document.createElement('li');
                    listItem.className = 'sequence-item';

                    const sequenceLink = document.createElement('a');
                    sequenceLink.textContent = sequenceName;
                    sequenceLink.href = `modify_sequence.shtml?name=${encodeURIComponent(sequenceName)}`;
                    listItem.appendChild(sequenceLink);

                    const deleteIcon = document.createElement('span');
                    deleteIcon.className = 'delete-icon';
                    deleteIcon.innerHTML = '&#128465;';
                    deleteIcon.title = 'Supprimer la séquence';
                    deleteIcon.onclick = () => openDeleteModal(sequenceName);
                    listItem.appendChild(deleteIcon);

                    sequencesList.appendChild(listItem);
                });
            })
            .catch(error => {
                console.error('Error fetching sequences:', error);
                alert('Erreur lors du chargement des séquences.');
            });
    }

    function openDeleteModal(sequenceName) {
        const deleteModal = document.getElementById('delete-modal');
        const sequenceToDelete = document.getElementById('sequence-to-delete');
        sequenceToDelete.textContent = sequenceName;
        deleteModal.style.display = 'block';

        const confirmDeleteBtn = document.getElementById('confirm-delete');
        const cancelDeleteBtn = document.getElementById('cancel-delete');

        confirmDeleteBtn.replaceWith(confirmDeleteBtn.cloneNode(true));
        cancelDeleteBtn.replaceWith(cancelDeleteBtn.cloneNode(true));

        document.getElementById('confirm-delete').onclick = () => {
            deleteSequence(sequenceName);
        };

        document.getElementById('cancel-delete').onclick = () => {
            deleteModal.style.display = 'none';
        };
    }

    function deleteSequence(sequenceName) {
        fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                alert(`La séquence "${sequenceName}" a été supprimée.`);
                location.reload();
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Erreur inconnue.');
                });
            }
        })
        .catch(error => {
            console.error('Error deleting sequence:', error);
            alert(`Erreur lors de la suppression de la séquence: ${error.message}`);
        });
    }

    function openAddModal() {
        const addModal = document.getElementById('add-modal');
        addModal.style.display = 'block';

        const confirmAddBtn = document.getElementById('confirm-add');
        const cancelAddBtn = document.getElementById('add-close');

        confirmAddBtn.replaceWith(confirmAddBtn.cloneNode(true));
        cancelAddBtn.replaceWith(cancelAddBtn.cloneNode(true));

        document.getElementById('confirm-add').onclick = () => {
            const sequenceNameInput = document.getElementById('new-sequence-name');
            const newSequenceName = sequenceNameInput.value.trim();

            if (newSequenceName === '') {
                alert('Le nom de la séquence ne peut pas être vide.');
                return;
            }

            fetch('http://barry.local:5000/sequences/')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    const exists = Object.keys(data).some(seq => seq.toLowerCase() === newSequenceName.toLowerCase());
                    if (exists) {
                        alert('Une séquence avec ce nom existe déjà.');
                    } else {
                        createSequence(newSequenceName);
                    }
                })
                .catch(error => {
                    console.error('Error checking existing sequences:', error);
                    alert('Erreur lors de la vérification des séquences existantes.');
                });
        };

        document.getElementById('add-close').onclick = () => {
            addModal.style.display = 'none';
        };
    }

    function createSequence(sequenceName) {
        fetch('http://barry.local:5000/sequences/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sequence_name: sequenceName,
                colors: []
            })
        })
        .then(response => {
            if (response.status === 201) {
                alert(`La séquence "${sequenceName}" a été créée.`);
                location.reload();
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Erreur inconnue.');
                });
            }
        })
        .catch(error => {
            console.error('Error creating sequence:', error);
            alert(`Erreur lors de la création de la séquence: ${error.message}`);
        });
    }

    fetchSequences();

    const addSequenceButton = document.getElementById('add-sequence-button');
    if (addSequenceButton) {
        addSequenceButton.onclick = openAddModal;
    }

    window.onclick = function(event) {
        const deleteModal = document.getElementById('delete-modal');
        const addModal = document.getElementById('add-modal');
        if (event.target == deleteModal) {
            deleteModal.style.display = 'none';
        }
        if (event.target == addModal) {
            addModal.style.display = 'none';
        }
    };
}

// Initialize the appropriate page when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.endsWith('lampe_chambre.shtml')) {
        initializeLampeChambrePage();
    } else if (path.endsWith('sequences.shtml')) {
        initializeSequencesPage();
    }
});

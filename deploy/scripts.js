function updateSliderBackground(slider, color) {
    var value = slider.value;
    var min = slider.min;
    var max = slider.max;
    var percentage = (value - min) / (max - min) * 100;

    /* For WebKit browsers */
    slider.style.background = 'linear-gradient(to right, ' + color + ' 0%, ' + color + ' ' + percentage + '%, #cccccc ' + percentage + '%, #cccccc 100%)';

    /* For Firefox */
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
var queuedValue = null;  // Store the last value if it's queued

// Load the presets from the JSON file
fetch('presets.json')
    .then(response => response.json())
    .then(data => {
        displayPresets(data);
    })
    .catch(error => console.error('Error loading presets:', error));

// Function to display the presets and their load buttons
function displayPresets(presets) {
    const presetsList = document.getElementById('presets-list');
    
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

// Function to load the preset values into sliders and send them
function loadPreset(preset) {
    // Update slider values
    document.getElementById('slider-red').value = preset.r;
    document.getElementById('slider-green').value = preset.g;
    document.getElementById('slider-blue').value = preset.b;
    document.getElementById('slider-warm-white').value = preset.w;

    // Update the slider backgrounds
    updateSliderBackground(document.getElementById('slider-red'), '#a50f01');
    updateSliderBackground(document.getElementById('slider-green'), '#299e37');
    updateSliderBackground(document.getElementById('slider-blue'), '#4d8dd6');
    updateSliderBackground(document.getElementById('slider-warm-white'), '#ffeac1');

    // Send the RGBW values to the server
    sendRGBWValues();
}

function sendRGBWValues() {
    if (isSending) {
        // Queue the value if a request is in progress
        queuedValue = getSliderValues();
        return;
    }

    var currentValues = getSliderValues();

    // Only send if values have changed
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
    var rgbwString = `${values.red} ${values.green} ${values.blue} ${values.warmWhite}\\n`;

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

        // Send the queued value if it exists
        if (queuedValue) {
            var tempQueuedValue = queuedValue;
            queuedValue = null; // Clear the queue
            lastSentValues = tempQueuedValue;  // Update the last sent values
            sendValues(tempQueuedValue);  // Send the queued value
        }
    });
}


sliders.forEach(function(s) {
    var slider = document.getElementById(s.id);
    updateSliderBackground(slider, s.color);

    // Send values while the slider is being dragged
    slider.addEventListener('input', function() {
        updateSliderBackground(slider, s.color);
        sendRGBWValues();
    });

    // Ensure the last value is sent when the slider is released
    slider.addEventListener('change', function() {
        updateSliderBackground(slider, s.color);
        sendRGBWValues();
    });
});

// Function to fetch and display all sequences
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
            sequencesList.innerHTML = ''; // Clear existing list

            Object.keys(data).forEach(sequenceName => {
                const listItem = document.createElement('li');
                listItem.className = 'sequence-item';

                // Sequence Name (Clickable)
                const sequenceLink = document.createElement('a');
                sequenceLink.textContent = sequenceName;
                sequenceLink.href = `modify_sequence.shtml?name=${encodeURIComponent(sequenceName)}`; // Redirect to modify page
                listItem.appendChild(sequenceLink);

                // Delete Icon
                const deleteIcon = document.createElement('span');
                deleteIcon.className = 'delete-icon';
                deleteIcon.innerHTML = '&#128465;'; // Trash can icon (Unicode)
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

// Function to open the delete confirmation modal
function openDeleteModal(sequenceName) {
    const deleteModal = document.getElementById('delete-modal');
    const sequenceToDelete = document.getElementById('sequence-to-delete');
    sequenceToDelete.textContent = sequenceName;
    deleteModal.style.display = 'block';

    // Set up confirm and cancel buttons
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');

    // Remove any existing event listeners to prevent multiple bindings
    confirmDeleteBtn.replaceWith(confirmDeleteBtn.cloneNode(true));
    cancelDeleteBtn.replaceWith(cancelDeleteBtn.cloneNode(true));

    document.getElementById('confirm-delete').onclick = () => {
        deleteSequence(sequenceName);
    };

    document.getElementById('cancel-delete').onclick = () => {
        deleteModal.style.display = 'none';
    };
}

// Function to delete a sequence
function deleteSequence(sequenceName) {
    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`, { // Fixed template literal
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            alert(`La séquence "${sequenceName}" a été supprimée.`);
            location.reload(); // Reload the page to update the list
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

// Function to open the add sequence modal
function openAddModal() {
    const addModal = document.getElementById('add-modal');
    addModal.style.display = 'block';

    // Set up confirm and close buttons
    const confirmAddBtn = document.getElementById('confirm-add');
    const cancelAddBtn = document.getElementById('add-close');

    // Remove any existing event listeners to prevent multiple bindings
    confirmAddBtn.replaceWith(confirmAddBtn.cloneNode(true));
    cancelAddBtn.replaceWith(cancelAddBtn.cloneNode(true));

    document.getElementById('confirm-add').onclick = () => {
        const sequenceNameInput = document.getElementById('new-sequence-name');
        const newSequenceName = sequenceNameInput.value.trim();

        if (newSequenceName === '') {
            alert('Le nom de la séquence ne peut pas être vide.');
            return;
        }

        // Check if the sequence name already exists
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

    // Close modal when clicking on the close (x) button
    document.getElementById('add-close').onclick = () => {
        addModal.style.display = 'none';
    };
}

// Function to create a new sequence
function createSequence(sequenceName) {
    fetch('http://barry.local:5000/sequences/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sequence_name: sequenceName,
            colors: [] // Empty sequence
        })
    })
    .then(response => {
        if (response.status === 201) {
            alert(`La séquence "${sequenceName}" a été créée.`);
            location.reload(); // Reload the page to update the list
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

// Function to initialize event listeners
function initializeSequencesPage() {
    fetchSequences();

    // Add Sequence Button
    const addSequenceButton = document.getElementById('add-sequence-button');
    addSequenceButton.onclick = openAddModal;

    // Close modals when clicking outside of them
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

// Initialize the Sequences page when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if the current page is sequences.shtml
    if (window.location.pathname.endsWith('sequences.shtml')) {
        initializeSequencesPage();
    }
});
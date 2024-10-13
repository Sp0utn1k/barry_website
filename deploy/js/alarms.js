document.addEventListener('DOMContentLoaded', function() {
    fetchAlarms();
    fetchSequences(); // To populate the sequence dropdown in the add alarm modal
    setupAddAlarmModal();
    setupDeleteAlarmModal();
});

// Function to fetch and display all alarms
function fetchAlarms() {
    fetch('http://barry.local:5000/alarms/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des alarmes.');
            }
            return response.json();
        })
        .then(data => {
            const alarmsList = document.getElementById('alarms-list');
            alarmsList.innerHTML = ''; // Clear existing alarms

            data.forEach(alarm => {
                const listItem = document.createElement('li');
                listItem.className = 'alarm-item';

                // Alarm Time
                const timeSpan = document.createElement('span');
                timeSpan.className = 'alarm-time';
                timeSpan.textContent = formatTime(alarm.time);
                listItem.appendChild(timeSpan);

                // Alarm Sequence
                const sequenceSpan = document.createElement('span');
                sequenceSpan.className = 'alarm-sequence';
                sequenceSpan.textContent = alarm.sequence_name;
                listItem.appendChild(sequenceSpan);

                // Alarm Duration
                const durationSpan = document.createElement('span');
                durationSpan.className = 'alarm-duration';
                durationSpan.textContent = `${convertSecondsToMinutes(alarm.duration)} min`;
                listItem.appendChild(durationSpan);

                // Active Toggle
                const toggleLabel = document.createElement('label');
                toggleLabel.className = 'toggle-switch';

                const toggleInput = document.createElement('input');
                toggleInput.type = 'checkbox';
                toggleInput.checked = alarm.active;
                toggleInput.dataset.alarmId = alarm.id; // Assuming each alarm has a unique 'id'

                const toggleSpan = document.createElement('span');
                toggleSpan.className = 'toggle-slider round';

                toggleLabel.appendChild(toggleInput);
                toggleLabel.appendChild(toggleSpan);
                listItem.appendChild(toggleLabel);

                // Delete Icon
                const deleteIcon = document.createElement('span');
                deleteIcon.className = 'delete-icon';
                deleteIcon.innerHTML = '&#128465;'; // Trash can icon
                deleteIcon.title = 'Supprimer l\'alarme';
                deleteIcon.dataset.alarmId = alarm.id;

                deleteIcon.addEventListener('click', function() {
                    openDeleteAlarmModal(alarm.id, alarm.time);
                });

                listItem.appendChild(deleteIcon);

                // Event Listener for Toggle
                toggleInput.addEventListener('change', function() {
                    updateAlarmActiveStatus(alarm.id, this.checked);
                });

                alarmsList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors du chargement des alarmes.');
        });
}

// Function to format time in HH:MM format
function formatTime(timeString) {
    // Assuming timeString is in "HH:MM" format
    return timeString;
}

// Function to convert seconds to minutes (rounded)
function convertSecondsToMinutes(seconds) {
    return Math.round(seconds / 60);
}

// Function to convert minutes to seconds
function convertMinutesToSeconds(minutes) {
    return minutes * 60;
}

// Function to update the 'active' status of an alarm
function updateAlarmActiveStatus(alarmId, isActive) {
    fetch(`http://barry.local:5000/alarms/${encodeURIComponent(alarmId)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: isActive })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour de l\'alarme.');
        }
        return response.json();
    })
    .then(data => {
        console.log('Statut de l\'alarme mis à jour:', data);
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert('Erreur lors de la mise à jour du statut de l\'alarme.');
        // Revert the toggle if update fails
        fetchAlarms();
    });
}

// Function to fetch all sequences for the add alarm modal
function fetchSequences() {
    fetch('http://barry.local:5000/sequences/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des séquences.');
            }
            return response.json();
        })
        .then(data => {
            const sequenceSelect = document.getElementById('alarm-sequence');
            sequenceSelect.innerHTML = ''; // Clear existing options

            // Check if data is an object
            if (typeof data === 'object' && !Array.isArray(data)) {
                Object.keys(data).forEach(sequenceName => {
                    const option = document.createElement('option');
                    option.value = sequenceName;
                    option.textContent = sequenceName;
                    sequenceSelect.appendChild(option);
                });
            } else if (Array.isArray(data)) {
                data.forEach(sequence => {
                    const option = document.createElement('option');
                    option.value = sequence.name; // Adjust based on actual structure
                    option.textContent = sequence.name;
                    sequenceSelect.appendChild(option);
                });
            } else {
                console.error('Format de données inattendu pour les séquences:', data);
                alert('Format de données des séquences non supporté.');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors du chargement des séquences.');
        });
}

// Function to set up the Add Alarm Modal functionality
function setupAddAlarmModal() {
    const addAlarmButton = document.getElementById('add-alarm-button');
    const addAlarmModal = document.getElementById('add-alarm-modal');
    const addAlarmClose = document.getElementById('add-alarm-close');
    const addAlarmForm = document.getElementById('add-alarm-form');

    // Open the modal when the add button is clicked
    addAlarmButton.addEventListener('click', function() {
        addAlarmModal.style.display = 'block';
    });

    // Close the modal when the close button is clicked
    addAlarmClose.addEventListener('click', function() {
        addAlarmModal.style.display = 'none';
    });

    // Close the modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target == addAlarmModal) {
            addAlarmModal.style.display = 'none';
        }
    });

    // Handle the form submission to create a new alarm
    addAlarmForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const time = document.getElementById('alarm-time').value;
        const durationMinutes = parseInt(document.getElementById('alarm-duration').value, 10);
        const durationSeconds = convertMinutesToSeconds(durationMinutes);
        const sequenceName = document.getElementById('alarm-sequence').value;
        const repeat = document.getElementById('alarm-repeat').checked;

        if (!time || isNaN(durationMinutes) || !sequenceName) {
            alert('Veuillez remplir tous les champs requis.');
            return;
        }

        const newAlarm = {
            time: time,
            duration: durationSeconds, // Send duration in seconds to backend
            sequence_name: sequenceName,
            active: true, // Default to inactive
            repeat: repeat
        };

        fetch('http://barry.local:5000/alarms/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newAlarm)
        })
        .then(response => {
            if (response.status === 201) {
                return response.json();
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Erreur inconnue lors de la création de l\'alarme.');
                });
            }
        })
        .then(data => {
            console.log('Nouvelle alarme créée:', data);
            addAlarmModal.style.display = 'none';
            addAlarmForm.reset();
            fetchAlarms(); // Refresh the alarms list
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert(`Erreur lors de la création de l\'alarme: ${error.message}`);
        });
    });
}

// Function to open the Delete Alarm Modal
function openDeleteAlarmModal(alarmId, alarmTime) {
    const deleteAlarmModal = document.getElementById('delete-alarm-modal');
    const alarmToDeleteSpan = document.getElementById('alarm-to-delete');
    alarmToDeleteSpan.textContent = `${alarmTime}`;

    deleteAlarmModal.style.display = 'block';

    const confirmDeleteBtn = document.getElementById('confirm-delete-alarm');
    const cancelDeleteBtn = document.getElementById('cancel-delete-alarm');

    // Remove existing event listeners to prevent multiple triggers
    confirmDeleteBtn.replaceWith(confirmDeleteBtn.cloneNode(true));
    cancelDeleteBtn.replaceWith(cancelDeleteBtn.cloneNode(true));

    // Re-select the buttons after cloning
    const newConfirmDeleteBtn = document.getElementById('confirm-delete-alarm');
    const newCancelDeleteBtn = document.getElementById('cancel-delete-alarm');

    newConfirmDeleteBtn.addEventListener('click', function() {
        deleteAlarm(alarmId);
    });

    newCancelDeleteBtn.addEventListener('click', function() {
        deleteAlarmModal.style.display = 'none';
    });
}

// Function to set up the Delete Alarm Modal functionality
function setupDeleteAlarmModal() {
    const deleteAlarmModal = document.getElementById('delete-alarm-modal');
    const deleteAlarmClose = document.getElementById('delete-alarm-close');

    // Close the modal when the close button is clicked
    deleteAlarmClose.addEventListener('click', function() {
        deleteAlarmModal.style.display = 'none';
    });

    // Close the modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target == deleteAlarmModal) {
            deleteAlarmModal.style.display = 'none';
        }
    });
}

// Function to delete an alarm
function deleteAlarm(alarmId) {
    fetch(`http://barry.local:5000/alarms/${encodeURIComponent(alarmId)}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            console.log(`Alarme ${alarmId} supprimée.`);
            const deleteAlarmModal = document.getElementById('delete-alarm-modal');
            deleteAlarmModal.style.display = 'none';
            fetchAlarms(); // Refresh the alarms list
        } else {
            return response.json().then(data => {
                throw new Error(data.error || 'Erreur inconnue lors de la suppression de l\'alarme.');
            });
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert(`Erreur lors de la suppression de l\'alarme: ${error.message}`);
    });
}

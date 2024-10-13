// js/alarms.js

document.addEventListener('DOMContentLoaded', function() {
    fetchAlarms();
    fetchSequences(); // To populate the sequence dropdown in the add alarm modal
    setupAddAlarmModal();
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

                // Active Toggle
                const toggleLabel = document.createElement('label');
                toggleLabel.className = 'switch';

                const toggleInput = document.createElement('input');
                toggleInput.type = 'checkbox';
                toggleInput.checked = alarm.active;
                toggleInput.dataset.alarmId = alarm.id; // Assuming each alarm has a unique 'id'

                const toggleSpan = document.createElement('span');
                toggleSpan.className = 'slider round';

                toggleLabel.appendChild(toggleInput);
                toggleLabel.appendChild(toggleSpan);
                listItem.appendChild(toggleLabel);

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

            data.forEach(sequence => {
                const option = document.createElement('option');
                option.value = sequence.name; // Assuming each sequence has a 'name' field
                option.textContent = sequence.name;
                sequenceSelect.appendChild(option);
            });
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
        const duration = parseInt(document.getElementById('alarm-duration').value, 10);
        const sequenceName = document.getElementById('alarm-sequence').value;
        const repeat = document.getElementById('alarm-repeat').checked;

        if (!time || !duration || !sequenceName) {
            alert('Veuillez remplir tous les champs requis.');
            return;
        }

        const newAlarm = {
            time: time,
            duration: duration,
            sequence_name: sequenceName,
            active: false, // Default to inactive
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

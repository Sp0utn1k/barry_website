function getSequenceNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('name');
}

function fetchSequence(sequenceName) {
    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch sequence.');
            }
            return response.json();
        })
        .then(data => {
            populateSequenceData(sequenceName, data);
        })
        .catch(error => {
            console.error('Error fetching sequence:', error);
            alert('Erreur lors du chargement de la séquence.');
        });
}

function populateSequenceData(oldName, data) {
    const nameInput = document.getElementById('sequence-name-input');
    nameInput.value = oldName;

    const colorsList = document.getElementById('colors-list');
    colorsList.innerHTML = '';

    data.forEach((color, index) => {
        const colorItem = document.createElement('li');
        colorItem.className = 'color-item';
        colorItem.dataset.index = index;

        const colorName = document.createElement('span');
        colorName.className = 'color-name';
        colorName.textContent = `Couleur ${index + 1}`;
        colorName.style.color = getColorHex(color);
        colorName.onclick = () => toggleColorDropdown(index);
        colorItem.appendChild(colorName);

        // Icons Container
        const iconsContainer = document.createElement('div');
        iconsContainer.className = 'icons-container';

        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'delete-icon';
        deleteIcon.innerHTML = '&#128465;';
        deleteIcon.title = 'Supprimer la couleur';
        deleteIcon.onclick = () => deleteColor(index);
        iconsContainer.appendChild(deleteIcon);

        const optionsButton = document.createElement('span');
        optionsButton.className = 'options-icon';
        optionsButton.innerHTML = '&#9776;';
        optionsButton.title = 'Options';
        optionsButton.onclick = () => toggleOptionsMenu(index);
        iconsContainer.appendChild(optionsButton);

        colorItem.appendChild(iconsContainer);

        // Dropdown for editing color
        const dropdown = document.createElement('div');
        dropdown.className = 'color-dropdown';
        dropdown.id = `color-dropdown-${index}`;
        dropdown.style.display = 'none';

        // Sliders
        ['R', 'G', 'B', 'W'].forEach(channel => {
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'slider-container';

            const sliderLabel = document.createElement('label');
            sliderLabel.textContent = channel;
            sliderLabel.htmlFor = `slider-${channel}-${index}`;
            sliderLabel.style.color = getChannelColor(channel);
            sliderContainer.appendChild(sliderLabel);

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = 0;
            slider.max = 32767;
            slider.value = color[channel];
            slider.id = `slider-${channel}-${index}`;
            slider.className = `slider slider-${channel.toLowerCase()}`;
            slider.oninput = () => updateSliderBackground(slider, getChannelColor(channel));
            // Remove onchange handler to prevent immediate sending
            sliderContainer.appendChild(slider);

            dropdown.appendChild(sliderContainer);
        });

        // Enregistrer button
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Enregistrer';
        saveButton.className = 'save-button';
        saveButton.onclick = () => saveColor(index);
        dropdown.appendChild(saveButton);

        colorItem.appendChild(dropdown);

        // Options menu
        const optionsMenu = document.createElement('div');
        optionsMenu.className = 'options-menu';
        optionsMenu.id = `options-menu-${index}`;
        optionsMenu.style.display = 'none';

        const optionStart = document.createElement('a');
        optionStart.href = '#';
        optionStart.textContent = 'Déplacer au début';
        optionStart.onclick = (e) => { e.preventDefault(); moveColor(index, 'move_to_start'); };
        optionsMenu.appendChild(optionStart);

        const optionUp = document.createElement('a');
        optionUp.href = '#';
        optionUp.textContent = 'Monter de 1';
        optionUp.onclick = (e) => { e.preventDefault(); moveColor(index, 'move_up'); };
        optionsMenu.appendChild(optionUp);

        const optionDown = document.createElement('a');
        optionDown.href = '#';
        optionDown.textContent = 'Descendre de 1';
        optionDown.onclick = (e) => { e.preventDefault(); moveColor(index, 'move_down'); };
        optionsMenu.appendChild(optionDown);

        const optionEnd = document.createElement('a');
        optionEnd.href = '#';
        optionEnd.textContent = 'Déplacer à la fin';
        optionEnd.onclick = (e) => { e.preventDefault(); moveColor(index, 'move_to_end'); };
        optionsMenu.appendChild(optionEnd);

        colorItem.appendChild(optionsMenu);

        colorsList.appendChild(colorItem);
    });
}

function getColorHex(color) {
    let newR = color.R + color.W;
    let newG = color.G + color.W;
    let newB = color.B + color.W;

    // Calculate the maximum value to check for overflow
    let max = Math.max(newR, newG, newB);

    // If any channel exceeds 32767, scale all channels proportionally
    if (max > 32767) {
        let factor = 32767 / max;
        newR = Math.round(newR * factor);
        newG = Math.round(newG * factor);
        newB = Math.round(newB * factor);
    }

    // Convert to 8-bit RGB for CSS
    const r = Math.round(newR / 32767 * 255);
    const g = Math.round(newG / 32767 * 255);
    const b = Math.round(newB / 32767 * 255);
    return `rgb(${r}, ${g}, ${b})`;
}

function getChannelColor(channel) {
    const colors = {
        'R': '#a50f01',
        'G': '#299e37',
        'B': '#4d8dd6',
        'W': '#ffeac1'
    };
    return colors[channel] || '#000000';
}

function toggleColorDropdown(index) {
    const dropdown = document.getElementById(`color-dropdown-${index}`);
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

function updateSliderBackground(slider, color) {
    var value = slider.value;
    var min = slider.min;
    var max = slider.max;
    var percentage = (value - min) / (max - min) * 100;

    slider.style.background = 'linear-gradient(to right, ' + color + ' 0%, ' + color + ' ' + percentage + '%, #cccccc ' + percentage + '%, #cccccc 100%)';
}

function sendRGBWForColor(index) {
    const sequenceName = getSequenceNameFromURL();
    const colorItem = document.querySelector(`.color-item[data-index='${index}']`);
    const sliders = colorItem.querySelectorAll('.slider');

    let colorData = {};
    sliders.forEach(slider => {
        const channel = slider.id.split('-')[1].toUpperCase();
        colorData[channel] = parseInt(slider.value, 10);
    });

    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch sequence for updating color.');
            }
            return response.json();
        })
        .then(data => {
            data[index] = colorData;
            return fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ colors: data })
            });
        })
        .then(response => {
            if (response.ok) {
                location.reload(); // Refresh the page without alert
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Unknown error while updating color.');
                });
            }
        })
        .catch(error => {
            console.error('Error updating color:', error);
            alert(`Error updating color: ${error.message}`); // Retain alerts for errors
        });
}

function saveColor(index) {
    sendRGBWForColor(index);
}

function deleteColor(index) {
    const sequenceName = getSequenceNameFromURL();

    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch sequence for deletion.');
            }
            return response.json();
        })
        .then(data => {
            data.splice(index, 1);
            return fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ colors: data })
            });
        })
        .then(response => {
            if (response.ok) {
                location.reload(); // Refresh the page without alert
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Unknown error.');
                });
            }
        })
        .catch(error => {
            console.error('Error deleting color:', error);
            alert(`Error deleting color: ${error.message}`); // Retain alerts for errors
        });
}

function toggleOptionsMenu(index) {
    // Close all other options menus
    const allOptionsMenus = document.querySelectorAll('.options-menu');
    allOptionsMenus.forEach(menu => {
        if (menu.id !== `options-menu-${index}`) {
            menu.style.display = 'none';
        }
    });

    // Toggle the selected options menu
    const optionsMenu = document.getElementById(`options-menu-${index}`);
    if (optionsMenu.style.display === 'none' || optionsMenu.style.display === '') {
        optionsMenu.style.display = 'block';
    } else {
        optionsMenu.style.display = 'none';
    }
}

function moveColor(index, action) {
    const sequenceName = getSequenceNameFromURL();

    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch sequence for moving color.');
            }
            return response.json();
        })
        .then(data => {
            if (action === 'move_to_start') {
                const color = data.splice(index, 1)[0];
                data.unshift(color);
            } else if (action === 'move_up') {
                if (index > 0) {
                    [data[index - 1], data[index]] = [data[index], data[index - 1]];
                }
            } else if (action === 'move_down') {
                if (index < data.length - 1) {
                    [data[index + 1], data[index]] = [data[index], data[index + 1]];
                }
            } else if (action === 'move_to_end') {
                const color = data.splice(index, 1)[0];
                data.push(color);
            }
            return fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ colors: data })
            });
        })
        .then(response => {
            if (response.ok) {
                location.reload(); // Refresh the page without alert
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Unknown error while moving color.');
                });
            }
        })
        .catch(error => {
            console.error('Error moving color:', error);
            alert(`Error moving color: ${error.message}`); // Retain alerts for errors
        });
}

function createSequence(sequenceName) {
    fetch('http://barry.local:5000/sequences/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sequence_name: sequenceName,
            colors: [{ R: 0, G: 0, B: 0, W: 0 }] // Initialize with one black color
        })
    })
    .then(response => {
        if (response.status === 201) {
            location.reload(); // Refresh the page without alert
        } else {
            return response.json().then(data => {
                throw new Error(data.error || 'Unknown error.');
            });
        }
    })
    .catch(error => {
        console.error('Error creating sequence:', error);
        alert(`Error creating sequence: ${error.message}`); // Retain alerts for errors
    });
}

function openAddModal() {
    const addModal = document.getElementById('add-modal');
    addModal.style.display = 'block';

    const confirmAddBtn = document.getElementById('confirm-add');
    const cancelAddBtn = document.getElementById('cancel-delete');

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

    document.getElementById('cancel-delete').onclick = () => {
        addModal.style.display = 'none';
    };
}

function renameSequence(oldName, newName) {
    if (newName === '') {
        alert('Le nom de la séquence ne peut pas être vide.');
        return;
    }

    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(oldName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch sequence for renaming.');
            }
            return response.json();
        })
        .then(data => {
            // Create new sequence with the new name
            return fetch('http://barry.local:5000/sequences/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sequence_name: newName,
                    colors: data
                })
            });
        })
        .then(response => {
            if (response.status === 201) {
                // Delete the old sequence
                return fetch(`http://barry.local:5000/sequences/${encodeURIComponent(oldName)}`, {
                    method: 'DELETE'
                });
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Erreur inconnue lors de la création de la nouvelle séquence.');
                });
            }
        })
        .then(response => {
            if (response.ok) {
                // Redirect to the modify_sequence page with the new name
                window.location.href = `modify_sequence.shtml?name=${encodeURIComponent(newName)}`;
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Erreur inconnue lors de la suppression de l\'ancienne séquence.');
                });
            }
        })
        .catch(error => {
            console.error('Error renaming sequence:', error);
            alert(`Erreur lors du renommage de la séquence: ${error.message}`); // Retain alerts for errors
        });
}

function addColor() {
    const sequenceName = getSequenceNameFromURL();

    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch sequence for adding color.');
            }
            return response.json();
        })
        .then(data => {
            data.push({ R: 0, G: 0, B: 0, W: 0 });
            return fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ colors: data })
            });
        })
        .then(response => {
            if (response.ok) {
                location.reload(); // Refresh the page without alert
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Unknown error while adding color.');
                });
            }
        })
        .catch(error => {
            console.error('Error adding color:', error);
            alert(`Erreur lors de l'ajout de la couleur: ${error.message}`);
        });
}

function initializeModifySequencePage() {
    const renameForm = document.getElementById('rename-form');
    if (renameForm) {
        renameForm.onsubmit = function(event) {
            event.preventDefault();
            const oldName = getSequenceNameFromURL();
            const newName = document.getElementById('sequence-name-input').value.trim();
            renameSequence(oldName, newName);
        };
    }

    fetchSequence(getSequenceNameFromURL());

    const addColorButton = document.getElementById('add-color-button');
    if (addColorButton) {
        addColorButton.onclick = openAddModal;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.endsWith('lampe_chambre.shtml')) {
        initializeLampeChambrePage();
    } else if (path.endsWith('sequences.shtml')) {
        initializeSequencesPage();
    } else if (path.endsWith('modify_sequence.shtml')) {
        initializeModifySequencePage();
    }
});

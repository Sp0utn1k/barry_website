// js/modify_sequence.js

// Function to retrieve the sequence name from the URL
function getSequenceNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('name');
}

// Function to fetch the current sequence data
function fetchSequence(sequenceName) {
    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Échec de la récupération de la séquence.');
            }
            return response.json();
        })
        .then(data => {
            populateSequenceData(sequenceName, data);
            initializeSliders(); // Initialize sliders after populating data
        })
        .catch(error => {
            console.error('Erreur lors de la récupération de la séquence:', error);
            alert('Erreur lors du chargement de la séquence.');
        });
}

// Function to populate the sequence data into the DOM
function populateSequenceData(sequenceName, data) {
    const nameInput = document.getElementById('sequence-name-input');
    nameInput.value = sequenceName;

    const colorsList = document.getElementById('colors-list');
    colorsList.innerHTML = '';

    data.forEach((color, index) => {
        const colorItem = document.createElement('li');
        colorItem.className = 'color-item';
        colorItem.dataset.index = index;

        // Color Name with Thin Black Contour
        const colorName = document.createElement('span');
        colorName.className = 'color-name';
        colorName.textContent = `Couleur ${index + 1}`;
        colorName.style.color = getColorHex(color);
        colorName.onclick = () => toggleColorDropdown(index);
        colorItem.appendChild(colorName);

        // Icons Container for Delete and Options
        const iconsContainer = document.createElement('div');
        iconsContainer.className = 'icons-container';

        // Delete Icon
        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'delete-icon';
        deleteIcon.innerHTML = '&#128465;'; // Trash can icon
        deleteIcon.title = 'Supprimer la couleur';
        deleteIcon.onclick = () => deleteColor(index);
        iconsContainer.appendChild(deleteIcon);

        // Options Icon
        const optionsButton = document.createElement('span');
        optionsButton.className = 'options-icon';
        optionsButton.innerHTML = '&#9776;'; // Hamburger menu icon
        optionsButton.title = 'Options';
        optionsButton.onclick = () => toggleOptionsMenu(index);
        iconsContainer.appendChild(optionsButton);

        colorItem.appendChild(iconsContainer);

        // Dropdown for Editing Color
        const dropdown = document.createElement('div');
        dropdown.className = 'color-dropdown';
        dropdown.id = `color-dropdown-${index}`;
        dropdown.style.display = 'none';

        // Sliders for R, G, B, W
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
            // Event listeners for real-time updates
            slider.addEventListener('input', () => {
                updateSliderBackground(slider, getChannelColor(channel));
                sendRGBWValues(index);
            });
            sliderContainer.appendChild(slider);

            dropdown.appendChild(sliderContainer);
        });

        // 'Enregistrer' Button within Dropdown
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Enregistrer';
        saveButton.className = 'save-button';
        saveButton.onclick = () => saveColor(index);
        dropdown.appendChild(saveButton);

        colorItem.appendChild(dropdown);

        // Options Menu
        const optionsMenu = document.createElement('div');
        optionsMenu.className = 'options-menu';
        optionsMenu.id = `options-menu-${index}`;
        optionsMenu.style.display = 'none';

        // Option: Move to Start
        const optionStart = document.createElement('a');
        optionStart.href = '#';
        optionStart.textContent = 'Déplacer au début';
        optionStart.onclick = (e) => { 
            e.preventDefault(); 
            moveColor(index, 'move_to_start'); 
        };
        optionsMenu.appendChild(optionStart);

        // Option: Move Up
        const optionUp = document.createElement('a');
        optionUp.href = '#';
        optionUp.textContent = 'Monter de 1';
        optionUp.onclick = (e) => { 
            e.preventDefault(); 
            moveColor(index, 'move_up'); 
        };
        optionsMenu.appendChild(optionUp);

        // Option: Move Down
        const optionDown = document.createElement('a');
        optionDown.href = '#';
        optionDown.textContent = 'Descendre de 1';
        optionDown.onclick = (e) => { 
            e.preventDefault(); 
            moveColor(index, 'move_down'); 
        };
        optionsMenu.appendChild(optionDown);

        // Option: Move to End
        const optionEnd = document.createElement('a');
        optionEnd.href = '#';
        optionEnd.textContent = 'Déplacer à la fin';
        optionEnd.onclick = (e) => { 
            e.preventDefault(); 
            moveColor(index, 'move_to_end'); 
        };
        optionsMenu.appendChild(optionEnd);

        colorItem.appendChild(optionsMenu);

        colorsList.appendChild(colorItem);
    });
}

// Function to calculate the color hex including the W value
function getColorHex(color) {
    let newR = color.R + color.W;
    let newG = color.G + color.W;
    let newB = color.B + color.W;

    // Prevent overflow by scaling if necessary
    const max = Math.max(newR, newG, newB);
    if (max > 32767) {
        const factor = 32767 / max;
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

// Function to get the color associated with each channel
function getChannelColor(channel) {
    const colors = {
        'R': '#a50f01',
        'G': '#299e37',
        'B': '#4d8dd6',
        'W': '#ffeac1'
    };
    return colors[channel] || '#000000';
}

// Function to toggle the color dropdown
function toggleColorDropdown(index) {
    const dropdown = document.getElementById(`color-dropdown-${index}`);
    dropdown.style.display = dropdown.style.display === 'none' || dropdown.style.display === '' ? 'block' : 'none';
}

// Function to update the slider background based on its value
function updateSliderBackground(slider, color) {
    const value = slider.value;
    const min = slider.min;
    const max = slider.max;
    const percentage = (value - min) / (max - min) * 100;

    slider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #cccccc ${percentage}%, #cccccc 100%)`;
    slider.style.setProperty('--slider-color', color);
}

// Function to send RGBW values in real-time (similar to lampe_chambre.js)
function sendRGBWValues(index) {
    const sequenceName = getSequenceNameFromURL();
    const colorItem = document.querySelector(`.color-item[data-index='${index}']`);
    const sliders = colorItem.querySelectorAll('.slider');

    let colorData = {};
    sliders.forEach(slider => {
        const channel = slider.id.split('-')[1].toUpperCase();
        colorData[channel] = parseInt(slider.value, 10);
    });

    // Debounce or queue logic can be implemented here if needed

    fetch(`http://barry.local:5000/setRGBW`, { // Assuming /setRGBW endpoint handles individual color updates
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sequence: sequenceName,
            color_index: index,
            R: colorData.R,
            G: colorData.G,
            B: colorData.B,
            W: colorData.W
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Échec de l\'envoi des valeurs RGBW.');
        }
        console.log(`Valeurs RGBW pour couleur ${index + 1} envoyées avec succès.`);
    })
    .catch(error => {
        console.error('Erreur lors de l\'envoi des valeurs RGBW:', error);
    });
}

// Function to save the entire sequence when 'Enregistrer' is clicked
function saveSequence() {
    const sequenceName = getSequenceNameFromURL();
    const colorItems = document.querySelectorAll('.color-item');

    let colors = [];
    colorItems.forEach(colorItem => {
        const sliders = colorItem.querySelectorAll('.slider');
        let colorData = {};
        sliders.forEach(slider => {
            const channel = slider.id.split('-')[1].toUpperCase();
            colorData[channel] = parseInt(slider.value, 10);
        });
        colors.push(colorData);
    });

    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ colors: colors })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Échec de la sauvegarde de la séquence.');
        }
        // Reload the page to reflect changes without alert
        window.location.reload();
    })
    .catch(error => {
        console.error('Erreur lors de la sauvegarde de la séquence:', error);
        alert(`Erreur lors de la sauvegarde de la séquence: ${error.message}`);
    });
}

// Function to delete a color from the sequence
function deleteColor(index) {
    const sequenceName = getSequenceNameFromURL();

    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Échec de la récupération de la séquence pour la suppression.');
            }
            return response.json();
        })
        .then(data => {
            data.splice(index, 1); // Remove the color at the specified index
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
                // Reload the page to reflect changes without alert
                window.location.reload();
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Erreur inconnue lors de la suppression.');
                });
            }
        })
        .catch(error => {
            console.error('Erreur lors de la suppression de la couleur:', error);
            alert(`Erreur lors de la suppression de la couleur: ${error.message}`);
        });
}

// Function to toggle the options menu, ensuring only one is open at a time
function toggleOptionsMenu(index) {
    const allOptionsMenus = document.querySelectorAll('.options-menu');
    allOptionsMenus.forEach(menu => {
        if (menu.id !== `options-menu-${index}`) {
            menu.style.display = 'none';
        }
    });

    const optionsMenu = document.getElementById(`options-menu-${index}`);
    optionsMenu.style.display = optionsMenu.style.display === 'none' || optionsMenu.style.display === '' ? 'block' : 'none';
}

// Function to move a color within the sequence
function moveColor(index, action) {
    const sequenceName = getSequenceNameFromURL();

    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Échec de la récupération de la séquence pour le déplacement.');
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
                // Reload the page to reflect changes without alert
                window.location.reload();
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Erreur inconnue lors du déplacement de la couleur.');
                });
            }
        })
        .catch(error => {
            console.error('Erreur lors du déplacement de la couleur:', error);
            alert(`Erreur lors du déplacement de la couleur: ${error.message}`);
        });
}

// Function to add a new black color at the end of the sequence
function addColor() {
    const sequenceName = getSequenceNameFromURL();

    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Échec de la récupération de la séquence pour l\'ajout de la couleur.');
            }
            return response.json();
        })
        .then(data => {
            data.push({ R: 0, G: 0, B: 0, W: 0 }); // Add a new black color
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
                // Reload the page to reflect changes without alert
                window.location.reload();
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Erreur inconnue lors de l\'ajout de la couleur.');
                });
            }
        })
        .catch(error => {
            console.error('Erreur lors de l\'ajout de la couleur:', error);
            alert(`Erreur lors de l'ajout de la couleur: ${error.message}`);
        });
}

// Function to rename the sequence
function renameSequence(oldName, newName) {
    if (newName === '') {
        alert('Le nom de la séquence ne peut pas être vide.');
        return;
    }

    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(oldName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Échec de la récupération de la séquence pour le renommage.');
            }
            return response.json();
        })
        .then(data => {
            // Create a new sequence with the new name
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
            console.error('Erreur lors du renommage de la séquence:', error);
            alert(`Erreur lors du renommage de la séquence: ${error.message}`);
        });
}

// Function to save a specific color (triggered by 'Enregistrer' button within the dropdown)
function saveColor(index) {
    const sequenceName = getSequenceNameFromURL();
    const colorItem = document.querySelector(`.color-item[data-index='${index}']`);
    const sliders = colorItem.querySelectorAll('.slider');

    let colorData = {};
    sliders.forEach(slider => {
        const channel = slider.id.split('-')[1].toUpperCase();
        colorData[channel] = parseInt(slider.value, 10);
    });

    // Update the specific color in the sequence
    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Échec de la récupération de la séquence pour la mise à jour.');
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
                // Reload the page to reflect changes without alert
                window.location.reload();
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Erreur inconnue lors de la mise à jour de la couleur.');
                });
            }
        })
        .catch(error => {
            console.error('Erreur lors de la mise à jour de la couleur:', error);
            alert(`Erreur lors de la mise à jour de la couleur: ${error.message}`);
        });
}

// Function to handle real-time RGBW sending (mirroring lampe_chambre.js)
function sendRGBWValues(index) {
    const sequenceName = getSequenceNameFromURL();
    const colorItem = document.querySelector(`.color-item[data-index='${index}']`);
    const sliders = colorItem.querySelectorAll('.slider');

    let colorData = {};
    sliders.forEach(slider => {
        const channel = slider.id.split('-')[1].toUpperCase();
        colorData[channel] = parseInt(slider.value, 10);
    });

    fetch(`http://barry.local:5000/setRGBW`, { // Assuming this endpoint handles real-time updates
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sequence: sequenceName,
            color_index: index,
            R: colorData.R,
            G: colorData.G,
            B: colorData.B,
            W: colorData.W
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Échec de l\'envoi des valeurs RGBW.');
        }
        console.log(`Valeurs RGBW pour couleur ${index + 1} envoyées avec succès.`);
    })
    .catch(error => {
        console.error('Erreur lors de l\'envoi des valeurs RGBW:', error);
    });
}

// Function to initialize sliders with their background and event listeners
function initializeSliders() {
    const colorItems = document.querySelectorAll('.color-item');

    colorItems.forEach((colorItem, index) => {
        const sliders = colorItem.querySelectorAll('.slider');
        sliders.forEach(slider => {
            const channel = slider.id.split('-')[1].toLowerCase();
            const color = getChannelColor(channel.toUpperCase());
            updateSliderBackground(slider, color);
        });
    });
}

// Function to handle saving the entire sequence
function handleSaveSequence() {
    const saveButton = document.getElementById('save-sequence-button');
    if (saveButton) {
        saveButton.addEventListener('click', saveSequence);
    }
}

// Function to save the entire sequence
function saveSequence() {
    const sequenceName = getSequenceNameFromURL();
    const colorItems = document.querySelectorAll('.color-item');

    let colors = [];
    colorItems.forEach(colorItem => {
        const sliders = colorItem.querySelectorAll('.slider');
        let colorData = {};
        sliders.forEach(slider => {
            const channel = slider.id.split('-')[1].toUpperCase();
            colorData[channel] = parseInt(slider.value, 10);
        });
        colors.push(colorData);
    });

    fetch(`http://barry.local:5000/sequences/${encodeURIComponent(sequenceName)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ colors: colors })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Échec de la sauvegarde de la séquence.');
        }
        // Reload the page to reflect changes without alert
        window.location.reload();
    })
    .catch(error => {
        console.error('Erreur lors de la sauvegarde de la séquence:', error);
        alert(`Erreur lors de la sauvegarde de la séquence: ${error.message}`);
    });
}

// Function to handle the rename form submission
function handleRenameForm() {
    const renameForm = document.getElementById('rename-form');
    if (renameForm) {
        renameForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const oldName = getSequenceNameFromURL();
            const newName = document.getElementById('sequence-name-input').value.trim();
            renameSequence(oldName, newName);
        });
    }
}

// Function to handle the '+' button for adding a new color
function handleAddColorButton() {
    const addColorButton = document.getElementById('add-color-button');
    if (addColorButton) {
        addColorButton.addEventListener('click', addColor);
    }
}

// Initialize all functionalities for the Modify Sequence page
function initializeModifySequencePage() {
    handleRenameForm();
    handleAddColorButton();
    handleSaveSequence();
    fetchSequence(getSequenceNameFromURL());
}

// Initialize when the DOM content is loaded
document.addEventListener('DOMContentLoaded', initializeModifySequencePage);

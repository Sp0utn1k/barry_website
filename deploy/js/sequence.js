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

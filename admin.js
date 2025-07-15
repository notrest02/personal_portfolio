document.addEventListener('DOMContentLoaded', () => {
    loadWorks();

    const addProjectForm = document.querySelector('#add-project-form');
    if (addProjectForm) {
        addProjectForm.addEventListener('submit', addProject);
    }

    setupThumbnailPositionPicker();
});

async function addProject(event) {
    event.preventDefault(); // Prevent default form submission

    const title = document.querySelector('#title').value;
    const description = document.querySelector('#description').value;
    const thumbnail = document.querySelector('#thumbnail').value;

    try {
        const response = await fetch(window.API_BASE_URL + '/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-api-key': window.ADMIN_API_KEY_CLIENT_SIDE // 여기에 실제 ADMIN_API_KEY를 입력하세요.
            },
            body: JSON.stringify({ title, description, thumbnail, detailedContent: [] })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Clear form and reload projects
        document.querySelector('#title').value = '';
        document.querySelector('#description').value = '';
        document.querySelector('#thumbnail').value = '';
        loadWorks();
    } catch (error) {
        console.error('Error adding project:', error);
    }
}


async function loadWorks() {
    try {
        const response = await fetch(window.API_BASE_URL + '/api/projects');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const projectList = document.querySelector('#project-list');
        if (!projectList) {
            console.error('Error: Could not find the project list element.');
            return;
        }
        
        projectList.innerHTML = '';
        data.forEach(work => {
            const listItem = document.createElement('li');
            listItem.className = 'project-item';
            listItem.dataset.id = work.id; // Add data-id for easy access

            const imageTag = work.thumbnail ? `<img src="${work.thumbnail}" alt="${work.title}" width="100">` : '';

            listItem.innerHTML = `
                <div class="display-view">
                    <div class="project-content">
                        <strong>${work.title || 'No Title'}</strong>
                        <p>${work.description || 'No Description'}</p>
                        ${imageTag}
                    </div>
                    <div class="project-buttons">
                        <button class="edit-button">Edit</button>
                        <button class="delete-button">Delete</button>
                        <button class="move-up-button">Move Up</button>
                        <button class="move-down-button">Move Down</button>
                    </div>
                </div>
                <div class="edit-view" style="display:none;">
                    <label>Title:</label>
                    <input type="text" class="edit-title" value="${work.title || ''}">
                    <label>Description:</label>
                    <textarea class="edit-description">${work.description || ''}</textarea>
                    <label>Thumbnail URL:</label>
                    <input type="text" class="edit-thumbnail" value="${work.thumbnail || ''}">
                    <label>Thumbnail Position (Click on image):</label>
                    <div class="thumbnail-preview-edit" style="width: 200px; height: 150px; border: 1px solid #ccc; background-size: cover; background-repeat: no-repeat; position: relative;" data-thumbnail="${work.thumbnail || ''}" data-position="${work.thumbnailPosition || ''}">
                        <div class="position-marker" style="position: absolute; width: 10px; height: 10px; background-color: red; border-radius: 50%; transform: translate(-50%, -50%); display: none;"></div>
                    </div>
                    <input type="hidden" class="edit-thumbnail-position" value="${work.thumbnailPosition || ''}">
                    <label>Detailed Content:</label>
                    <div class="detailed-content-editor"></div>
                    <div class="detailed-content-controls">
                        <button type="button" class="add-text-layer-button">Add Text</button>
                        <button type="button" class="add-image-group-button">Add Image</button>
                        <button type="button" class="add-divider-layer-button">Add Divider</button>
                    </div>
                    <div>
                        <button class="save-button">Save</button>
                        <button class="cancel-button">Cancel</button>
                    </div>
                </div>
            `;
            projectList.appendChild(listItem);

            // Add event listeners to the buttons
            listItem.querySelector('.edit-button').addEventListener('click', () => toggleEditView(work.id, work.detailedContent));
            listItem.querySelector('.delete-button').addEventListener('click', () => deleteWork(work.id));
            listItem.querySelector('.save-button').addEventListener('click', () => saveWork(work.id));
            listItem.querySelector('.cancel-button').addEventListener('click', () => toggleEditView(work.id));
            listItem.querySelector('.move-up-button').addEventListener('click', () => moveProject(work.id, 'up'));
            listItem.querySelector('.move-down-button').addEventListener('click', () => moveProject(work.id, 'down'));

            // Add layer buttons event listeners
            listItem.querySelector('.add-text-layer-button').addEventListener('click', () => addLayer(work.id, 'text'));
            listItem.querySelector('.add-image-group-button').addEventListener('click', () => addLayer(work.id, 'group'));
            listItem.querySelector('.add-divider-layer-button').addEventListener('click', () => addLayer(work.id, 'divider'));

            // Setup thumbnail position picker for edit view
            const editThumbnailInput = listItem.querySelector('.edit-thumbnail');
            const editThumbnailPreview = listItem.querySelector('.thumbnail-preview-edit');
            const editThumbnailPositionInput = listItem.querySelector('.edit-thumbnail-position');

            // Initialize preview
            if (editThumbnailInput.value) {
                editThumbnailPreview.style.backgroundImage = `url(${editThumbnailInput.value})`;
            }
            if (editThumbnailPositionInput.value) {
                editThumbnailPreview.style.backgroundPosition = editThumbnailPositionInput.value;
            } else {
                editThumbnailPreview.style.backgroundPosition = 'center'; // Default if no position
            }

            // Update preview background when thumbnail URL changes
            editThumbnailInput.addEventListener('input', () => {
                editThumbnailPreview.style.backgroundImage = `url(${editThumbnailInput.value})`;
                editThumbnailPreview.style.backgroundPosition = 'center'; // Reset position on URL change
                editThumbnailPositionInput.value = '';
            });

            // Drag functionality for background-position
            let isDraggingImage = false;
            let startMouseX, startMouseY;
            let startBgX, startBgY;

            editThumbnailPreview.addEventListener('mousedown', (e) => {
                isDraggingImage = true;
                startMouseX = e.clientX;
                startMouseY = e.clientY;

                const currentBgPosition = window.getComputedStyle(editThumbnailPreview).backgroundPosition.split(' ');
                startBgX = parseFloat(currentBgPosition[0]);
                startBgY = parseFloat(currentBgPosition[1]);

                e.preventDefault(); // Prevent default drag behavior
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDraggingImage) return;

                const deltaX = e.clientX - startMouseX;
                const deltaY = e.clientY - startMouseY;

                // Adjust sensitivity if needed
                const sensitivity = 0.5; 
                let newBgX = startBgX - deltaX * sensitivity;
                let newBgY = startBgY - deltaY * sensitivity;

                // Constrain background position to prevent image from going too far
                newBgX = Math.max(0, Math.min(newBgX, 100));
                newBgY = Math.max(0, Math.min(newBgY, 100));

                editThumbnailPreview.style.backgroundPosition = `${newBgX}% ${newBgY}%`;
                editThumbnailPositionInput.value = `${newBgX.toFixed(2)}% ${newBgY.toFixed(2)}%`;
            });

            document.addEventListener('mouseup', () => {
                isDraggingImage = false;
            });
        });
    } catch (error) {
        console.error('Error loading works:', error);
    }
}

async function deleteWork(id) {
    if (!confirm('Are you sure you want to delete this project?')) {
        return; // User cancelled the deletion
    }

    try {
        const response = await fetch(window.API_BASE_URL + `/api/projects/${id}`, {
            method: 'DELETE',
            headers: {
                'x-admin-api-key': window.ADMIN_API_KEY_CLIENT_SIDE // 여기에 실제 ADMIN_API_KEY를 입력하세요.
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        loadWorks();
    } catch (error) {
        console.error('Error deleting work:', error);
    }
}

function toggleEditView(id, detailedContent) {
    const listItem = document.querySelector(`[data-id="${id}"]`);
    if (listItem) {
        const displayView = listItem.querySelector('.display-view');
        const editView = listItem.querySelector('.edit-view');

        if (displayView.style.display === 'none') {
            displayView.style.display = 'block';
            editView.style.display = 'none';
        } else {
            displayView.style.display = 'none';
            editView.style.display = 'block';
            renderDetailedContent(id, detailedContent); // Render the editor when switching to edit view
        }
    }
}

async function saveWork(id) {
    const listItem = document.querySelector(`[data-id="${id}"]`);
    if (!listItem) return;

    const title = listItem.querySelector('.edit-title').value;
    const description = listItem.querySelector('.edit-description').value;
    const thumbnail = listItem.querySelector('.edit-thumbnail').value;
    const thumbnailPosition = listItem.querySelector('.edit-thumbnail-position').value;

    const detailedContentEditor = listItem.querySelector('.detailed-content-editor');
    const layers = [];
    detailedContentEditor.querySelectorAll('.layer').forEach(layerElement => {
        const type = layerElement.dataset.type;
        const marginBottom = layerElement.querySelector('.margin-bottom-input').value;
        let content;

        if (type === 'text') {
            content = layerElement.querySelector('textarea').value;
            layers.push({ type, content, marginBottom });
        } else if (type === 'divider') {
            content = '';
            layers.push({ type, content, marginBottom });
        } else if (type === 'group') {
            const subLayers = [];
            layerElement.querySelectorAll('.sub-layer input[type="text"]').forEach(subLayerInput => {
                subLayers.push({ type: 'image', content: subLayerInput.value });
            });
            const imageGap = layerElement.querySelector('.image-gap-input').value;
            layers.push({ type: 'group', content: subLayers, marginBottom, imageGap });
        }
    });

    try {
        const response = await fetch(window.API_BASE_URL + `/api/projects/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-api-key': window.ADMIN_API_KEY_CLIENT_SIDE
            },
            body: JSON.stringify({ title, description, thumbnail, thumbnailPosition, detailedContent: layers })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        loadWorks();
    } catch (error) {
        console.error('Error saving work:', error);
    }
}

async function moveProject(id, direction) {
    try {
        const response = await fetch(`/api/projects/${id}/move`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-api-key': window.ADMIN_API_KEY_CLIENT_SIDE
            },
            body: JSON.stringify({ direction })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        loadWorks();
    } catch (error) {
        console.error('Error moving project:', error);
    }
}

function setupThumbnailPositionPicker() {}

function renderDetailedContent(id, detailedContent) {
    const listItem = document.querySelector(`[data-id="${id}"]`);
    if (!listItem) return;

    const editor = listItem.querySelector('.detailed-content-editor');
    editor.innerHTML = '';

    if (detailedContent && Array.isArray(detailedContent)) {
        detailedContent.forEach((layer, index) => {
            const layerElement = createLayerElement(id, layer, index);
            editor.appendChild(layerElement);
        });
    }
}

function createLayerElement(id, layer, index) {
    const layerElement = document.createElement('div');
    layerElement.className = `layer ${layer.type}`;
    layerElement.dataset.type = layer.type;
    layerElement.dataset.index = index;

    const marginBottom = layer.marginBottom || 0;

    let contentHtml = '';
    if (layer.type === 'text') {
        contentHtml = `<textarea>${layer.content || ''}</textarea>`;
    } else if (layer.type === 'divider') {
        contentHtml = '<hr>';
    } else if (layer.type === 'group') {
        const subLayersHtml = (layer.content || []).map((subLayer, subIndex) => {
            return `
                <div class="sub-layer" data-sub-index="${subIndex}">
                    <input type="text" value="${subLayer.content || ''}" placeholder="Image URL">
                    <button type="button" class="remove-sub-layer-button">Delete</button>
                </div>
            `;
        }).join('');
        contentHtml = `
            <div class="sub-layers-container">${subLayersHtml}</div>
            <div class="group-controls">
                <div class="layer-margin-control">
                     <label>Margin (px):</label>
                     <input type="number" class="margin-bottom-input" value="${marginBottom}" min="0" step="1">
                </div>
                <div class="layer-margin-control">
                     <label>Image Gap (px):</label>
                     <input type="number" class="image-gap-input" value="${layer.imageGap || 10}" min="0" step="1">
                </div>
                <button type="button" class="add-sub-layer-button">+ Add Image</button>
            </div>
        `;
    }

    layerElement.innerHTML = `
        <div class="layer-content">${contentHtml}</div>
        <div class="layer-controls">
            <button class="move-layer-up-button" title="Move Up">▲</button>
            <button class="move-layer-down-button" title="Move Down">▼</button>
            <button class="remove-layer-button" title="Remove">-</button>
        </div>
        ${layer.type !== 'group' ? `
        <div class="layer-margin-control">
             <label>Margin (px):</label>
             <input type="number" class="margin-bottom-input" value="${marginBottom}" min="0" step="1">
        </div>
        ` : ''}
    `;

    // Add event listeners for layer controls
    layerElement.querySelector('.move-layer-up-button').addEventListener('click', () => moveLayer(id, index, 'up'));
    layerElement.querySelector('.move-layer-down-button').addEventListener('click', () => moveLayer(id, index, 'down'));
    layerElement.querySelector('.remove-layer-button').addEventListener('click', () => removeLayer(id, index));

    // Add event listener for image gap input if it exists
    if (layer.type === 'group') {
        const imageGapInput = layerElement.querySelector('.image-gap-input');
        if (imageGapInput) {
            imageGapInput.addEventListener('input', (e) => {
                // This change won't directly affect admin.html preview, but good for consistency
                // The actual effect will be seen in code.html after saving
            });
        }
    }

    // Event listeners for group layer
    if (layer.type === 'group') {
        layerElement.querySelector('.add-sub-layer-button').addEventListener('click', () => addImageToGroup(id, index));
        layerElement.querySelectorAll('.remove-sub-layer-button').forEach(button => {
            const subLayerElement = button.closest('.sub-layer');
            const subIndex = parseInt(subLayerElement.dataset.subIndex, 10);
            button.addEventListener('click', () => removeImageFromGroup(id, index, subIndex));
        });
    }

    return layerElement;
}

function addImageToGroup(id, groupIndex) {
    const listItem = document.querySelector(`[data-id="${id}"]`);
    if (!listItem) return;

    const groupLayerElement = listItem.querySelector(`.layer[data-index="${groupIndex}"]`);
    if (!groupLayerElement) return;

    const subLayersContainer = groupLayerElement.querySelector('.sub-layers-container');
    const newSubIndex = subLayersContainer.children.length;

    const newSubLayer = document.createElement('div');
    newSubLayer.className = 'sub-layer';
    newSubLayer.dataset.subIndex = newSubIndex;
    newSubLayer.innerHTML = `
        <input type="text" value="" placeholder="Image URL">
        <button type="button" class="remove-sub-layer-button">Delete</button>
    `;

    subLayersContainer.appendChild(newSubLayer);

    newSubLayer.querySelector('.remove-sub-layer-button').addEventListener('click', () => {
        removeImageFromGroup(id, groupIndex, newSubIndex);
    });
}

function removeImageFromGroup(id, groupIndex, subIndex) {
    const listItem = document.querySelector(`[data-id="${id}"]`);
    if (!listItem) return;

    const groupLayerElement = listItem.querySelector(`.layer[data-index="${groupIndex}"]`);
    if (!groupLayerElement) return;

    const subLayerToRemove = groupLayerElement.querySelector(`.sub-layer[data-sub-index="${subIndex}"]`);
    if (subLayerToRemove) {
        subLayerToRemove.remove();
        
        const subLayersContainer = groupLayerElement.querySelector('.sub-layers-container');
        Array.from(subLayersContainer.children).forEach((subLayer, newSubIndex) => {
            subLayer.dataset.subIndex = newSubIndex;
            const button = subLayer.querySelector('.remove-sub-layer-button');
            if(button) {
                button.onclick = () => removeImageFromGroup(id, groupIndex, newSubIndex);
            }
        });
    }
}

function addLayer(id, type) {
    const listItem = document.querySelector(`[data-id="${id}"]`);
    if (!listItem) return;

    const editor = listItem.querySelector('.detailed-content-editor');
    const newIndex = editor.children.length;
    
    let newLayer;
    if (type === 'group') {
        newLayer = { type: 'group', content: [{type: 'image', content: ''}], marginBottom: 20, imageGap: 10 };
    } else {
        newLayer = { type, content: '', marginBottom: 20 };
    }

    const layerElement = createLayerElement(id, newLayer, newIndex);
    editor.appendChild(layerElement);
}

function removeLayer(id, index) {
    if (!confirm('Are you sure you want to delete this layer?')) {
        return;
    }

    const listItem = document.querySelector(`[data-id="${id}"]`);
    if (!listItem) return;

    const editor = listItem.querySelector('.detailed-content-editor');
    const layerToRemove = editor.querySelector(`[data-index="${index}"]`);
    if (layerToRemove) {
        layerToRemove.remove();
        Array.from(editor.children).forEach((layer, newIndex) => {
            layer.dataset.index = newIndex;
            layer.querySelector('.move-layer-up-button').onclick = () => moveLayer(id, newIndex, 'up');
            layer.querySelector('.move-layer-down-button').onclick = () => moveLayer(id, newIndex, 'down');
            layer.querySelector('.remove-layer-button').onclick = () => removeLayer(id, newIndex);
        });
    }
}

function moveLayer(id, index, direction) {
    const listItem = document.querySelector(`[data-id="${id}"]`);
    if (!listItem) return;

    const editor = listItem.querySelector('.detailed-content-editor');
    const layers = Array.from(editor.children);

    if (direction === 'up' && index > 0) {
        editor.insertBefore(layers[index], layers[index - 1]);
    } else if (direction === 'down' && index < layers.length - 1) {
        editor.insertBefore(layers[index + 1], layers[index]);
    }

    Array.from(editor.children).forEach((layer, newIndex) => {
        layer.dataset.index = newIndex;
        layer.querySelector('.move-layer-up-button').onclick = () => moveLayer(id, newIndex, 'up');
        layer.querySelector('.move-layer-down-button').onclick = () => moveLayer(id, newIndex, 'down');
        layer.querySelector('.remove-layer-button').onclick = () => removeLayer(id, newIndex);
    });
}
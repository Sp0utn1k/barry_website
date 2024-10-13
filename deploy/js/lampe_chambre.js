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

// Load the presets from the JSON file
fetch('presets.json')
    .then(response => response.json())
    .then(data => {
        displayPresets(data);
    })
    .catch(error => console.error('Error loading presets:', error));

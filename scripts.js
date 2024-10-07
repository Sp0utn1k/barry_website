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

function sendRGBWValues() {
    if (isSending) {
        // Queue the value if a request is in progress
        queuedValue = {
            red: document.getElementById('slider-red').value,
            green: document.getElementById('slider-green').value,
            blue: document.getElementById('slider-blue').value,
            warmWhite: document.getElementById('slider-warm-white').value
        };
        return;
    }

    var red = document.getElementById('slider-red').value;
    var green = document.getElementById('slider-green').value;
    var blue = document.getElementById('slider-blue').value;
    var warmWhite = document.getElementById('slider-warm-white').value;

    // Only send if values have changed
    if (red == lastSentValues.red && green == lastSentValues.green && blue == lastSentValues.blue && warmWhite == lastSentValues.warmWhite) {
        return;
    }

    lastSentValues = {red: red, green: green, blue: blue, warmWhite: warmWhite};
    isSending = true;

    var rgbwString = `${red} ${green} ${blue} ${warmWhite}\\n`;

    // Send the data to your backend server
    fetch('http://barry.local:5000/sendRGBW', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({rgbw: rgbwString})
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
            lastSentValues = queuedValue;  // Update the last sent values
            var queuedRgbwString = `${queuedValue.red} ${queuedValue.green} ${queuedValue.blue} ${queuedValue.warmWhite}\\n`;
            queuedValue = null;  // Clear the queue

            // Send the queued value
            fetch('http://barry.local:5000/sendRGBW', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({rgbw: queuedRgbwString})
            }).then(response => {
                if (response.ok) {
                    console.log('Queued RGBW values sent:', queuedRgbwString);
                } else {
                    console.error('Failed to send queued RGBW values');
                }
            }).catch(error => {
                console.error('Error sending queued RGBW values:', error);
            });
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

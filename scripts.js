
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

function sendRGBWValues() {
    if (isSending) return;

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

    // Send the data via fetch
    var rgbwString = `${red} ${green} ${blue} ${warmWhite}\n`;

    fetch('http://bedroom0.local:1234', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: rgbwString
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
    });
}

sliders.forEach(function(s) {
    var slider = document.getElementById(s.id);
    updateSliderBackground(slider, s.color);

    // Send values while the slider is held
    slider.addEventListener('input', function() {
        updateSliderBackground(slider, s.color);
        sendRGBWValues();
    });
});

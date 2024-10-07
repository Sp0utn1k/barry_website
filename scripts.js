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

sliders.forEach(function(s) {
    var slider = document.getElementById(s.id);
    updateSliderBackground(slider, s.color);
    slider.addEventListener('input', function() {
        updateSliderBackground(slider, s.color);
    });
});

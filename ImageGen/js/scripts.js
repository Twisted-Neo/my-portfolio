const images = [
    'assets/Ashveil.png',
    'assets/Cinderfall.png',
    'assets/Dungeon1.png',
    'assets/Emberhold.png',
    'assets/Frostmere.png',
    'assets/Mirenford.png',
    'assets/PyrasRest.png',
    'assets/Rivenshore.png',
    'assets/Seafallow.png'
];

const imageElement = document.getElementById('activeImage');

function imageGen() {
    var a = Math.floor(Math.random() * images.length);
    var imgPath = images[a];

    imageElement.src = imgPath;
    imageElement.style.display = 'block';
}
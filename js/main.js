document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.timeline-item');
    const portal = document.getElementById('transition-portal');

    items.forEach(item => {
        item.addEventListener('click', () => {
            const url = item.getAttribute('data-url');
            
            // 1. Trigger the "Fill Screen" animation
            portal.style.backgroundColor = getComputedStyle(item.querySelector('.timeline-dot')).borderColor;
            portal.classList.add('active');

            // 2. Play a sound if you have one
            // if(sounds.select) sounds.select.play();

            // 3. Wait for animation to finish, then redirect
            setTimeout(() => {
                window.location.href = url;
            }, 600);
        });
    });
});

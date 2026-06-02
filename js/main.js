document.addEventListener('DOMContentLoaded', () => {
    // 1. IMPROVED NAVIGATION HIGHLIGHTING
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // 2. REDONE PROJECT TRANSITION (PORTAL EFFECT)
    const portal = document.getElementById('transition-portal') || createPortal();
    const timelineItems = document.querySelectorAll('.timeline-item');

    function createPortal() {
        const p = document.createElement('div');
        p.id = 'transition-portal';
        document.body.appendChild(p);
        return p;
    }

    timelineItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const targetUrl = item.getAttribute('data-url');
            if (!targetUrl) return;

            // Trigger Portal Effect
            portal.classList.add('active');
            
            // Lock UI
            document.body.style.overflow = 'hidden';
            
            // Navigate after animation
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 500);
        });
    });

    // 3. SKETCHY GLITCH EFFECT ON BUTTONS
    const actionBtns = document.querySelectorAll('.btn, .submit-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = `skewX(${Math.random() * 4 - 2}deg)`;
            btn.style.filter = 'hue-rotate(90deg)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'skewX(0deg)';
            btn.style.filter = 'none';
        });
    });

    // 4. CONTACT FORM HANDLING
    const contactForm = document.getElementById('uplink-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const feedback = document.getElementById('form-feedback');
            feedback.textContent = "UPLINK_SUCCESS: MESSAGE_ENCRYPTED";
            feedback.style.color = "var(--neon-green)";
            feedback.classList.remove('hidden');
            contactForm.reset();
        });
    }
});
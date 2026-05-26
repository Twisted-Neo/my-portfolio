document.addEventListener('DOMContentLoaded', () => {
    // Active navigation highlighting
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    const timelineItems = document.querySelectorAll('.timeline-item');

    timelineItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = item.getAttribute('data-url');
            if (!url) return;

            const imgElement = item.querySelector('.screen-content img');
            if (!imgElement) {
                window.location.href = url;
                return;
            }

            // Prevent accidental double-clicks
            timelineItems.forEach(i => i.style.pointerEvents = 'none');

            // --- Create full-screen fixed overlay ---
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.96)';
            overlay.style.backdropFilter = 'blur(12px)';
            overlay.style.zIndex = '20000';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';

            // --- Clone the image ---
            const clone = imgElement.cloneNode(true);
            // Keep the original aspect ratio and styling
            const naturalW = imgElement.naturalWidth || imgElement.width;
            const naturalH = imgElement.naturalHeight || imgElement.height;
            const maxW = window.innerWidth * 0.85;
            const maxH = window.innerHeight * 0.85;
            let finalW = naturalW;
            let finalH = naturalH;

            if (finalW > maxW || finalH > maxH) {
                const scale = Math.min(maxW / finalW, maxH / finalH);
                finalW *= scale;
                finalH *= scale;
            }

            clone.style.width = `${finalW}px`;
            clone.style.height = `${finalH}px`;
            clone.style.objectFit = 'contain';
            clone.style.borderRadius = '12px';
            clone.style.boxShadow = '0 0 0 4px var(--neon-blue), 0 0 50px rgba(0, 243, 255, 0.9)';
            clone.style.transform = 'scale(0.85)';
            clone.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1), opacity 0.4s ease';
            clone.style.opacity = '0';

            overlay.appendChild(clone);
            document.body.appendChild(overlay);

            // Force layout then animate in
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                clone.style.opacity = '1';
                clone.style.transform = 'scale(1)';
            });

            // --- Navigate when the animation finishes ---
            const onTransitionEnd = (e) => {
                if (e.propertyName === 'transform') {
                    clone.removeEventListener('transitionend', onTransitionEnd);
                    window.location.href = url;
                }
            };
            clone.addEventListener('transitionend', onTransitionEnd, { once: true });

            // Fallback navigation (1 second)
            const fallback = setTimeout(() => {
                if (document.body.contains(overlay)) {
                    window.location.href = url;
                }
            }, 1000);

            // Clean up if page is hidden early
            window.addEventListener('pagehide', () => {
                clearTimeout(fallback);
            }, { once: true });
        });
    });

    // Contact form handling (unchanged)
    const contactForm = document.getElementById('uplink-form');
    const feedbackDiv = document.getElementById('form-feedback');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');

            let isValid = true;

            if (!nameInput.value.trim()) {
                markInvalid(nameInput, 'IDENT_NAME required');
                isValid = false;
            } else {
                markValid(nameInput);
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailInput.value.trim() || !emailPattern.test(emailInput.value.trim())) {
                markInvalid(emailInput, 'Valid UPLINK_EMAIL required');
                isValid = false;
            } else {
                markValid(emailInput);
            }

            if (!messageInput.value.trim()) {
                markInvalid(messageInput, 'TRANSMISSION_DATA cannot be empty');
                isValid = false;
            } else {
                markValid(messageInput);
            }

            if (isValid) {
                showFeedback('TRANSMISSION_ENCRYPTED // OPERATOR WILL RESPOND WITHIN 24 CYCLES', 'success');
                contactForm.reset();
                setTimeout(() => {
                    hideFeedback();
                }, 5000);
            }
        });

        function markInvalid(input, message) {
            input.style.borderColor = '#ff0055';
            input.style.boxShadow = '0 0 8px rgba(255, 0, 85, 0.5)';
            const existingError = input.parentNode.querySelector('.error-message');
            if (!existingError) {
                const errorSpan = document.createElement('span');
                errorSpan.className = 'error-message';
                errorSpan.style.color = '#ff0055';
                errorSpan.style.fontSize = '0.65rem';
                errorSpan.style.fontFamily = "'Press Start 2P', monospace";
                errorSpan.style.marginTop = '-1.5rem';
                errorSpan.style.display = 'block';
                errorSpan.style.marginBottom = '1rem';
                errorSpan.textContent = `> ERROR: ${message}`;
                input.parentNode.appendChild(errorSpan);
            }
        }

        function markValid(input) {
            input.style.borderColor = '#39ff14';
            input.style.boxShadow = '0 0 8px rgba(57, 255, 20, 0.3)';
            const existingError = input.parentNode.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
        }

        function showFeedback(msg, type) {
            if (feedbackDiv) {
                feedbackDiv.textContent = `> ${msg}`;
                feedbackDiv.className = `form-feedback ${type}`;
                feedbackDiv.style.display = 'block';
                feedbackDiv.style.background = 'rgba(0, 0, 0, 0.8)';
                feedbackDiv.style.border = `1px solid ${type === 'success' ? '#39ff14' : '#ff0055'}`;
                feedbackDiv.style.padding = '1rem';
                feedbackDiv.style.marginTop = '1.5rem';
                feedbackDiv.style.fontFamily = "'Press Start 2P', monospace";
                feedbackDiv.style.fontSize = '0.65rem';
                feedbackDiv.style.color = type === 'success' ? '#39ff14' : '#ff0055';
                feedbackDiv.style.textAlign = 'center';
            }
        }

        function hideFeedback() {
            if (feedbackDiv) {
                feedbackDiv.style.display = 'none';
            }
        }
    }

    // Button glitch effect
    const buttons = document.querySelectorAll('.btn, .submit-btn, .launch-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'skewX(-2deg)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'skewX(0deg)';
        });
    });

    // Scanline animation for about page
    const scanLine = document.querySelector('.scan-line');
    if (scanLine) {
        setInterval(() => {
            scanLine.style.opacity = '0.5';
            setTimeout(() => {
                scanLine.style.opacity = '1';
            }, 100);
        }, 2000);
    }

    console.log('%c[SYSTEM] NODE_EXPLORER PORTFOLIO LOADED', 'color: #00f3ff; font-family: monospace; font-size: 12px');
});
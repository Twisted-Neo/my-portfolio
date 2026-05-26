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

            // Get the image's viewport position and size
            const rect = imgElement.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                window.location.href = url;
                return;
            }

            // Copy essential computed styles so the clone looks identical
            const computed = getComputedStyle(imgElement);
            const objectFit = computed.objectFit;
            const borderRadius = computed.borderRadius;

            // Disable all timeline clicks during animation
            timelineItems.forEach(i => i.style.pointerEvents = 'none');

            // --- Create overlay (fades in) ---
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.96)';
            overlay.style.backdropFilter = 'blur(12px)';
            overlay.style.zIndex = '20000';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';

            // --- Clone the image ---
            const clone = imgElement.cloneNode(true);
            // Force it to exactly the original’s rendered size
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            clone.style.objectFit = objectFit;
            clone.style.borderRadius = borderRadius;
            clone.style.position = 'absolute';
            // Start exactly over the original using transform (GPU)
            clone.style.transform = `translate(${rect.left}px, ${rect.top}px) scale(1)`;
            clone.style.transformOrigin = '0 0';
            clone.style.zIndex = '20001';
            clone.style.boxShadow = '0 0 0 2px var(--neon-blue), 0 0 20px rgba(0, 243, 255, 0.5)';
            clone.style.transition = 'transform 0.65s cubic-bezier(0.2, 0.9, 0.4, 1.1), box-shadow 0.65s ease';
            clone.style.willChange = 'transform';

            overlay.appendChild(clone);
            document.body.appendChild(overlay);

            // Force a style recalculation so the browser registers the starting position
            clone.offsetHeight;

            // --- Fade in the dark background ---
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
            });

            // --- Calculate the final centered scale ---
            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;
            const maxW = viewportW * 0.9;
            const maxH = viewportH * 0.9;
            const imgRatio = rect.width / rect.height;
            let finalW, finalH;
            if (maxW / maxH > imgRatio) {
                finalH = maxH;
                finalW = finalH * imgRatio;
            } else {
                finalW = maxW;
                finalH = finalW / imgRatio;
            }
            const scale = finalW / rect.width; // same as finalH / rect.height
            const finalCenterX = (viewportW - finalW) / 2;
            const finalCenterY = (viewportH - finalH) / 2;

            // --- Start the expansion after a micro‑delay ---
            setTimeout(() => {
                clone.style.transform = `translate(${finalCenterX}px, ${finalCenterY}px) scale(${scale})`;
                clone.style.boxShadow = '0 0 0 4px var(--neon-blue), 0 0 50px rgba(0, 243, 255, 0.9)';
            }, 20);

            // --- Navigate when the animation ends ---
            const onTransitionEnd = () => {
                clone.removeEventListener('transitionend', onTransitionEnd);
                window.location.href = url;
            };
            clone.addEventListener('transitionend', onTransitionEnd, { once: true });

            // Fallback: if the transition never fires, still navigate
            const fallbackTimer = setTimeout(() => {
                if (document.body.contains(overlay)) {
                    // Clean up if possible
                    document.body.removeChild(overlay);
                    timelineItems.forEach(i => i.style.pointerEvents = 'auto');
                    window.location.href = url;
                }
            }, 1200);

            // If the user somehow navigates back before the fallback, clean up
            window.addEventListener('pagehide', () => {
                clearTimeout(fallbackTimer);
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
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
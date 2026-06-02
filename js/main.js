document.addEventListener('DOMContentLoaded', () => {
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

    // --- PROJECT EMBED ---
    const timelineItems = document.querySelectorAll('.timeline-item');
    const embedContainer = document.getElementById('project-embed-container');
    let currentEmbedOpen = false;
    let currentIframe = null;
    let isFullscreen = false;

    timelineItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', async (e) => {
            e.stopPropagation();
            const projectUrl = item.getAttribute('data-url');
            const previewImgSrc = item.getAttribute('data-img');
            if (!projectUrl) return;

            if (currentEmbedOpen) {
                embedContainer.style.display = 'none';
                embedContainer.innerHTML = '';
                currentEmbedOpen = false;
                currentIframe = null;
                isFullscreen = false;
            }

            embedContainer.innerHTML = `
                <div class="embed-header">
                    <button class="embed-btn" id="start-project">START</button>
                    <button class="embed-btn" id="fullscreen-project">FULLSCREEN</button>
                    <button class="embed-btn" id="close-embed">CLOSE</button>
                </div>
                <div class="embed-preview" id="embed-preview">
                    <img src="${previewImgSrc}" alt="Project preview">
                    <div class="start-overlay">
                        <span style="font-family:'Press Start 2P'; font-size:0.7rem;">>> PRESS START TO LAUNCH <<</span>
                    </div>
                </div>
            `;
            embedContainer.style.display = 'block';
            currentEmbedOpen = true;

            // Scroll to embed
            embedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Button references
            const startBtn = document.getElementById('start-project');
            const fullBtn = document.getElementById('fullscreen-project');
            const closeBtn = document.getElementById('close-embed');

            // START:
            startBtn.addEventListener('click', () => {
                const previewDiv = document.getElementById('embed-preview');
                if (!previewDiv) return;
                previewDiv.innerHTML = `
                    <div class="iframe-container">
                        <iframe src="${projectUrl}" title="Project Embed" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"></iframe>
                    </div>
                `;
                currentIframe = previewDiv.querySelector('iframe');
                startBtn.remove();
                console.log(`[EMBED] Loaded project: ${projectUrl}`);
            });

            // FULLSCREEN
            fullBtn.addEventListener('click', () => {
                const target = currentIframe ? currentIframe.parentElement : document.getElementById('embed-preview');
                if (!target) return;

                if (!isFullscreen) {
                    if (target.requestFullscreen) {
                        target.requestFullscreen();
                    } else if (target.webkitRequestFullscreen) {
                        target.webkitRequestFullscreen();
                    }
                    fullBtn.textContent = 'EXIT';
                    isFullscreen = true;
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                    fullBtn.textContent = 'FULLSCREEN';
                    isFullscreen = false;
                }
            });

            document.addEventListener('fullscreenchange', () => {
                if (!document.fullscreenElement) {
                    fullBtn.textContent = 'FULLSCREEN';
                    isFullscreen = false;
                }
            });
            document.addEventListener('webkitfullscreenchange', () => {
                if (!document.webkitFullscreenElement) {
                    fullBtn.textContent = 'FULLSCREEN';
                    isFullscreen = false;
                }
            });

            // CLOSE
            closeBtn.addEventListener('click', () => {
                embedContainer.style.display = 'none';
                embedContainer.innerHTML = '';
                currentEmbedOpen = false;
                currentIframe = null;
                isFullscreen = false;
            });
        });
    });

    // --- Contact form handling ---
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

    // Button effect
    const buttons = document.querySelectorAll('.btn, .submit-btn, .launch-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'skewX(-2deg)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'skewX(0deg)';
        });
    });

    // Scanline about page
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
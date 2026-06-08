document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle ---
    const themeToggle = document.querySelector('.theme-toggle');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(savedTheme);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (document.body.classList.contains('light-theme')) {
                document.body.classList.remove('light-theme');
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
                document.body.classList.add('light-theme');
                localStorage.setItem('theme', 'light-theme');
            }
        });
    }

    // --- Page Transitions ---
    const internalLinks = document.querySelectorAll('a:not([target="_blank"]):not([href^="#"]):not([href^="mailto"])');
    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // Check if it's an internal link
            if (href && href !== '#' && !href.includes('http')) {
                e.preventDefault();
                document.body.classList.add('page-transition-out');
                setTimeout(() => {
                    window.location.href = href;
                }, 500);
            }
        });
    });

    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');
    const header = document.querySelector('header');

    // --- Mobile Navigation ---
    const toggleNav = () => {
        nav.classList.toggle('nav-active');
        
        // Animate Links
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });

        // Burger Animation
        burger.classList.toggle('toggle');
    };

    if (burger) {
        burger.addEventListener('click', toggleNav);
    }

    // --- Simple Contact Form Handler ---
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerText;
            
            btn.innerText = 'TRANSMITTING...';
            btn.disabled = true;

            // Simulate network delay
            setTimeout(() => {
                alert('Message received. Connection established.');
                contactForm.reset();
                btn.innerText = originalText;
                btn.disabled = false;
            }, 1500);
        });
    }

    // --- Header Scroll Effect ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'var(--header-bg-scroll)';
            header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        } else {
            header.style.background = 'var(--header-bg)';
            header.style.boxShadow = 'none';
        }
    });

    // --- Robotic Arm Inverse Kinematics ---
    class RobotArm {
        constructor() {
            this.svg = document.getElementById('robot-arm-svg');
            if (!this.svg) return;

            this.links = [
                document.getElementById('link1'),
                document.getElementById('link2'),
                document.getElementById('link3')
            ];
            this.joints = [
                document.getElementById('joint1'),
                document.getElementById('joint2'),
                document.getElementById('joint3')
            ];
            this.gripper = document.getElementById('gripper');

            // Arm Configuration (Base at 500, 950)
            this.base = { x: 500, y: 950 };
            this.lengths = [250, 250, 200]; // Lengths of links
            this.points = [
                { x: 500, y: 950 }, // Base
                { x: 500, y: 700 }, // Joint 1
                { x: 500, y: 450 }, // Joint 2
                { x: 500, y: 250 }  // End Effector
            ];

            this.target = { x: 500, y: 250 };
            this.mouse = { x: 500, y: 250 };
            this.isGrasping = false;
            
            this.init();
        }

        init() {
            window.addEventListener('mousemove', (e) => {
                const rect = this.svg.getBoundingClientRect();
                // Map mouse to SVG coordinate space (0-1000)
                this.mouse.x = ((e.clientX - rect.left) / rect.width) * 1000;
                this.mouse.y = ((e.clientY - rect.top) / rect.height) * 1000;
            });

            window.addEventListener('mousedown', () => {
                this.isGrasping = true;
                this.updateGripperVisual();
            });

            window.addEventListener('mouseup', () => {
                this.isGrasping = false;
                this.updateGripperVisual();
            });

            this.animate();
        }

        updateGripperVisual() {
            const leftFinger = this.gripper.querySelector('path:first-child');
            const rightFinger = this.gripper.querySelector('path:last-of-type');
            
            if (this.isGrasping) {
                leftFinger.setAttribute('d', 'M -15 0 L -8 20 L -2 25');
                rightFinger.setAttribute('d', 'M 15 0 L 8 20 L 2 25');
            } else {
                leftFinger.setAttribute('d', 'M -15 0 L -15 20 L -5 30');
                rightFinger.setAttribute('d', 'M 15 0 L 15 20 L 5 30');
            }
        }

        solveIK() {
            // Easing for smooth target following
            this.target.x += (this.mouse.x - this.target.x) * 0.1;
            this.target.y += (this.mouse.y - this.target.y) * 0.1;

            const maxLen = this.lengths.reduce((a, b) => a + b, 0);
            const distToBase = Math.hypot(this.target.x - this.base.x, this.target.y - this.base.y);

            // Constraint: Don't exceed maximum reach
            let solveTarget = { ...this.target };
            if (distToBase > maxLen) {
                const angle = Math.atan2(this.target.y - this.base.y, this.target.x - this.base.x);
                solveTarget.x = this.base.x + Math.cos(angle) * maxLen;
                solveTarget.y = this.base.y + Math.sin(angle) * maxLen;
            }

            // FABRIK Algorithm (Forward And Backward Reaching Inverse Kinematics)
            for (let iter = 0; iter < 5; iter++) {
                // Backward Reach
                this.points[3] = { ...solveTarget };
                for (let i = 2; i >= 0; i--) {
                    const dist = Math.hypot(this.points[i+1].x - this.points[i].x, this.points[i+1].y - this.points[i].y);
                    const ratio = this.lengths[i] / dist;
                    this.points[i].x = this.points[i+1].x + (this.points[i].x - this.points[i+1].x) * ratio;
                    this.points[i].y = this.points[i+1].y + (this.points[i].y - this.points[i+1].y) * ratio;
                }

                // Forward Reach
                this.points[0] = { ...this.base };
                for (let i = 0; i < 3; i++) {
                    const dist = Math.hypot(this.points[i+1].x - this.points[i].x, this.points[i+1].y - this.points[i].y);
                    const ratio = this.lengths[i] / dist;
                    this.points[i+1].x = this.points[i].x + (this.points[i+1].x - this.points[i].x) * ratio;
                    this.points[i+1].y = this.points[i].y + (this.points[i+1].y - this.points[i].y) * ratio;
                }
            }
        }

        updateDOM() {
            // Update Lines
            for (let i = 0; i < 3; i++) {
                this.links[i].setAttribute('x1', this.points[i].x);
                this.links[i].setAttribute('y1', this.points[i].y);
                this.links[i].setAttribute('x2', this.points[i+1].x);
                this.links[i].setAttribute('y2', this.points[i+1].y);
            }

            // Update Joints
            for (let i = 0; i < 3; i++) {
                this.joints[i].setAttribute('cx', this.points[i].x);
                this.joints[i].setAttribute('cy', this.points[i].y);
            }

            // Update Gripper
            const lastJoint = this.points[2];
            const endEffector = this.points[3];
            const angle = Math.atan2(endEffector.y - lastJoint.y, endEffector.x - lastJoint.x) * (180 / Math.PI) - 90;
            
            this.gripper.setAttribute('transform', `translate(${endEffector.x}, ${endEffector.y}) rotate(${angle})`);
        }

        animate() {
            this.solveIK();
            this.updateDOM();
            requestAnimationFrame(() => this.animate());
        }
    }

    // Initialize the arm
    new RobotArm();
});

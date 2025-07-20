// Custom cursor
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    
    setTimeout(() => {
        cursorFollower.style.left = e.clientX + 'px';
        cursorFollower.style.top = e.clientY + 'px';
    }, 100);
});

// Add hover effect to interactive elements
const interactiveElements = document.querySelectorAll('a, button, .cyber-card, .countdown-block');
interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(1.5)';
        cursorFollower.style.transform = 'scale(1.5)';
    });
    
    el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
        cursorFollower.style.transform = 'scale(1)';
    });
});

// Countdown Timer
const launchDate = new Date('2025-08-18T00:00:00').getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = launchDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    updateCountdownValue('days', days);
    updateCountdownValue('hours', hours);
    updateCountdownValue('minutes', minutes);
    updateCountdownValue('seconds', seconds);

    if (distance < 0) {
        clearInterval(countdownInterval);
        document.querySelectorAll('.countdown-number').forEach(el => {
            el.textContent = '00';
        });
    }
}

function updateCountdownValue(id, value) {
    const element = document.getElementById(id);
    const currentValue = parseInt(element.textContent);
    const newValue = String(value).padStart(2, '0');
    
    if (currentValue !== value) {
        // Add pulse animation
        element.classList.add('pulse');
        
        // Update the value
        element.textContent = newValue;
        
        // Remove pulse animation after it completes
        setTimeout(() => {
            element.classList.remove('pulse');
        }, 1000);
    }
}

// Update countdown every second
const countdownInterval = setInterval(updateCountdown, 1000);

// Initial countdown update
updateCountdown();

// Profile Card Interactions
const profileCards = document.querySelectorAll('.profile-card');
let activeCard = 0;

function rotateCards() {
    profileCards.forEach((card, index) => {
        if (index === activeCard) {
            card.style.transform = 'rotate(0) translateX(0) scale(1.05)';
            card.style.zIndex = '2';
        } else {
            card.style.transform = `rotate(${index === 0 ? -5 : 5}deg) translateX(${index === 0 ? -20 : 20}px)`;
            card.style.zIndex = '1';
        }
    });
    
    activeCard = (activeCard + 1) % profileCards.length;
}

// Rotate cards every 3 seconds
setInterval(rotateCards, 3000);

// Enhanced Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Add fade-in class to the element
            entry.target.classList.add('fade-in');
            
            // Handle section-specific animations
            if (entry.target.classList.contains('features')) {
                // Trigger feature cards animation with delay
                const cards = entry.target.querySelectorAll('.feature-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('fade-in');
                    }, index * 200);
                });
            }
            
            if (entry.target.classList.contains('about-content')) {
                // Trigger about section animations
                const text = entry.target.querySelector('.about-text');
                const stats = entry.target.querySelector('.stats-grid');
                
                if (text) text.classList.add('fade-in');
                if (stats) {
                    setTimeout(() => {
                        stats.classList.add('fade-in');
                        // Animate stat numbers
                        animateStatNumbers();
                    }, 500);
                }
            }
            
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Animate stat numbers
function animateStatNumbers() {
    const stats = document.querySelectorAll('.stat-number');
    const labels = document.querySelectorAll('.stat-label');
    
    stats.forEach((stat, index) => {
        const targetNumber = parseInt(stat.textContent);
        let currentNumber = 0;
        const duration = 2000; // 2 seconds
        const increment = targetNumber / (duration / 16); // 60fps
        
        // Add animation class
        stat.classList.add('animate');
        labels[index].classList.add('animate');

        function updateNumber() {
            if (currentNumber < targetNumber) {
                currentNumber = Math.min(currentNumber + increment, targetNumber);
                stat.textContent = Math.round(currentNumber);
                requestAnimationFrame(updateNumber);
            } else {
                // Animation complete, add the plus sign
                stat.style.position = 'relative';
            }
        }

        setTimeout(() => updateNumber(), 300); // Small delay for better visual effect
    });
}

// Observe sections for animations
document.querySelectorAll('.section-title, .features, .about-content, .testimonial-card').forEach(el => {
    observer.observe(el);
});

// Add hover effect to feature cards
const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.querySelector('.feature-icon').style.transform = 'scale(1.2)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.querySelector('.feature-icon').style.transform = 'scale(1)';
    });
});

// Enhanced floating hearts animation
function createHeart() {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.innerHTML = '❤️';
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.animationDuration = Math.random() * 3 + 2 + 's';
    heart.style.opacity = Math.random() * 0.5 + 0.3;
    heart.style.transform = `scale(${Math.random() * 0.5 + 0.5})`;
    document.querySelector('.floating-hearts').appendChild(heart);
    
    // Remove heart after animation
    setTimeout(() => {
        heart.remove();
    }, 5000);
}

// Create new hearts periodically
setInterval(createHeart, 2000);

// Form submission with enhanced validation and animation
document.getElementById('join-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = this;
    const email = this.querySelector('input[type="email"]').value;
    const button = this.querySelector('button');
    const originalButtonText = button.innerHTML;
    
    // Validate Amity email
    if (!email.toLowerCase().includes('amity.edu')) {
        // Show error animation
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
        
        const input = form.querySelector('input');
        input.style.borderColor = '#ff4b4b';
        input.placeholder = 'Please use your Amity email';
        input.value = '';
        return;
    }
    
    // Success animation
    button.innerHTML = '<i class="fas fa-heart"></i> Profile Created!';
    button.style.backgroundColor = '#4CAF50';
    
    // Create success hearts burst effect
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'success-heart';
            heart.innerHTML = '❤️';
            heart.style.left = '50%';
            heart.style.top = '50%';
            heart.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
            form.appendChild(heart);
            
            setTimeout(() => heart.remove(), 1000);
        }, i * 100);
    }
    
    // Reset form after delay
    setTimeout(() => {
        button.innerHTML = originalButtonText;
        button.style.backgroundColor = '';
        form.reset();
    }, 3000);
});

// Add all CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    .shake {
        animation: shake 0.5s ease-in-out;
    }
    
    .floating-heart {
        position: fixed;
        font-size: 20px;
        pointer-events: none;
        animation: float-up 5s linear forwards;
    }
    
    @keyframes float-up {
        0% { transform: translateY(100vh) scale(0); }
        50% { transform: translateY(50vh) scale(1); }
        100% { transform: translateY(-100px) scale(0); }
    }
    
    .fade-in {
        opacity: 0;
        animation: fadeIn 1s ease forwards;
    }
    
    .slide-up {
        transform: translateY(50px);
        animation: slideUp 1s ease forwards;
    }
    
    .scale-in {
        transform: scale(0.8);
        animation: scaleIn 1s ease forwards;
    }
    
    .fade-slide {
        opacity: 0;
        transform: translateX(-50px);
        animation: fadeSlide 1s ease forwards;
    }
    
    @keyframes fadeIn {
        to { opacity: 1; }
    }
    
    @keyframes slideUp {
        to { transform: translateY(0); }
    }
    
    @keyframes scaleIn {
        to { transform: scale(1); }
    }
    
    @keyframes fadeSlide {
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .success-heart {
        position: absolute;
        font-size: 20px;
        pointer-events: none;
        animation: success-heart 1s ease-out forwards;
    }
    
    @keyframes success-heart {
        0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(2) rotate(360deg);
            opacity: 0;
        }
    }
`;

document.head.appendChild(style);

// Add parallax effect to cyber-sphere
document.addEventListener('mousemove', (e) => {
    const sphere = document.querySelector('.cyber-sphere');
    if (sphere) {
        const x = (window.innerWidth - e.pageX) / 100;
        const y = (window.innerHeight - e.pageY) / 100;
        sphere.style.transform = `translateX(${x}px) translateY(${y}px) rotate(${x * y}deg)`;
    }
}); 
// Fallback cookie implementation if js-cookie library fails to load
if (typeof Cookies === 'undefined') {
    console.warn('⚠️ js-cookie library not loaded, using fallback cookie implementation');
    window.Cookies = {
        get: function(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return undefined;
        },
        set: function(name, value, options) {
            let cookie = `${name}=${value}`;
            if (options && options.expires) {
                cookie += `; expires=${options.expires.toUTCString()}`;
            }
            cookie += '; path=/';
            document.cookie = cookie;
        },
        remove: function(name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
    };
}

// Disclaimer Popup Management
class DisclaimerPopup {
    constructor() {
        this.popup = document.getElementById('disclaimer-popup');
        this.closeBtn = document.getElementById('close-disclaimer');
        this.init();
    }

    init() {
        // Add event listeners
        this.closeBtn.addEventListener('click', () => this.closePopup());
        
        // Close popup when clicking outside
        this.popup.addEventListener('click', (e) => {
            if (e.target === this.popup) {
                this.closePopup();
            }
        });

        // Close popup with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popup.classList.contains('show')) {
                this.closePopup();
            }
        });
    }

    showPopup() {
        this.popup.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        console.log('🎯 Disclaimer popup is now visible');
    }

    closePopup() {
        this.popup.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
        
        // Set cookie to remember this was shown (expires in 30 days)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        Cookies.set('disclaimer_shown', 'true', { expires: expiryDate });
        console.log('✅ Disclaimer popup closed and cookie set for 30 days');
    }

    // Check if popup should be shown
    shouldShowPopup() {
        return !Cookies.get('disclaimer_shown');
    }

    // Force show popup (for button trigger)
    forceShow() {
        this.showPopup();
    }

    // Check cookie status
    checkCookieStatus() {
        const hasShown = Cookies.get('disclaimer_shown');
        if (hasShown) {
            console.log('🍪 Cookie found: Popup has been shown recently (will not auto-show)');
            return true;
        } else {
            console.log('🍪 No cookie found: Popup will auto-show');
            return false;
        }
    }

    // Clear cookie (for testing)
    clearCookie() {
        Cookies.remove('disclaimer_shown');
        console.log('🗑️ Cookie cleared! Popup will show again on next page load');
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.disclaimerPopup = new DisclaimerPopup();
    
    // Log instructions
    console.log('🚀 Disclaimer Popup System Loaded!');
    console.log('📋 Available functions:');
    console.log('   • showDisclaimerPopup() - Force show the popup');
    console.log('   • disclaimerPopup.checkCookieStatus() - Check if cookie exists');
    console.log('   • disclaimerPopup.clearCookie() - Clear cookie for testing');
    console.log('   • disclaimerPopup.forceShow() - Alternative way to show popup');
    
    // Check cookie status
    const hasShown = window.disclaimerPopup.checkCookieStatus();
    
    // Auto-show popup if it hasn't been shown recently
    if (window.disclaimerPopup.shouldShowPopup()) {
        console.log('⏰ Auto-showing popup in 1 second...');
        setTimeout(() => {
            window.disclaimerPopup.showPopup();
        }, 1000);
    } else {
        console.log('⏰ Popup will not auto-show (cookie exists)');
    }
});

// Global function to show popup from external scripts
window.showDisclaimerPopup = function() {
    if (window.disclaimerPopup) {
        console.log('🎯 Manually triggering disclaimer popup...');
        window.disclaimerPopup.forceShow();
    } else {
        console.error('❌ Disclaimer popup not initialized yet');
    }
};

// Additional helper functions
window.checkDisclaimerCookie = function() {
    if (window.disclaimerPopup) {
        return window.disclaimerPopup.checkCookieStatus();
    } else {
        console.error('❌ Disclaimer popup not initialized yet');
        return null;
    }
};

window.clearDisclaimerCookie = function() {
    if (window.disclaimerPopup) {
        window.disclaimerPopup.clearCookie();
    } else {
        console.error('❌ Disclaimer popup not initialized yet');
    }
};

/*function initCarouselAutoplay(selector) {
  const track = document.querySelector(selector);
  if (!track) return;

  const cards = track.querySelectorAll(".carousel-card");
  let current = 0;

  function update() {
    cards.forEach((card, i) => {
      card.style.transform = `translateX(${(i - current) * 220}px)`;
      card.style.opacity = i === current ? "1" : "0";
      card.classList.toggle("shrinking", i !== current);
    });
  }

  function next() {
    current = (current + 1) % cards.length;
    update();
  }

  update(); // initial render
  setInterval(next, 3000);
}*/

fetch('/games.json')
    .then(response => response.json())
    .then(games => {
        const allGames = document.getElementById('all-games');
        const hotGames = document.querySelector('#hot-games');
        for (const game of games){
            const category = game.category
            const categoryArea = document.querySelector(`#${category.toLowerCase}`);
            const categoryHtml = `
                <div class="carousel-card"><a href="${game.path}"
                    <img src="${game.image}" alt="${game.name} image" title="${game.name}"></a>
                </div>`;
            const allGamesHtml = `
                <div class="game-card"><a href="${game.path}">
                    <img src="${game.image}" alt="${game.name} image">
                    <h4 class="game-name">${game.name}</h4>
                    <p class="game-creator">${game.creator}</p></a>
                </div>`;

            allGames.insertAdjacentHTML('beforeend', allGamesHtml);
            category.insertAdjacentHTML('beforeend', categoryHtml);
            if (game.hot) {
                hotGames.insertAdjacentHTML('beforeend', categoryHtml);
            };
        }
    })
    .catch(error => {
        console.error('Error loading games:', error);
        const gameContainer = document.querySelector('#all-games');
        gameContainer.innerHTML = '<p>Error loading games. Please try again later.</p>';
    })


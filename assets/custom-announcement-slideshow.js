class AnnouncementSlideshow {
  constructor() {
    this.announcementBar = document.querySelector('.announcement-bar');
    if (!this.announcementBar) return;
    
    this.announcements = Array.from(this.announcementBar.querySelectorAll('.announcement-bar__announcement'));
    if (this.announcements.length <= 1) return;
    
    this.currentIndex = 0;
    this.isTabletOrBelow = window.innerWidth <= 989;
    this.autoRotateInterval = null;
    
    // Get auto-rotate settings from data attributes
    const section = this.announcementBar.closest('.utility-bar');
    this.autoRotate = section?.dataset.autoRotate === 'true';
    this.rotateSpeed = parseInt(section?.dataset.rotateSpeed || '5') * 1000;
    
    this.init();
    this.handleResize();
  }
  
  init() {
    if (this.isTabletOrBelow) {
      this.setupSlideshow();
    }
  }
  
  setupSlideshow() {
    // Create wrapper for slideshow
    const slideshowWrapper = document.createElement('div');
    slideshowWrapper.className = 'announcement-slideshow';
    
    // Create slides container
    const slidesContainer = document.createElement('div');
    slidesContainer.className = 'announcement-slideshow__slides';
    
    // Create navigation buttons
    const prevButton = this.createNavButton('prev', '‹');
    const nextButton = this.createNavButton('next', '›');
    
    // Move announcements to slides container
    this.announcements.forEach((announcement, index) => {
      const slide = document.createElement('div');
      slide.className = 'announcement-slideshow__slide';
      
      // Clone the announcement content
      const content = announcement.cloneNode(true);
      slide.appendChild(content);
      slidesContainer.appendChild(slide);
    });
    
    // Hide original announcements container
    const originalContainer = this.announcementBar.querySelector('.announcement-bar__announcements');
    if (originalContainer) {
      originalContainer.style.display = 'none';
    }
    
    // Assemble slideshow
    slideshowWrapper.appendChild(prevButton);
    slideshowWrapper.appendChild(slidesContainer);
    slideshowWrapper.appendChild(nextButton);
    
    // Add to announcement bar
    this.announcementBar.appendChild(slideshowWrapper);
    
    // Store references
    this.slideshowWrapper = slideshowWrapper;
    this.slides = Array.from(slidesContainer.querySelectorAll('.announcement-slideshow__slide'));
    
    // Add event listeners
    prevButton.addEventListener('click', () => {
      this.previousSlide();
      this.pauseAutoRotate();
    });
    nextButton.addEventListener('click', () => {
      this.nextSlide();
      this.pauseAutoRotate();
    });
    
    // Add touch support
    this.addTouchSupport(slidesContainer);
    
    // Show the first slide
    if (this.slides.length > 0) {
      this.slides[0].classList.add('announcement-slideshow__slide--active');
    }
    
    // Start auto-rotate if enabled
    if (this.autoRotate && this.slides.length > 1) {
      this.startAutoRotate();
    }
  }
  
  createNavButton(direction, symbol) {
    const button = document.createElement('button');
    button.className = `announcement-slideshow__nav announcement-slideshow__nav--${direction}`;
    button.setAttribute('aria-label', direction === 'prev' ? 'Previous announcement' : 'Next announcement');
    button.innerHTML = `<span>${symbol}</span>`;
    return button;
  }
  
  showSlide(index, direction = 'next') {
    const previousIndex = this.currentIndex;
    
    this.slides.forEach((slide, i) => {
      slide.classList.remove('announcement-slideshow__slide--active', 'announcement-slideshow__slide--prev', 'announcement-slideshow__slide--next');
      
      if (i === index) {
        // This is the incoming slide
        slide.classList.add('announcement-slideshow__slide--active');
        slide.classList.add(direction === 'next' ? 'announcement-slideshow__slide--next' : 'announcement-slideshow__slide--prev');
        
        // Force reflow to ensure the positioning class is applied before removing it
        slide.offsetHeight;
        
        // Remove the directional class after a brief delay to trigger the transition
        setTimeout(() => {
          slide.classList.remove('announcement-slideshow__slide--next', 'announcement-slideshow__slide--prev');
        }, 10);
      } else if (i === previousIndex) {
        // This is the outgoing slide
        slide.classList.add(direction === 'next' ? 'announcement-slideshow__slide--prev' : 'announcement-slideshow__slide--next');
      }
    });
  }
  
  nextSlide() {
    const previousIndex = this.currentIndex;
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
    this.showSlide(this.currentIndex, 'next');
  }
  
  previousSlide() {
    const previousIndex = this.currentIndex;
    this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.showSlide(this.currentIndex, 'prev');
  }
  
  addTouchSupport(container) {
    let touchStartX = 0;
    let touchEndX = 0;
    
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
    });
  }
  
  handleSwipe(startX, endX) {
    const swipeThreshold = 50;
    const diff = startX - endX;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.previousSlide();
      }
      this.pauseAutoRotate();
    }
  }
  
  startAutoRotate() {
    if (this.autoRotateInterval) return;
    
    this.autoRotateInterval = setInterval(() => {
      this.nextSlide();
    }, this.rotateSpeed);
  }
  
  pauseAutoRotate() {
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
      this.autoRotateInterval = null;
      
      // Restart after a delay
      setTimeout(() => {
        if (this.autoRotate && this.isTabletOrBelow) {
          this.startAutoRotate();
        }
      }, this.rotateSpeed * 2);
    }
  }
  
  handleResize() {
    window.addEventListener('resize', () => {
      const wasTabletOrBelow = this.isTabletOrBelow;
      this.isTabletOrBelow = window.innerWidth <= 989;
      
      if (wasTabletOrBelow !== this.isTabletOrBelow) {
        if (this.isTabletOrBelow) {
          // Switch to slideshow
          if (this.slideshowWrapper) {
            this.slideshowWrapper.style.display = 'flex';
          } else {
            this.setupSlideshow();
          }
          const originalContainer = this.announcementBar.querySelector('.announcement-bar__announcements');
          if (originalContainer) originalContainer.style.display = 'none';
          
          // Start auto-rotate if enabled
          if (this.autoRotate && this.slides && this.slides.length > 1) {
            this.startAutoRotate();
          }
        } else {
          // Switch back to normal view
          if (this.slideshowWrapper) {
            this.slideshowWrapper.style.display = 'none';
          }
          const originalContainer = this.announcementBar.querySelector('.announcement-bar__announcements');
          if (originalContainer) originalContainer.style.display = 'flex';
          
          // Stop auto-rotate
          if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
          }
        }
      }
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AnnouncementSlideshow();
}); 
class ActivityTracker {
  constructor() {
    this.STORAGE_KEY = 'activity-tracker-data';
    this.SESSION_TIMEOUT = 60 * 60 * 1000;
    
    this.initializeSession();
    this.renderWidget();
    this.trackPageView();
    this.setupEventListeners();
    this.startDurationTimer();
  }

  initializeSession() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const now = Date.now();

    if (stored) {
      try {
        const data = JSON.parse(stored);
        const lastActivity = data.events.length > 0 
          ? Math.max(...data.events.map(e => e.time))
          : data.startedAt;
        
        if (now - lastActivity < this.SESSION_TIMEOUT) {
          this.sessionData = data;
          return;
        }
      } catch (e) {
        console.error('Error loading session:', e);
      }
    }

    this.sessionData = {
      sessionId: this.generateSessionId(),
      startedAt: now,
      events: []
    };
    this.saveToStorage();
  }

  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    return `session_${timestamp}_${random}`;
  }

  saveToStorage() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sessionData));
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  getSessionDuration() {
    const now = Date.now();
    const duration = Math.floor((now - this.sessionData.startedAt) / 60000);
    return duration;
  }

  trackPageView() {
    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    
    const event = {
      type: 'pageview',
      page: pageName,
      time: Date.now(),
      details: `Visited: ${pageName}`
    };

    this.sessionData.events.push(event);
    this.saveToStorage();
    this.updateWidget();
  }

  trackInteraction(details) {
    const event = {
      type: 'interaction',
      details: details,
      time: Date.now()
    };

    this.sessionData.events.push(event);
    this.saveToStorage();
    this.updateWidget();
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-primary')) {
        this.trackInteraction('Clicked link: Shop Now');
      }
      if (e.target.classList.contains('activity-tracker-button')) {
        this.toggleTimeline();
      }
    }, true);

    document.addEventListener('submit', (e) => {
      this.trackInteraction('Form submitted');
    }, true);
  }

  toggleTimeline() {
    const timeline = document.querySelector('.activity-tracker-timeline');
    if (timeline) {
      timeline.classList.toggle('expanded');
    }
  }

  startDurationTimer() {
    setInterval(() => {
      const durationElement = document.querySelector('.stat-value');
      if (durationElement) {
        durationElement.textContent = `${this.getSessionDuration()} min`;
      }
    }, 1000);
  }

  getStatistics() {
    const stats = {
      duration: this.getSessionDuration(),
      pagesViewed: this.sessionData.events.filter(e => e.type === 'pageview').length,
      totalClicks: this.sessionData.events.filter(e => 
        e.type === 'interaction' && e.details.includes('Clicked')
      ).length,
      formsSubmitted: this.sessionData.events.filter(e => 
        e.type === 'interaction' && e.details.includes('Form')
      ).length
    };
    return stats;
  }

  renderWidget() {
    const widgetHTML = `
      <div class="activity-tracker-widget">
        <button class="activity-tracker-button" aria-label="Open activity timeline">
          🕒
        </button>
        <aside class="activity-tracker-timeline">
          ${this.renderHeader()}
          ${this.renderStats()}
          ${this.renderTimeline()}
        </aside>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
  }

  renderHeader() {
    return `
      <header class="timeline-header">
        <h3>Activity Timeline</h3>
        <div>
          <div>Session ID: ${this.sessionData.sessionId}</div>
          <div>Started: ${this.formatTime(this.sessionData.startedAt)}</div>
        </div>
      </header>
    `;
  }

  renderStats() {
    const stats = this.getStatistics();
    
    return `
      <section class="session-stats">
        <div class="stat">
          <div class="stat-label">Session Duration</div>
          <div class="stat-value">${stats.duration} min</div>
        </div>
        <div class="stat">
          <div class="stat-label">Pages Viewed</div>
          <div class="stat-value">${stats.pagesViewed}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Total Clicks</div>
          <div class="stat-value">${stats.totalClicks}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Forms Submitted</div>
          <div class="stat-value">${stats.formsSubmitted}</div>
        </div>
      </section>
    `;
  }

  renderTimeline() {
    const timelineItems = this.sessionData.events
      .map(event => this.renderTimelineItem(event))
      .join('');

    return `
      <div class="timeline-content">
        <div class="timeline-wrapper">
          ${timelineItems}
        </div>
      </div>
    `;
  }

  renderTimelineItem(event) {
    const eventClass = event.type === 'pageview' ? 'pageview' : 'interaction';
    const eventTitle = event.type === 'pageview' ? 'Page View' : 'Interaction';

    return `
      <div class="timeline-item ${eventClass}">
        <div class="time">${this.formatTime(event.time)}</div>
        <div class="event-title">${eventTitle}</div>
        <div class="event-details">${event.details}</div>
      </div>
    `;
  }

  updateWidget() {
    const statsSection = document.querySelector('.session-stats');
    if (statsSection) {
      statsSection.innerHTML = this.renderStats().match(/<section class="session-stats">([\s\S]*)<\/section>/)[1];
    }

    const timelineWrapper = document.querySelector('.timeline-wrapper');
    if (timelineWrapper) {
      const timelineItems = this.sessionData.events
        .map(event => this.renderTimelineItem(event))
        .join('');
      timelineWrapper.innerHTML = timelineItems;
    }
  }
}

// Export the class (KEEP THIS - needed for tests!)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityTracker;
} else {
    window.ActivityTracker = ActivityTracker;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ActivityTracker();
});
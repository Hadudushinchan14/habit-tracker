const State = {

    profile: {
        id: null,
        identity: null
    },

    actions: [],

    identities: [],

    currentIdentityId: null,

    history: [],

    reflections: [],

    notes: [],

    completedLessons: [],

    lessonProgress: [],

    editingActionId: null,

    // Timezone support
    userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    // Loading states
    loading: {
        actions: false,
        history: false,
        identities: false,
        reflections: false,
        lessonProgress: false,
        profile: false
    },

    // Error states
    errors: {},

    // UI state
    ui: {
        currentPage: 'today',
        activeSheet: null,
        activeModal: null
    }

};

window.State = State;

const Helpers = {

    greeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    },

    quote() {
        const quotes = [
            "Every action is a vote for the person you want to become.",
            "You do not rise to your goals. You fall to your systems.",
            "Small habits create remarkable results.",
            "Your identity is built one action at a time."
        ];
        // Use day of year for consistent daily quote
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        return quotes[dayOfYear % quotes.length];
    },

    // Timezone-aware date utilities
    todayISO() {
        const now = new Date();
        const tz = State.userTimezone || 'UTC';
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(now);
        const year = parts.find(p => p.type === 'year').value;
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;
        return `${year}-${month}-${day}`;
    },

    formatDate(date, options = {}) {
        const tz = State.userTimezone || 'UTC';
        return new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            year: 'numeric',
            month: options.month || 'short',
            day: options.day || 'numeric',
            weekday: options.weekday || undefined
        }).format(date);
    },

    parseISODate(isoString) {
        // Parse YYYY-MM-DD as local date (not UTC)
        const [year, month, day] = isoString.split('-').map(Number);
        return new Date(year, month - 1, day);
    },

    isToday(dateISO) {
        return dateISO === this.todayISO();
    },

    isPast(dateISO) {
        return dateISO < this.todayISO();
    },

    isFuture(dateISO) {
        return dateISO > this.todayISO();
    },

    // Sanitization for XSS prevention
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    escapeAttr(text) {
        if (!text) return '';
        return text.replace(/"/g, '"').replace(/'/g, "'");
    }

};

const Calendar = {

    isCompleted(date) {
        return State.history.some(h => h.date === date);
    }

};

window.Helpers = Helpers;
window.Calendar = Calendar;

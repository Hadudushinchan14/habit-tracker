const State = {
    profile: { id: null, identity: null, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    actions: [], identities: [], currentIdentityId: null, history: [],
    reflections: [], notes: [], completedLessons: [], lessonProgress: [],
    editingActionId: null,
    userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    loading: { actions: false, history: false, identities: false, reflections: false, lessonProgress: false, profile: false },
    errors: {},
    ui: { currentPage: 'today', activeSheet: null, activeModal: null }
};
window.State = State;

const Helpers = {
    greeting() {
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: State.userTimezone || 'UTC', hour: 'numeric', hour12: false }).formatToParts(new Date());
        const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    },
    quote() {
        const quotes = ["Every action is a vote for the person you want to become.", "You do not rise to your goals. You fall to your systems.", "Small habits create remarkable results.", "Your identity is built one action at a time."];
        const tz = State.userTimezone || 'UTC';
        const now = new Date();
        const yearStart = new Date(new Intl.DateTimeFormat('en-CA', {timeZone: tz, year: 'numeric'}).format(now));
        const diff = Math.floor((now - yearStart) / 86400000);
        return quotes[diff % quotes.length];
    },
    todayISO() {
        const now = new Date();
        const tz = State.userTimezone || 'UTC';
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
        const year = parts.find(p => p.type === 'year').value;
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;
        return `${year}-${month}-${day}`;
    },
    dateToISO(d) {
        const tz = State.userTimezone || 'UTC';
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
        const year = parts.find(p => p.type === 'year').value;
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;
        return `${year}-${month}-${day}`;
    },
    addDays(isoString, delta) {
        const tz = State.userTimezone || 'UTC';
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(isoString + 'T00:00:00'));
        const year = parseInt(parts.find(p => p.type === 'year').value);
        const month = parseInt(parts.find(p => p.type === 'month').value);
        const day = parseInt(parts.find(p => p.type === 'day').value);
        const d = new Date(year, month - 1, day + delta);
        return this.dateToISO(d);
    },
    isToday(dateISO) { return dateISO === this.todayISO(); },
    isYesterday(dateISO) { return dateISO === this.addDays(this.todayISO(), -1); },
    isPast(dateISO) { return dateISO < this.todayISO(); },
    isFuture(dateISO) { return dateISO > this.todayISO(); },
    formatDate(date, options = {}) {
        const tz = State.userTimezone || 'UTC';
        return new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: options.month || 'short', day: options.day || 'numeric', weekday: options.weekday || undefined }).format(date);
    },
    parseISODate(isoString) {
        const [year, month, day] = isoString.split('-').map(Number);
        return new Date(year, month - 1, day);
    },
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    escapeAttr(text) {
        if (!text) return '';
        return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
};

const Calendar = {
    isCompleted(date) {
        return State.history.some(h => h.date === date);
    }
};

window.Helpers = Helpers;
window.Calendar = Calendar;

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

     editingActionId: null

};

    window.State = State;

const Helpers = {

    greeting() {

        const hour = new Date().getHours();

        if (hour < 12) return "Good Morning ☀️";
        if (hour < 18) return "Good Afternoon 🌤️";

        return "Good Evening 🌙";

    },

    quote() {

        const quotes = [

            "Every action is a vote for the person you want to become.",

            "You do not rise to your goals. You fall to your systems.",

            "Small habits create remarkable results.",

            "Your identity is built one action at a time."

        ];

        return quotes[
            new Date().getDate() % quotes.length
        ];

    }

};

const Calendar = {

    isCompleted(date) {

        return State.history.some(
            h => h.date === date
        );

    }

};
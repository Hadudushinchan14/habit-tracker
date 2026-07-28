const Storage = {

    load() {

        return JSON.parse(
            localStorage.getItem("identityOS")
        );

    },

    save(data) {

        localStorage.setItem(
            "identityOS",
            JSON.stringify(data)
        );

    }

};

let savedState = Storage.load();

const State = savedState || {

    profile:{
        identity:null
    },

    actions:[
        {
            id:1,
            title:"Drink Water",
            subtitle:"Stay hydrated.",
            completed:false
        },

        {
            id:2,
            title:"Walk 20 Minutes",
            subtitle:"Movement builds momentum.",
            completed:false
        }
    ],

    reflections:[],

    history:[]

};


State.reflections ??= [];
State.history ??= [];

const Helpers = {

    greeting() {

        const hour = new Date().getHours();

        if (hour < 12) {

            return "Good Morning ☀️";

        }

        if (hour < 18) {

            return "Good Afternoon 🌤️";

        }

        return "Good Evening 🌙";

    },


    quote() {

        const quotes = [

            "Every action is a vote for the person you want to become.",

            "You do not rise to your goals. You fall to your systems.",

            "Small habits create remarkable results.",

            "Your identity is built one action at a time."

        ];


        const index = new Date().getDate()
            % quotes.length;


        return quotes[index];

    },


};

const Calendar = {

    isCompleted(date) {

        return State.history.some(
            h => h.date === date
        );

    }

};
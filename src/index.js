// 1. Text strings =====================================================================================================
//    Modify these strings and messages to change the behavior of your Lambda function

var languageStrings = {
    'en': {
        'translation': {
            'WELCOME' : "Welcome to Lynnfield Guide!",
            'HELP'    : "Say about, to hear more about the city, or say coffee, breakfast, lunch, or dinner, to hear local restaurant suggestions, or say recommend an attraction, or say, go outside. ",
            'ABOUT'   : "Lynnfield Massachusetts is a small town twenty minutes north of boston.",
            'STOP'    : "Okay, see you next time!"
        }
    }
    // , 'de-DE': { 'translation' : { 'TITLE'   : "Local Helfer etc." } }
};
var data = {
    "city"        : "Lynnfield",
    "state"       : "MA",
    "postcode"    : "01940",
    "restaurants" : [
        { "name":"Temazcal Tequila Cantina",
            "address":"500 Market St", "phone": "781-334-2500",
            "meals": "lunch, dinner",
            "description": "Elegantly chic restaurant offering elevated Mexican cuisine along with margaritas & 250+ tequilas."
        },
        { "name":"The Grove Boutique & Cafe",
            "address":"525 Market St", "phone": "781-334-5007",
            "meals": "coffee, breakfast",
            "description": "A small boutique coffee shop offering a quick bite and friendly service."
        },
        { "name":"Wahlburgers",
            "address":"600 Market St", "phone": "781-334-2560",
            "meals": "lunch, dinner",
            "description": "This counter-serve patty place from Mark Wahlberg & brothers offers big burgers & spiked milkshakes."
        },
        { "name":"Otto's Pizza",
            "address":"1210 Market St", "phone": "781-872-6991",
            "meals": "lunch, dinner",
            "description": "Local pizza chain specializing in thin-crust, gourmet pies; takeout & delivery available."
        },
        { "name":"Davio's Northern Italian Steakhouse",
            "address":"1250 Market St", "phone": "781-944-4810",
            "meals": "lunch, dinner",
            "description": "High-end Italian steakhouse with handmade pasta & prime beef, plus a fireplace & patio."
        },
        { "name":"Fat Biscuit Southern Table And Taps",
            "address":"335 Market St,", "phone": "781-342-5283",
            "meals": "coffee, breakfast, lunch, dinner",
            "description": "Twists on Southern dining staples, all-day breakfast & local beers in a modern setting."
        },

    ],
    "attractions":[
        {
            "name": "Partridge Island Trail",
            "description": "Lynnfield has a nature preserve that you can hike through!",
            "distance": "0"
        },
        {
            "name": "Lynnfield Common Park",
            "description": "Nothing beats having a relaxing chill session in this park",
            "distance": "0"
        },
        {
            "name": "Breakheart Reservation",
            "description": "This forest with hiking trails, lakes & a river offers activities such as fishing & swimming.",
            "distance": "7"
        },
        {
            "name": "Fenway Park",
            "description": "Home of the Boston Red Sox, Fenway park hosts baseball games From April until October, and is open for tours. ",
            "distance": "24"
        },
        {
            "name": "Market Street",
            "description": "A place to eat, drink, shop and hangout for the day!",
            "distance": "2"
        }
    ]
};

// Weather courtesy of the Yahoo Weather API.
// This free API recommends no more than 2000 calls per day

var myAPI = {
    host: 'query.yahooapis.com',
    port: 443,
    path: `/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22${encodeURIComponent(data.city)}%2C%20${data.state}%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`,
    method: 'GET'
};
// 2. Skill Code =======================================================================================================

var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);

    // alexa.appId = 'amzn1.echo-sdk-ams.app.1234';
    ///alexa.dynamoDBTableName = 'YourTableName'; // creates new table for session.attributes
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        var say = this.t('WELCOME') + ' ' + this.t('HELP');
        this.emit(':ask', say, say);
    },

    'AboutIntent': function () {
        this.emit(':tell', this.t('ABOUT'));
    },

    'CoffeeIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('coffee'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'For a great coffee shop, I recommend, ' + restaurant.name + '. Would you like to hear more?';
        this.emit(':ask', say);
    },

    'BreakfastIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('breakfast'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'For breakfast, try this, ' + restaurant.name + '. Would you like to hear more?';
        this.emit(':ask', say);
    },

    'LunchIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('lunch'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'Lunch time! Here is a good spot. ' + restaurant.name + '. Would you like to hear more?';
        this.emit(':ask', say);
    },

    'DinnerIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('dinner'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'Enjoy dinner at, ' + restaurant.name + '. Would you like to hear more?';
        this.emit(':ask', say);
    },

    'AMAZON.YesIntent': function () {
        var restaurantName = this.attributes['restaurant'];
        var restaurantDetails = getRestaurantByName(restaurantName);

        var say = restaurantDetails.name
            + ' is located at ' + restaurantDetails.address
            + ', the phone number is ' + restaurantDetails.phone
            + ', and the description is, ' + restaurantDetails.description
            + '  I have sent these details to the Alexa App on your phone.  Enjoy your meal! <say-as interpret-as="interjection">bon appetit</say-as>' ;

        var card = restaurantDetails.name + '\n' + restaurantDetails.address + '\n'
            + data.city + ', ' + data.state + ' ' + data.postcode
            + '\nphone: ' + restaurantDetails.phone + '\n';

        this.emit(':tellWithCard', say, restaurantDetails.name, card);

    },

    'AttractionIntent': function () {
        var distance = 200;
        if (this.event.request.intent.slots.distance.value) {
            distance = this.event.request.intent.slots.distance.value;
        }

        var attraction = randomArrayElement(getAttractionsByDistance(distance));

        var say = 'Try '
            + attraction.name + ', which is '
            + (attraction.distance == "0" ? 'right downtown. ' : attraction.distance + ' miles away. Have fun! ')
            + attraction.description;

        this.emit(':tell', say);
    },

    'GoOutIntent': function () {

        getWeather( ( localTime, currentTemp, currentCondition) => {
            // time format 10:34 PM
            // currentTemp 72
            // currentCondition, e.g.  Sunny, Breezy, Thunderstorms, Showers, Rain, Partly Cloudy, Mostly Cloudy, Mostly Sunny

            // sample API URL for Irvine, CA
            // https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22irvine%2C%20ca%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys

            this.emit(':tell', 'It is ' + localTime
                + ' and the weather in ' + data.city
                + ' is '
                + currentTemp + ' and ' + currentCondition);

            // TODO
            // Decide, based on current time and weather conditions,
            // whether to go out to a local beach or park;
            // or recommend a movie theatre; or recommend staying home


        });
    },

    'AMAZON.NoIntent': function () {
        this.emit('AMAZON.StopIntent');
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', this.t('HELP'));
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP'));
    }

};

//    END of Intent Handlers {} ========================================================================================
// 3. Helper Function  =================================================================================================

function getRestaurantsByMeal(mealtype) {

    var list = [];
    for (var i = 0; i < data.restaurants.length; i++) {

        if(data.restaurants[i].meals.search(mealtype) >  -1) {
            list.push(data.restaurants[i]);
        }
    }
    return list;
}

function getRestaurantByName(restaurantName) {

    var restaurant = {};
    for (var i = 0; i < data.restaurants.length; i++) {

        if(data.restaurants[i].name == restaurantName) {
            restaurant = data.restaurants[i];
        }
    }
    return restaurant;
}

function getAttractionsByDistance(maxDistance) {

    var list = [];

    for (var i = 0; i < data.attractions.length; i++) {

        if(parseInt(data.attractions[i].distance) <= maxDistance) {
            list.push(data.attractions[i]);
        }
    }
    return list;
}

function getWeather(callback) {
    var https = require('https');


    var req = https.request(myAPI, res => {
        res.setEncoding('utf8');
        var returnData = "";

        res.on('data', chunk => {
            returnData = returnData + chunk;
        });
        res.on('end', () => {
            var channelObj = JSON.parse(returnData).query.results.channel;

            var localTime = channelObj.lastBuildDate.toString();
            localTime = localTime.substring(17, 25).trim();

            var currentTemp = channelObj.item.condition.temp;

            var currentCondition = channelObj.item.condition.text;

            callback(localTime, currentTemp, currentCondition);

        });

    });
    req.end();
}
function randomArrayElement(array) {
    var i = 0;
    i = Math.floor(Math.random() * array.length);
    return(array[i]);
}

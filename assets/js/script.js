// DOM Elements
const cityInput = document.querySelector("#city-input");
const searchBtn = document.querySelector("#search-btn");
const searchHistory = document.querySelector("#searched")
const cityHeader = document.querySelector("#day-0-city");
const day0Temp = document.querySelector("#day-0-temp");
const day0Wind = document.querySelector("#day-0-wind");
const day0Humidity = document.querySelector("#day-0-humidity");
const day0Card = document.querySelector("#day-0");
const day1Card = document.querySelector("#day-1");
const day2Card = document.querySelector("#day-2");
const day3Card = document.querySelector("#day-3");
const day4Card = document.querySelector("#day-4");
const day5Card = document.querySelector("#day-5");
const dayCards = [day1Card, day2Card, day3Card, day4Card, day5Card];

// gather current day weather data into array
function parseWeather(data) {
  return {
    city: data.name,
    temp: Math.floor(data.main.temp_max),
    wind: Math.floor(data.wind.speed),
    humidity: data.main.humidity,
    icon: "http://openweathermap.org/img/wn/" + data.weather[0].icon + ".png"
  };
}

// Find high values in 3hr 5 day forecast and save them to 5 day array daysData
function parse5Weather(data) {
  // Split 40 three hour chunks into 5 days of 8 chunks
  const days = [];
  for (let i = 0; i < data.list.length; i += 8) {
    const day = data.list.slice(i, i + 8);
    days.push(day);
  }
  const daysData = []
  // Search each day for the highest temp/wind/humidity by sorting their arrays and saving the last sorted index to the correct day
  days.forEach(day => {
    let temps = [];
    let winds = [];
    let humidities = [];
    let icon = "http://openweathermap.org/img/wn/" + day[3].weather[0].icon + ".png";

    for (let i = 0; i < day.length; i++) {
      temps.push(day[i].main.temp);
      winds.push(day[i].wind.speed);
      humidities.push(day[i].main.humidity)
    }

    const tempsSort = temps.sort();
    const windsSort = winds.sort();
    const humiditiesSort = humidities.sort();

    const highTemp = tempsSort[7];
    const highWind = windsSort[7];
    const highHumidity = humiditiesSort[7];

    daysData.push({temp: Math.floor(highTemp), wind: Math.floor(highWind), humidity: highHumidity, icon: icon});
  })

  return daysData;
}

// POPULATE FORECAST DATA
// Return a string equal to a class name that will change the displayed text color of the checked temp
function checkSeverity (temp) {
  let severity; 
  if (temp >= 80) {
    severity = "high";
  } else if (temp >= 55) {
    severity = "nice";
  } else if (temp >= 33) {
    severity = "cold";
  } else {
    severity = "freezing";
  }
  return severity;
}

// Populate the current forecast card
function weatherTodayPopulation(weatherToday) {
  const severity = checkSeverity(weatherToday.temp)
  cityHeader.innerHTML = "Forecast for " + weatherToday.city;
  const Date = moment().format("MM/DD/YY");
  day0Card.innerHTML = `
  <h3>${Date} <img src="${weatherToday.icon}"></h3>
  <h5>Temp: <span class="${severity}">${weatherToday.temp}\u{000B0} F</span></h5>
  <h5>Humidity: ${weatherToday.humidity}</h5>
  <h5>Wind: ${weatherToday.wind} MPH</h5>
  `
};

// Populate the 5-day forecast cards
function weather5Population(dataArray) {
  let dayPlus = 1;
  for (i = 0; i < 5; i++) {
    const severity = checkSeverity(dataArray[i].temp)
    const Date = moment(moment(), "MM/DD/YY").add("days", dayPlus).format("MM/DD/YY");
    dayCards[i].innerHTML = `
    <h3>${Date} <img src="${dataArray[i].icon}"></h3>
    <h5>Temp: <span class="${severity}">${dataArray[i].temp}\u{000B0} F</span></h5>
    <h5>Humidity: ${dataArray[i].humidity}</h5>
    <h5>Wind: ${dataArray[i].wind} MPH</h5>
    `
    dayPlus++;
  }
};

// Populate previous searches HTML
function populateSearches() {
  const previousSearches = JSON.parse(localStorage.getItem("Searched Cities")).cities;
  console.log(previousSearches)
  let searchHistoryHTML = ""
  for (i = 0; i < previousSearches.length; i++) {
    searchHistoryHTML += `<button type="button" class="btn btn-primary btn-city col-12" data-city="${previousSearches[i]}">${previousSearches[i]}</button>`
  }

  // Add an event handler to each city button
  searchHistory.innerHTML = searchHistoryHTML;
  const cityBtns = document.querySelectorAll(".btn-city");
  for (i = 0; i < cityBtns.length; i++) {
    cityBtns[i].addEventListener("click", previousSearchesHandler)
  }
}

// FETCH
// Convert city to geocoordinates
function searchWeather(city) {
  let lat;
  let long;
  const queryURLCity = "http://api.openweathermap.org/geo/1.0/direct?q=" + city + "&appid=b2e49f565c442147f827e664c3ed57d4"
  fetch(queryURLCity)
  .then((response) => response.json())
  .then((data) => {
    // Store searched city names
    if (data) {
      const searchedCities = JSON.parse(localStorage.getItem("Searched Cities"));
      if (searchedCities == null) {
        localStorage.setItem("Searched Cities", JSON.stringify({cities: [city]}));
      } else {
        newSearchedCities = searchedCities.cities;
        if (newSearchedCities.includes(city) == false) {
          newSearchedCities.push(city);
          localStorage.setItem("Searched Cities", JSON.stringify({cities: newSearchedCities}))
        }
      }
    }

    // Grab lat and long
    lat = data[0].lat;
    long = data[0].lon;

    // Search current and 5-day forecast using geocoordinates
    searchTodayWeather(lat, long);
    search5WeatherLL(lat, long);
  })
};

// call current day forecast using geocoordinates
function searchTodayWeather(lat, long) {
  const queryURLLL = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + long + "&units=imperial&appid=f4219c49cd0376e5aa06cf0b592e4bb1"
  fetch(queryURLLL)
  .then((response) => response.json())
  .then((data) => {
    const weatherToday = parseWeather(data);
    populateSearches();
    weatherTodayPopulation(weatherToday);
  })
}

// call 5-day forecast using geocoordinates
function search5WeatherLL(lat, long) {
  const queryURLLL = "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + long + "&units=imperial&appid=f4219c49cd0376e5aa06cf0b592e4bb1"
  fetch(queryURLLL)
  .then((response) => response.json())
  .then((data) => {
    const daysData = parse5Weather(data);
    weather5Population(daysData);
  })
}

// SEARCH HANDLERS
searchHandler = function(event) {
  event.preventDefault();

  let city = cityInput.value;
  searchWeather(city);
  populateSearches();
};

previousSearchesHandler = function(event) {
  event.preventDefault();

  const city = event.target.getAttribute("data-city");
  cityInput.value = city;
  searchWeather(city);
}

searchBtn.addEventListener("click", searchHandler);

// Start page by populating with Boston weather
searchWeather("Boston");
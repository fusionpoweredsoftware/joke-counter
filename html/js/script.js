const domain = 'u3.fusionpoweredsoftware.com';

// Function to format the rate
function formatRate(rate) {
    return rate % 1 === 0 ? rate.toFixed(0) : rate.toFixed(2);
}

// Function to update the display based on data
function updateDisplay(data) {
    const jokeButton = document.getElementById('jokeButton');
    const jokeCountText = `Count New Joke: ${data.joke_count} cross-verified`;
    const ipJokeCountText = data.ip_joke_count !== undefined ? ` (${data.ip_joke_count} confirmed locally)` : '';
    jokeButton.textContent = jokeCountText + ipJokeCountText;

    document.getElementById('rateHour').textContent = `Joke rate: ${formatRate(data.rate_hour)} jokes/hour`;
    document.getElementById('rateDay').textContent = `Joke rate: ${formatRate(data.rate_day)} jokes/day`;
}

// Check if there's cached data in local storage and update the display
const cachedData = localStorage.getItem('jokeData');
if (cachedData) {
    updateDisplay(JSON.parse(cachedData));
}

// Add event listener to the joke button
document.getElementById('jokeButton').addEventListener('click', () => {
    fetch(`https://${domain}:3002/joke`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        // Update the display and cache the data
        updateDisplay(data);
        localStorage.setItem('jokeData', JSON.stringify(data));
    })
    .catch(error => console.error('Error:', error));
});

// Add event listener to the reset button
document.getElementById('resetButton').addEventListener('click', () => {
    fetch(`https://${domain}:3002/reset`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        // Remove cached data from local storage
        localStorage.removeItem('jokeData');
        // Update the display to reflect the reset state
        document.getElementById('jokeButton').textContent = 'Jokes: ???';
        document.getElementById('rateHour').textContent = 'Joke rate: ??? jokes/hour';
        document.getElementById('rateDay').textContent = 'Joke rate: ??? jokes/day';
    })
    .catch(error => console.error('Error:', error));
});

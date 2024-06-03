# Joke Counter

This project implements a joke counter system that tracks the number of jokes, calculates the joke rate per hour and per day, and provides a reset functionality. The system consists of a Node.js server, HTML frontend, and JavaScript for client-side functionality.

## Setup

### Prerequisites

- Node.js and npm installed on your system
- A domain with SSL certificates (e.g., from Let's Encrypt)
- curl installed on your system

### File Structure

├── server
│ └── joke-counter.js
├── html
│ ├── index.html
│ └── js
│ └── script.js
├── domain.txt
└── report-path.txt

### Configuration

1. **domain.txt**: Add your domain name.
    ```
    u3.domain.com
    ```

2. **report-path.txt**: Add the path where the reports will be stored.
    ```
    /path/to/report
    ```

### Node.js Server Setup

1. Create the `server` directory and add `joke-counter.js` with the server code.
2. Install the required Node.js modules:
    ```sh
    npm install express https fs cors
    ```
3. Start the server:
    ```sh
    node server/joke-counter.js
    ```

### HTML and JavaScript Setup

1. Create the `html` directory and add `index.html` and `js/script.js`.
2. **index.html**:
   - This file contains the basic HTML structure with buttons and text elements to display the joke count and rate.
3. **script.js**:
   - This file contains JavaScript to handle button clicks, fetch data from the server, update the display, and handle local storage for caching data.

### Usage

To interact with the joke counter API, you can use the following `curl` commands:

- Increment the joke count:
    ```sh
    curl -k -X POST https://u3.domain.com:3002/joke
    ```

- Reset the joke count:
    ```sh
    curl -k -X POST https://u3.domain.com:3002/reset
    ```

### Additional Notes

- Ensure your SSL certificates are correctly set up and paths are accurate.
- The Node.js server must be running for the API to be accessible.
- Open the `index.html` file in a web browser to interact with the joke counter interface.

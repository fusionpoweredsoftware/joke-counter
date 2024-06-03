const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3002;

// Read domain name from domain.txt
const domain = fs.readFileSync('domain.txt', 'utf8').trim();

// Read report path from report-path.txt
const reportPath = fs.readFileSync('report-path.txt', 'utf8').trim()+"/joke_counter";

// SSL/TLS Certificates
const privateKey = fs.readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`, 'utf8');
const certificate = fs.readFileSync(`/etc/letsencrypt/live/${domain}/fullchain.pem`, 'utf8');

const credentials = { key: privateKey, cert: certificate };

let jokeCount = 0;
const ipCounts = {};
let startTime = Date.now();
const maxIps = process.argv[2] || 3;  // Default to 3 if not provided as an argument

let cumulativeData = {
    jokeCount: 0,
    rateHour: 0,
    rateDay: 0,
    ipCounts: {}
};

let threeHourReports = [];

function getJokeRate() {
    const now = Date.now();
    const elapsedMilliseconds = now - startTime;

    let elapsedHours = elapsedMilliseconds / (1000 * 60 * 60);

    // Calculate the rate assuming the current count is for the elapsed time in the 3-hour period
    elapsedHours = Math.max(elapsedHours, 1);

    const rateHour = jokeCount / elapsedHours;
    const rateDay = rateHour * 24;

    return { rateHour, rateDay };
}


function saveReport(report, type) {
    const reportData = {
        type,
        date: new Date().toISOString(),
        ...report
    };
    const dateString = new Date().toISOString().split('T')[0];
    fs.appendFileSync(`${reportPath}/reports_${dateString}.json`, JSON.stringify(reportData) + '\n');
}

function generatePeriodicReports() {
    const currentData = {
        jokeCount,
        rateHour: getJokeRate().rateHour,
        rateDay: getJokeRate().rateDay,
        ipCounts
    };

    // Save the 3-hour report
    saveReport(currentData, '3-hour');
    threeHourReports.push(currentData);

    // Update cumulative data
    cumulativeData.jokeCount += jokeCount;
    cumulativeData.rateHour = getJokeRate().rateHour;
    cumulativeData.rateDay = getJokeRate().rateDay;

    // Generate 6-hour report
    if (threeHourReports.length % 2 === 0) {
        const sixHourData = {
            jokeCount: threeHourReports.slice(-2).reduce((sum, report) => sum + report.jokeCount, 0),
            rateHour: cumulativeData.rateHour,
            rateDay: cumulativeData.rateDay
        };
        saveReport(sixHourData, '6-hour');
    }

    // Generate 12-hour report
    if (threeHourReports.length % 4 === 0) {
        const twelveHourData = {
            jokeCount: threeHourReports.slice(-4).reduce((sum, report) => sum + report.jokeCount, 0),
            rateHour: cumulativeData.rateHour,
            rateDay: cumulativeData.rateDay
        };
        saveReport(twelveHourData, '12-hour');
    }

    // Generate daily report
    if (threeHourReports.length % 8 === 0) {
        const dailyData = {
            jokeCount: cumulativeData.jokeCount,
            rateHour: cumulativeData.rateHour,
            rateDay: cumulativeData.rateDay
        };
        saveReport(dailyData, 'daily');
        // Reset cumulative data for the next day
        cumulativeData = {
            jokeCount: 0,
            rateHour: 0,
            rateDay: 0,
            ipCounts: {}
        };
    }

    // Reset joke count and ipCounts
    jokeCount = 0;
    for (const key in ipCounts) {
        ipCounts[key] = 0;
    }
    startTime = Date.now();
    console.log('Periodic report saved and counts reset');
}

const corsOptions = {
    origin: [
        `https://${domain}`,
        'https://unitycubed.com',
        'https://www.unitycubed.com'
    ]
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('public'));

app.post('/joke', (req, res) => {
    // Extract the origin IP from the X-Forwarded-For header or fallback to req.ip
    const ip = req.headers['x-forwarded-for'] || req.ip;
    console.log(`Received request from IP: ${ip}`);

    // Check if the number of unique IPs exceeds the max allowed
    if (!(ip in ipCounts) && Object.keys(ipCounts).length >= maxIps) {
        console.log(`Maximum number of unique IPs (${maxIps}) reached. Ignoring request from IP: ${ip}`);
        return res.status(403).json({ message: 'Maximum number of unique IPs reached' });
    }

    if (!(ip in ipCounts)) {
        ipCounts[ip] = jokeCount;
    }

    ipCounts[ip] += 1;

    // Check if at least two unique IPs have the same count after increment
    const newCount = ipCounts[ip];
    const agreeingIps = Object.values(ipCounts).filter(count => count >= newCount).length;

    console.log(`ipCounts after increment: ${JSON.stringify(ipCounts)}`);
    console.log(`New count for IP ${ip}: ${newCount}`);
    console.log(`Number of IPs agreeing with the new count: ${agreeingIps}`);

    if (agreeingIps >= 2 && newCount > jokeCount) {
        jokeCount = newCount;
        for (const key in ipCounts) {
            if (ipCounts[key] < jokeCount) {
                ipCounts[key] = jokeCount;
            }
        }
        console.log(`Joke count incremented to: ${jokeCount}`);
    }

        const { rateHour, rateDay } = getJokeRate();

	    console.log(`Rates - Hour: ${rateHour}, Day: ${rateDay}`);

	    res.json({
		            joke_count: jokeCount,
		            ip_joke_count: ipCounts[ip],
		            rate_hour: rateHour,
		            rate_day: rateDay
		        });
});

app.post('/reset', (req, res) => {
    // Extract the origin IP from the X-Forwarded-For header or fallback to req.ip
    const ip = req.headers['x-forwarded-for'] || req.ip;
    console.log(`Reset request from IP: ${ip}`);

    if (ip in ipCounts) {
        ipCounts[ip] = 0;
    }

    // Check if at least two IPs have a 0 value
    const zeroCountIps = Object.values(ipCounts).filter(count => count === 0).length;
    if (zeroCountIps >= 2) {
        startTime = Date.now();
        console.log('Start time updated due to two or more IPs with zero count');
        // Reset all ipCounts to 0
        for (const key in ipCounts) {
            ipCounts[key] = 0;
        }
        jokeCount = 0; // Also reset the jokeCount
    }

    const { rateHour, rateDay } = getJokeRate();
    console.log(`Rates after reset - Hour: ${rateHour.toFixed(2)}, Day: ${rateDay.toFixed(2)}`);

    res.json({
        message: `Reset count for IP ${ip}`,
        rate_hour: rateHour,
        rate_day: rateDay
    });
});

// Schedule the periodic reports and reset every 3 hours
setInterval(() => {
    const now = new Date();
    if (now.getHours() % 3 === 0 && now.getMinutes() === 0) {
        generatePeriodicReports();
    }
}, 60 * 1000); // Check every minute

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
    console.log(`HTTPS Server running at https://${domain}:${port}/`);
    console.log(`Maximum number of unique IPs allowed: ${maxIps}`);
});

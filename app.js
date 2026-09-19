import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// =====================================================
// ARVIE FIREBASE CONFIG
// =====================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDhxTwgwmveoZ1wyw8RpVJLdWIAkBeaMkk",

    authDomain:
        "arviebebe.firebaseapp.com",

    databaseURL:
        "https://arviebebe-default-rtdb.europe-west1.firebasedatabase.app",

    projectId:
        "arviebebe",

    storageBucket:
        "arviebebe.firebasestorage.app",

    messagingSenderId:
        "1066434100343",

    appId:
        "1:1066434100343:web:2e13f21a26f44d5c979a72",

    measurementId:
        "G-3SC467QMVY"
};


// =====================================================
// FIREBASE INITIALIZATION
// =====================================================

const firebaseApp =
    initializeApp(firebaseConfig);

const database =
    getDatabase(firebaseApp);


// =====================================================
// FIREBASE DATA PATH
// =====================================================

const dataRef =
    ref(
        database,
        "ESP32_Data"
    );


// =====================================================
// DOM ELEMENTS
// =====================================================

const statusText =
    document.getElementById(
        "statusText"
    );

const statusDot =
    document.getElementById(
        "statusDot"
    );

const currentTemperature =
    document.getElementById(
        "currentTemperature"
    );

const currentHumidity =
    document.getElementById(
        "currentHumidity"
    );

const recordCount =
    document.getElementById(
        "recordCount"
    );

const graphDate =
    document.getElementById(
        "graphDate"
    );

const historyTableBody =
    document.getElementById(
        "historyTableBody"
    );

const historyRecordCount =
    document.getElementById(
        "historyRecordCount"
    );

const toggleHistory =
    document.getElementById(
        "toggleHistory"
    );

const historyContent =
    document.getElementById(
        "historyContent"
    );


// =====================================================
// VARIABLES
// =====================================================

let allSensorData = {};

let selectedDate = "";

let sensorChart = null;


// =====================================================
// FIREBASE STATUS
// =====================================================

function showConnected() {

    statusText.textContent =
        "ONLINE";

    statusDot.style.background =
        "#22d3ee";
}


function showOffline() {

    statusText.textContent =
        "OFFLINE";

    statusDot.style.background =
        "#64748b";
}


// =====================================================
// NUMBER HELPER
// =====================================================

function toNumber(value) {

    const number =
        Number(value);

    if (
        Number.isFinite(number)
    ) {

        return number;
    }

    return null;
}


// =====================================================
// FORMAT NUMBER
// =====================================================

function formatNumber(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "--";
    }

    return Number(value).toFixed(1);
}


// =====================================================
// GET DATE LIST
// =====================================================

function getDateList(data) {

    return Object.keys(
        data || {}
    )

    .filter(
        key =>
            data[key] &&
            typeof data[key] === "object"
    )

    .sort()

    .reverse();
}


// =====================================================
// COUNT ALL RECORDS
// =====================================================

function getTotalRecords(data) {

    let total = 0;

    const dates =
        Object.keys(
            data || {}
        );

    dates.forEach(
        date => {

            const dayData =
                data[date];

            if (
                !dayData ||
                typeof dayData !== "object"
            ) {

                return;
            }


            Object.keys(dayData)
                .forEach(
                    time => {

                        const reading =
                            dayData[time];

                        if (
                            reading &&
                            typeof reading === "object"
                        ) {

                            const temperature =
                                toNumber(
                                    reading.temperature
                                );

                            const humidity =
                                toNumber(
                                    reading.humidity
                                );


                            if (
                                temperature !== null ||
                                humidity !== null
                            ) {

                                total++;

                            }

                        }

                    }
                );

        }
    );


    return total;
}


// =====================================================
// GET LATEST READING
// =====================================================

function getLatestReading(data) {

    let latest = null;

    const dates =
        Object.keys(
            data || {}
        ).sort();


    for (
        const date of dates
    ) {

        const times =
            Object.keys(
                data[date] || {}
            ).sort();


        for (
            const time of times
        ) {

            const reading =
                data[date][time];


            if (
                !reading ||
                typeof reading !== "object"
            ) {

                continue;
            }


            const temperature =
                toNumber(
                    reading.temperature
                );


            const humidity =
                toNumber(
                    reading.humidity
                );


            if (
                temperature === null &&
                humidity === null
            ) {

                continue;
            }


            latest = {

                date:
                    date,

                time:
                    time,

                temperature:
                    temperature,

                humidity:
                    humidity

            };
        }
    }


    return latest;
}


// =====================================================
// GET READINGS FOR DATE
// =====================================================

function getReadingsForDate(date) {

    const result = [];


    if (!date) {

        return result;
    }


    const dayData =
        allSensorData[date];


    if (
        !dayData ||
        typeof dayData !== "object"
    ) {

        return result;
    }


    const times =
        Object.keys(dayData)

        .filter(
            time =>
                dayData[time] &&
                typeof dayData[time] === "object"
        )

        .sort();


    times.forEach(
        time => {

            const reading =
                dayData[time];


            const temperature =
                toNumber(
                    reading.temperature
                );


            const humidity =
                toNumber(
                    reading.humidity
                );


            if (
                temperature === null &&
                humidity === null
            ) {

                return;
            }


            result.push({

                time:
                    time,

                temperature:
                    temperature,

                humidity:
                    humidity

            });

        }
    );


    return result;
}


// =====================================================
// POPULATE DATE SELECT
// ONLY ONE SELECT
// =====================================================

function populateDateSelect() {

    const dates =
        getDateList(
            allSensorData
        );


    if (!graphDate) {

        return;
    }


    graphDate.innerHTML =
        "";


    if (
        dates.length === 0
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            "";

        option.textContent =
            "No dates available";

        graphDate.appendChild(
            option
        );

        return;
    }


    dates.forEach(
        date => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                date;

            option.textContent =
                date;

            graphDate.appendChild(
                option
            );

        }
    );


    graphDate.value =
        selectedDate ||
        dates[0];
}


// =====================================================
// UPDATE CURRENT VALUES
// =====================================================

function updateCurrentReading() {

    const latest =
        getLatestReading(
            allSensorData
        );


    if (!latest) {

        currentTemperature.textContent =
            "-- °C";

        currentHumidity.textContent =
            "-- %";

        return;
    }


    currentTemperature.textContent =
        formatNumber(
            latest.temperature
        ) + " °C";


    currentHumidity.textContent =
        formatNumber(
            latest.humidity
        ) + " %";


    console.log(
        "LATEST DHT11 READING:",
        latest
    );
}


// =====================================================
// UPDATE GRAPH
// =====================================================

function updateChart() {

    if (
        typeof Chart === "undefined"
    ) {

        console.error(
            "Chart.js is not loaded."
        );

        return;
    }


    const date =
        graphDate
            ? graphDate.value
            : selectedDate;


    const readings =
        getReadingsForDate(
            date
        );


    const labels =
        readings.map(
            item =>
                item.time
        );


    const temperatures =
        readings.map(
            item =>
                item.temperature
        );


    const humidities =
        readings.map(
            item =>
                item.humidity
        );


    const canvas =
        document.getElementById(
            "sensorChart"
        );


    if (!canvas) {

        return;
    }


    if (sensorChart) {

        sensorChart.destroy();

        sensorChart = null;
    }


    sensorChart =
        new Chart(
            canvas,
            {

                type:
                    "line",


                data:
                {

                    labels:
                        labels,


                    datasets:
                    [

                        {

                            label:
                                "Temperature (°C)",

                            data:
                                temperatures,

                            borderColor:
                                "#06b6d4",

                            backgroundColor:
                                "rgba(6, 182, 212, 0.12)",

                            yAxisID:
                                "temperature",

                            tension:
                                0.3,

                            borderWidth:
                                3,

                            pointRadius:
                                4,

                            pointBackgroundColor:
                                "#22d3ee"

                        },


                        {

                            label:
                                "Humidity (%)",

                            data:
                                humidities,

                            borderColor:
                                "#a78bfa",

                            backgroundColor:
                                "rgba(167, 139, 250, 0.12)",

                            yAxisID:
                                "humidity",

                            tension:
                                0.3,

                            borderWidth:
                                3,

                            pointRadius:
                                4,

                            pointBackgroundColor:
                                "#c4b5fd"

                        }

                    ]

                },


                options:
                {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    animation:
                    {
                        duration:
                            300
                    },


                    interaction:
                    {
                        mode:
                            "index",

                        intersect:
                            false
                    },


                    plugins:
                    {

                        legend:
                        {
                            labels:
                            {
                                color:
                                    "#cbd5e1"
                            }
                        }

                    },


                    scales:
                    {

                        x:
                        {

                            ticks:
                            {
                                color:
                                    "#64748b"
                            },

                            grid:
                            {
                                color:
                                    "#1f2937"
                            }

                        },


                        temperature:
                        {

                            type:
                                "linear",

                            position:
                                "left",


                            title:
                            {

                                display:
                                    true,

                                text:
                                    "Temperature (°C)",

                                color:
                                    "#06b6d4"

                            },


                            ticks:
                            {
                                color:
                                    "#64748b"
                            },


                            grid:
                            {
                                color:
                                    "#1f2937"
                            }

                        },


                        humidity:
                        {

                            type:
                                "linear",

                            position:
                                "right",


                            title:
                            {

                                display:
                                    true,

                                text:
                                    "Humidity (%)",

                                color:
                                    "#a78bfa"

                            },


                            ticks:
                            {
                                color:
                                    "#64748b"
                            },


                            grid:
                            {

                                drawOnChartArea:
                                    false

                            }

                        }

                    }

                }

            }
        );


    console.log(
        "GRAPH UPDATED:",
        date,
        readings.length,
        "records"
    );
}


// =====================================================
// UPDATE HISTORY
// USING THE SAME DATE FILTER
// =====================================================

function updateHistory() {

    if (!historyTableBody) {

        return;
    }


    const date =
        graphDate
            ? graphDate.value
            : selectedDate;


    const readings =
        getReadingsForDate(
            date
        );


    historyTableBody.innerHTML =
        "";


    if (
        readings.length === 0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        const cell =
            document.createElement(
                "td"
            );


        cell.colSpan =
            3;


        cell.textContent =
            "No sensor data available.";


        row.appendChild(
            cell
        );


        historyTableBody.appendChild(
            row
        );


        historyRecordCount.textContent =
            "0 records";


        return;
    }


    readings
        .slice()
        .reverse()
        .forEach(
            reading => {

                const row =
                    document.createElement(
                        "tr"
                    );


                const timeCell =
                    document.createElement(
                        "td"
                    );


                const temperatureCell =
                    document.createElement(
                        "td"
                    );


                const humidityCell =
                    document.createElement(
                        "td"
                    );


                timeCell.textContent =
                    reading.time;


                temperatureCell.textContent =
                    formatNumber(
                        reading.temperature
                    ) + " °C";


                humidityCell.textContent =
                    formatNumber(
                        reading.humidity
                    ) + " %";


                row.appendChild(
                    timeCell
                );


                row.appendChild(
                    temperatureCell
                );


                row.appendChild(
                    humidityCell
                );


                historyTableBody.appendChild(
                    row
                );

            }
        );


    historyRecordCount.textContent =
        readings.length +
        (
            readings.length === 1
                ? " record"
                : " records"
        );
}


// =====================================================
// UPDATE DASHBOARD
// =====================================================

function updateDashboard() {

    const dates =
        getDateList(
            allSensorData
        );


    if (
        dates.length === 0
    ) {

        currentTemperature.textContent =
            "-- °C";

        currentHumidity.textContent =
            "-- %";

        recordCount.textContent =
            "0";


        if (historyTableBody) {

            historyTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="3"
                        class="empty"
                    >
                        No sensor data available.
                    </td>

                </tr>

            `;

        }


        return;
    }


    if (
        !selectedDate ||
        !dates.includes(
            selectedDate
        )
    ) {

        selectedDate =
            dates[0];
    }


    // Total records sa taas
    recordCount.textContent =
        getTotalRecords(
            allSensorData
        );


    // Iisang date selector lang
    populateDateSelect();


    // Current sensor values
    updateCurrentReading();


    // Graph uses selected date
    updateChart();


    // History uses the SAME selected date
    updateHistory();
}


// =====================================================
// FIREBASE LISTENER
// =====================================================

console.log(
    "================================="
);

console.log(
    "ARVIE ACTIVITY 4"
);

console.log(
    "Connecting to Firebase..."
);

console.log(
    "Database path: /ESP32_Data"
);

console.log(
    "================================="
);


showOffline();


onValue(

    dataRef,

    snapshot => {

        console.log(
            "FIREBASE DATA RECEIVED"
        );


        const value =
            snapshot.val();


        console.log(
            value
        );


        allSensorData =
            value || {};


        showConnected();


        updateDashboard();

    },


    error => {

        console.error(
            "FIREBASE READ ERROR:",
            error
        );


        showOffline();

    }

);


// =====================================================
// DATA FILTER DATE CHANGE
// THIS CONTROLS BOTH GRAPH + HISTORY
// =====================================================

if (graphDate) {

    graphDate.addEventListener(
        "change",
        function() {

            selectedDate =
                this.value;


            updateChart();

            updateHistory();

        }
    );
}


// =====================================================
// SHOW / HIDE HISTORY
// =====================================================

if (toggleHistory) {

    toggleHistory.addEventListener(
        "click",
        function() {

            if (
                historyContent.classList.contains(
                    "hidden"
                )
            ) {

                historyContent.classList.remove(
                    "hidden"
                );


                toggleHistory.textContent =
                    "Hide History";


                updateHistory();

            }

            else {

                historyContent.classList.add(
                    "hidden"
                );


                toggleHistory.textContent =
                    "Show History";

            }

        }
    );
}
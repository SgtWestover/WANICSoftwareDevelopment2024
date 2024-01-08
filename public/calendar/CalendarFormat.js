/*
Name: Zach Rojas, Kaelin Wang Hu
Date: 11/21/2023
Last Edit: 11/27/2023
Desc: Handles the main calendar page and formatting
*/
// Global variable for the current date
let currentDate = new Date();
var currentYearSearch = '';
var highlightedYearElement = null;
var lastSelectedYear = null;


let ws = new WebSocket("ws://" + window.location.host);

// When the DOM content is fully loaded, initialize the calendar
document.addEventListener('DOMContentLoaded', function ()
{
    if (window.location.hash === '#popup1')
    {
        window.location.href = 'index.html';
        return; // Exit the function to prevent further execution
    }
    addNavigationEventListeners();
    renderCalendar(currentDate);
    createYearDropdown(1000,9999)
});

ws.addEventListener("open", (event) => {
    ws.send(JSON.stringify({type: "connected"}))
});

ws.addEventListener("message", (event) => {
    console.log("Message from server ", event.data);
});

/**
 * Renders the calendar for a given date.
 * @param {Date} date - The date for which to render the calendar.
 */
function renderCalendar(date)
{
    // Clear previous calendar content
    let calendarBody = document.getElementById('calendar-body');
    calendarBody.innerHTML = '';

    // Set the month and year in the header TODO: Fix months
    document.getElementById('month-button').innerText = new Intl.DateTimeFormat('en-US', { month: 'long'}).format(date);
    document.getElementById('year-button').innerText = new Intl.DateTimeFormat('en-US', { year: 'numeric'}).format(date);
    lastSelectedYear = document.getElementById('year-button').innerText;

    // Get the first and last day of the month
    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Determine the starting day of the week and the total number of days in the month
    let startingDay = firstDay.getDay();
    let monthDays = lastDay.getDate();

    // Initialize the day counter
    let dayOfMonth = 1;

    // Set rows based on starting day, and total number of days
    let numRows = 5;

    if (startingDay === 5 && monthDays > 30 || startingDay === 6 && monthDays > 29) numRows = 6;
    let today = new Date(); // Today's date
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
    // Create rows for each week
    for (let i = 0; i < numRows; i++)
    {
        let row = document.createElement('tr');

        // Create cells for each day of the week
        for (let j = 0; j < 7; j++)
        {
            let cell = document.createElement('td');

            // Use an IIFE to capture the current state of 'dayOfMonth'
            (function(currentDay)
            {
                // Fill cells with the day number or leave them blank
                if ((i === 0 && j < startingDay) || currentDay > monthDays)
                {
                    cell.innerText = '';
                }
                else
                {
                    cell.classList.add('calendar-cell');
                    cell.innerText = currentDay;
                    cell.style.cursor = 'pointer';

                    cell.addEventListener('click', function() // Click on day
                    {
                        let clickedDate = new Date(date.getFullYear(), date.getMonth(), currentDay);
                        // console.log(clickedDate);
                        let isToday = (clickedDate.toDateString() === today.toDateString());

                        // Emit custom event with the selected date
                        let event = new CustomEvent('dateSelected', { detail: { date: clickedDate, isToday: isToday } });
                        document.dispatchEvent(event);

                        window.location.href = '#popup1';
                    });

                    // Highlight the current day
                    let cellDate = new Date(date.getFullYear(), date.getMonth(), currentDay);
                    if (cellDate.getTime() === today.getTime())
                    {
                        cell.classList.add('selected-day');
                    }
                }
            })(dayOfMonth); // Pass 'dayOfMonth' to the IIFE

            // Check if the cell should contain a day of the month
            if (!(i === 0 && j < startingDay) && dayOfMonth <= monthDays)
            {
                // Increment the day of the month
                dayOfMonth++;
            }
            // Append the cell to the row
            row.appendChild(cell);
        }

        // Append the row to the calendar body
        calendarBody.appendChild(row);
    }
}

document.querySelector('.popup .close').addEventListener('click', function()
{
    document.getElementById('popupHeader').innerHTML = '';
});

function addNavigationEventListeners()
{
    // Navigate to the previous month
    document.getElementById('prev-month').addEventListener('click', function()
    {
        changeMonth(-1);
    });

    // Navigate to the next month
    document.getElementById('next-month').addEventListener('click', function()
    {
        changeMonth(1);
    });
}

//changes the month based on a delta int
function changeMonth(delta)
{
    // Adjust the month
    let newMonth = currentDate.getMonth() + delta;
    let newYear = currentDate.getFullYear();
    //if the new month exceeds the months of the current year, switch to the new year,
    if (newMonth > 11)
    {
        newMonth = 0;
        newYear++;
    }
    else if (newMonth < 0)
    {
        newMonth = 11;
        newYear--;
    }

    // Get the last day of the new month
    let lastDayNewMonth = new Date(newYear, newMonth + 1, 0).getDate();

    // If the current day is greater than the last day of the new month, adjust the day
    let newDay = currentDate.getDate();
    if (newDay > lastDayNewMonth)
    {
        newDay = lastDayNewMonth; // Set to the last day of the new month
    }

    //create the new date and render the new calendar
    currentDate = new Date(newYear, newMonth, newDay);
    renderCalendar(currentDate);
}

//sets the month based on an int
function setMonth(month)
{
    // Adjust the month
    let newMonth = month
    let newYear = currentDate.getFullYear();
    // Get the last day of the new month
    let lastDayNewMonth = new Date(newYear, newMonth + 1, 0).getDate();

    // If the current day is greater than the last day of the new month, adjust the day
    let newDay = currentDate.getDate();
    if (newDay > lastDayNewMonth)
    {
        newDay = lastDayNewMonth; // Set to the last day of the new month
    }

    //create the new date and render the new calendar
    currentDate = new Date(newYear, newMonth, newDay);
    document.getElementById("month-dropdown").classList.remove("month-show");
    renderCalendar(currentDate);
}

//sets the month based on an int
function setYear(year)
{
    // Adjust the month
    let newMonth = currentDate.getMonth();
    let newYear = year;
    // Get the last day of the new month
    let lastDayNewMonth = new Date(newYear, newMonth + 1, 0).getDate();

    // If the current day is greater than the last day of the new month, adjust the day
    let newDay = currentDate.getDate();
    if (newDay > lastDayNewMonth)
    {
        newDay = lastDayNewMonth; // Set to the last day of the new month
    }

    //create the new date and render the new calendar
    currentDate = new Date(newYear, newMonth, newDay);
    renderCalendar(currentDate);
    document.getElementById("year-dropdown").classList.remove("year-show");
    resetYearSearch();
}

//displays dropdown to select the month
function monthHeaderClick()
{
    document.getElementById("month-dropdown").classList.toggle("month-show");
}

// Close the month dropdown menu if the user clicks outside of it
window.onclick = function(event) 
{
    if (!event.target.matches('.month-dropbutton') && !event.target.closest('.month-dropdown')) {
        var dropdowns = document.getElementsByClassName("month-dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            dropdowns[i].classList.remove('month-show');
        }
    }
    if (!event.target.matches('.year-dropbutton') && !event.target.closest('.year-dropdown')) {
        var dropdowns = document.getElementsByClassName("year-dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            dropdowns[i].classList.remove('year-show');
            resetYearSearch();
        }
    }
};


//displays dropdown to select the year
function yearHeaderClick()
{
    var dropdown = document.getElementById("year-dropdown");
    dropdown.classList.toggle("year-show");
    if (dropdown.classList.contains("year-show")) 
    {
        document.addEventListener('keyup', yearSearch);
    } 
    else 
    {
        document.removeEventListener('keyup', yearSearch);
        resetYearSearch();
    }
}

function resetYearSearch() {
    currentYearSearch = ''; // Reset the search query
    if (highlightedYearElement) {
        highlightedYearElement.classList.remove('year-highlight'); // Remove highlight class
    }
    highlightedYearElement = null; // Reset the highlighted element
    scrollToSelectedYear(document.getElementById("year-dropdown"));
}


function yearSearch(event) 
{
    event.preventDefault(); // Prevent default action
    event.stopPropagation(); // Stop event from bubbling up
    var yearDivs = document.getElementById("year-dropdown").getElementsByTagName('div');
    if (event.key === 'Shift' && highlightedYearElement) 
    {
            highlightedYearElement.click();
            return;
    }
    // If the input is not a number or Enter, ignore it
    if (!event.key.match(/[0-9]/)) {
        return;
    }

    // Update the current search string
    currentYearSearch += event.key;

    // Reset the highlight
    if (highlightedYearElement) {
        highlightedYearElement.classList.remove('year-highlight');
    }
    highlightedYearElement = null; // Reset the highlighted element

    // Perform the search
    var found = false;
    for (var i = 0; i < yearDivs.length; i++) {
        if (yearDivs[i].textContent.startsWith(currentYearSearch)) {
            found = true;
            highlightedYearElement = yearDivs[i]; // Update the highlighted element
            highlightedYearElement.classList.add('year-highlight'); // Add highlight class
            highlightedYearElement.scrollIntoView();
            break;
        }
    }

    // If the search string did not match any year, reset it
    if (!found) {
        currentYearSearch = '';
    }
}


function scrollToSelectedYear(dropdownContent) {
    var yearElements = dropdownContent.getElementsByTagName('div');
    let yearToScrollTo = lastSelectedYear !== null ? lastSelectedYear : currentYear;
    for (var i = 0; i < yearElements.length; i++) 
    {
        if (parseInt(yearElements[i].textContent, 10) === parseInt(yearToScrollTo)) 
        {
            dropdownContent.scrollTop = yearElements[i].offsetTop;
            break;
        }
    }
}

// Creates the elements in the year dropdown, starting from minBound to maxBound but ensures the current year is in view
function createYearDropdown(minBound, maxBound) {
    let dropdownContent = document.getElementById('year-dropdown');
    let currentYear = new Date().getFullYear(); // Get the current year

    // Append years from minBound to maxBound
    for (let i = minBound; i <= maxBound; i++) {
        let element = document.createElement('div');
        element.textContent = `${i}`;
        element.onclick = function () { setYear(i); };
        dropdownContent.appendChild(element);
    }

    // Scroll to the current year
    let yearToScrollTo = lastSelectedYear !== null ? lastSelectedYear : currentYear;
    let yearElements = dropdownContent.getElementsByTagName('div');
    for (let i = 0; i < yearElements.length; i++) {
        if (parseInt(yearElements[i].textContent, 10) === parseInt(yearToScrollTo))
        {
            // Scroll the dropdown to show the current year
            dropdownContent.scrollTop = yearElements[i].offsetTop;
            break;
        }
    }
}

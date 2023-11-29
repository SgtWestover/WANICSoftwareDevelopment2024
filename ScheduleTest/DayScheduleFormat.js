/*
Name: Zach Rojas, Kaelin Wang Hu
Date: 11/27/2023
Last Edit: 11/27/2023
Desc: Handles the formatting for the day schedule
*/


//Generate things

//Time scale
let startTime = 0;
let endTime = 24;

function setStartTime(time)
{
    startTime = time;
    generateSchedule();
}

function setEndTime(time)
{
    endTime = time;
    generateSchedule();
}

function generateSchedule() 
{
    // Get the schedule body element
    let scheduleBody = document.getElementById('scheduleBody');
    
    // Clear previous content from the schedule body
    scheduleBody.innerHTML = '';

    // Create a container for the entire day's schedule
    let dayContainer = document.createElement('div');
    dayContainer.classList.add("day-container");

    // Generate time blocks for each hour within the day container
    for (let i = startTime; i < endTime; i++) 
    {
        // Create a new time block element
        let timeBlock = document.createElement('div');
        timeBlock.innerHTML = i + 1; // Set the time block's display number
        timeBlock.classList.add('time-block'); // Add the 'time-block' class for styling
        dayContainer.appendChild(timeBlock); // Append the time block to the day container
    }

    // Add the day container to the schedule body
    scheduleBody.appendChild(dayContainer);
}

window.onload = function() 
{
    startTime = 0;
    endTime = 24;
    generateSchedule();
};

function setStartTime(input) 
{
    let time = parseInt(input, 10); // Parse as an integer to remove leading zeros
    if (isNaN(time) || time < 0 || time >= endTime) 
    {
        console.log("Invalid input for start time.");
        startTime = 0;
    } 
    else 
    {
        console.log("Valid start time input.");
        startTime = time; // Already an integer, no need to parse again
    }
    generateSchedule(); // Reflect changes in the UI
}

function setEndTime(input) 
{
    let time = parseInt(input, 10); // Parse as an integer to remove leading zeros
    if (isNaN(time) || time <= startTime || time > 24) 
    {
        console.log("Invalid input for end time.");
        endTime = 24;
    } 
    else 
    {
        console.log("Valid end time input.");
        endTime = time; // Already an integer, no need to parse again
    }
    generateSchedule();
}

// Adjusted function to evaluate on blur
function evaluateInputOnBlur(inputId) 
{
    let inputElement = document.getElementById(inputId);
    let inputValue = parseInt(inputElement.value, 10);
    if (isNaN(inputValue) || (inputId === 'startTime' && (inputValue < 0 || inputValue >= endTime)) ||
        (inputId === 'endTime' && (inputValue <= startTime || inputValue > 24))) 
    {
        inputElement.value = inputId === 'startTime' ? 0 : 24; // Set default value if invalid
    }
    // Call setStartTime or setEndTime based on which input is being evaluated
    if(inputId === 'startTime') 
    {
        setStartTime(inputElement.value);
    } 
    else 
    {
        setEndTime(inputElement.value);
    }
}

// Adjusted function to handle Enter keypress
function handleEnterKeyPress(event, inputId) 
{
    if(event.key === 'Enter') 
    {
        event.preventDefault();
        evaluateInputOnBlur(inputId);
        event.target.blur(); 
    }
}
/*
Name: Zach Rojas, Kaelin Wang Hu
Date: 11/27/2023
Last Edit: 11/29/2023
Desc: Handles the formatting for the day schedule
*/


//Generate things

//Time scale
let startTime = 0;
let endTime = 24;

let dayContainer;



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
    dayContainer = document.createElement('div');
    dayContainer.classList.add("day-container");
    dayContainer.setAttribute('id', 'day-container');
    dayContainer.addEventListener("mousemove", function(event) {
        lineFollow(event);
    });
    let line = document.getElementById('line');
    dayContainer.appendChild(line);

    

    // Add the day container to the schedule body
    scheduleBody.appendChild(dayContainer);

    // Create Lines to show the hour things
    generateTimeMeasuerments(dayContainer);
    // generate new lines on resize
    window.addEventListener("resize", function(event) {
        generateTimeMeasuerments();
        console.log("Window Resized");
    });
}

function generateTimeMeasuerments()
{
    const currentLines = document.getElementsByClassName('measurement-line');
    while(currentLines.length > 0)
    {
        currentLines[0].parentNode.removeChild(currentLines[0]);
    }

    for (let i = 1; i < endTime - startTime; i++)
    {
        let line = document.createElement('div');
        line.classList.add('measurement-line');
        let max = parseInt(dayContainer.offsetWidth);
        line.style.left = `${i * ((parseInt(dayContainer.offsetWidth)) / (endTime - startTime))}px`;
        dayContainer.appendChild(line);   
    }
}

window.onload = function() 
{
    startTime = 0;
    endTime = 24;
    initializeInputListeners();
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
    //generateSchedule(); // Reflect changes in the UI
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
    //generateSchedule();
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

function initializeInputListeners() 
{
    // Get the input elements
    let startTimeInput = document.getElementById('startTime');
    let endTimeInput = document.getElementById('endTime');

    // Add event listener for the 'input' event to the start time input
    startTimeInput.addEventListener('input', function() 
    {
        validateAndSetTime('startTime', this.value); // Call validateAndSetTime when the value changes
    });

    // Add event listener for the 'input' event to the end time input
    endTimeInput.addEventListener('input', function() 
    {
        validateAndSetTime('endTime', this.value); // Call validateAndSetTime when the value changes
    });
}

// Validation and setting of time
function validateAndSetTime(inputId, value) 
{
    let time = parseInt(value, 10);

    if(inputId === 'startTime') 
    {
        if (!isNaN(time) && time >= 0 && time < endTime) 
        {
            setStartTime(time); // Update the start time if within valid range
        } 
        else 
        {
            // Reset to the previous valid value if out of range
            document.getElementById('startTime').value = startTime;
        }
    } else if(inputId === 'endTime') 
    {
        if (!isNaN(time) && time > startTime && time <= 24) 
        {
            setEndTime(time); // Update the end time if within valid range
        } 
        else 
        {
            // Reset to the previous valid value if out of range
            document.getElementById('endTime').value = endTime;
        }
    }
}


function lineFollow(event)
{
    let line = document.getElementById('line');
    let debugBox = document.getElementById('debugBox');

    //console.log(parseInt(dayContainer.offsetWidth));
    line.style.left = `${event.clientX - parseInt(getComputedStyle(dayContainer).getPropertyValue('left')) - 10 }px`; //mousPos - % left

    //Gets the selected time based on mouse position
    let current = event.clientX - parseInt(getComputedStyle(dayContainer).getPropertyValue('left')) - 10;
    let max = parseInt(dayContainer.offsetWidth);
    console.log(max);
    let percent = Math.floor((current / max) * 100) + 1;
    let selectedHour = ((endTime - startTime) * percent / 100) + startTime;
    selectedHour = Math.floor(selectedHour * 4) / 4;
    debugBox.innerHTML = selectedHour;
    

}
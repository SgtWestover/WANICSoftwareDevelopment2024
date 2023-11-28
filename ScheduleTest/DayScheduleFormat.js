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
    //get the schedule body
    let scheduleBody = document.getElementById('scheduleBody');
    scheduleBody.innerHTML = '';
    //generate time blocks
    for(let i = startTime; i < endTime; i++)
    {
        
        //create a container for a time block element
        let timeBlockContainer = document.createElement('div');
        timeBlockContainer.classList.add("time-block-container");
        timeBlockContainer.style.width = `${100 / (endTime - startTime)}%` //100 / (endTime - startTime);
        
        //create a time block element
        let timeBlock = document.createElement('div');
        timeBlock.innerHTML = i + 1;
        timeBlock.classList.add('time-block');

        //add elements to document    
        timeBlockContainer.appendChild(timeBlock);
        scheduleBody.appendChild(timeBlockContainer);
    }
}



//Name: Zach Rojas and Kaelin Wang Hu
//Date Created: 12/7/2023
//Last Modified: 12/14/2023
//Desc: Handles classes for calendar events, teams, and users

(function(exports)
{
    //Event class for an event on the calendar
    class CalendarEvent 
    {
        constructor(id, users, name, startDate, endDate, description, location = null) 
        {
            this.id = id;
            this.users = users;
            this.name = name;
            this.startDate = startDate;
            this.endDate = endDate;
            this.description = description;
            this.location = location;
        }
        
        // Getter for name
        get name() 
        {
            return this._name;
        }
        // Setter for name
        set name(value) {
            this._name = value;
        }

        // Getter for start date
        get startDate() 
        {
            return this._startDate;
        }
        // Setter for start date
        set startDate(value) 
        {
            this._startDate = value;
        }

        // Getter for end date
        get endDate() 
        {
            return this._endDate;
        }
        // Setter for end date
        set endDate(value) 
        {
            this._endDate = value;
        }

        // Getter for location
        get location() 
        {
            return this._location;
        }
        // Setter for location
        set location(value) 
        {
            this._location = value;
        }

        // Getter for description
        get description() 
        {
            return this._description;
        }
        // Setter for description
        set description(value) 
        {
            this._description = value;
        }

        // Getter for teams
        get teams() 
        {
            return this._teams;
        }

        // Setter for teams
        set teams(value) 
        {
            this._teams = value;
        }

        // Getter for users
        get users() 
        {
            return this._users;
        }

        // Setter for users
        set users(value)
        {
            this._users = value;
        }

        get id()
        {
            return this._id;
        }

        set id(value)
        {
            this._id = value;
        }
    }


    //Team class for the teams that users can create and join
    class CalendarTeam 
    {
        constructor(id, name, description, users, joinCode, usersQueued, autoJoin, joinPerms, notifications = {}, announcements = [])
        {
            this.id = id;
            this.name = name;
            this.description = description;
            this.users = users;
            this.joinCode = joinCode;
            this.usersQueued = usersQueued;
            this.autoJoin = autoJoin;
            this.joinPerms = joinPerms;
            this.notifications = notifications;
            this.announcements = announcements;
        }

        // Getter for name
        get name() 
        {
            return this._name;
        }
        // Setter for name
        set name(value) 
        {
            this._name = value;
        }

        // Getter for description
        get description() 
        {
            return this._description;
        }
        // Setter for description
        set description(value) 
        {
            this._description = value;
        }

        // Getter for users
        get users() 
        {
            return this._users;
        }
        // Setter for users
        set users(value) 
        {
            this._users = value;
        }

        // Getter for id
        get id() 
        {
            return this._id;
        }
        // Setter for id
        set id(value) 
        {
            this._id = value;
        }
        get joinCode()
        {
            return this._joinCode;
        }
        set joinCode(value)
        {
            this._joinCode = value;
        }
        get usersQueued()
        {
            return this._usersQueued;
        }
        set usersQueued(value)
        {
            this._usersQueued = value;
        }
        get autoJoin()
        {
            return this._autoJoin;
        }
        set autoJoin(value)
        {
            this._autoJoin = value;
        }
        get joinPerms()
        {
            return this._joinPerms;
        }
        set joinPerms(value)
        {
            this._joinPerms = value;
        }
        get notifications()
        {
            return this._notifications;
        }
        set notifications(value)
        {
            this._notifications = value;
        }
        get announcements()
        {
            return this._announcements;
        }
        set announcements(value)
        {
            this._announcements = value;
        }
    }

    // Calendar event for specifically teams with extra features built in to facilitate communication, coordination, and cooperation
    class CalendarTeamEvent 
    {
        constructor(id, team, users, permissions, viewable, history, name, startDate, endDate, description, location = null) 
        {
            this.id = id;
            this.team = team;
            this.users = users;
            this.permissions = permissions;
            this.viewable = viewable;
            this.history = history;
            this.name = name;
            this.startDate = startDate;
            this.endDate = endDate;
            this.description = description;
            this.location = location;
        }
        // Getter for team
        get team()
        {
            return this._teams;
        }
        // Setter for team
        set team(value)
        {
            this._team = value;
        }

        // Getter for permissions 
        get permissions()
        {
            return this._permissions;

        }
        // Setter for permissions
        set permissions(value)
        {
            this._permissions = value;
        }

        // Getter for viewable
        get viewable()
        {
            return this._viewable;
        }
        // Setter for viewable
        set viewable(value)
        {
            this._viewable = value;
        }

        //Getter for history
        get history()
        {
            return this._history;
        }
        // Setter for history
        set history(value)
        {
            this._history = value;
        }

        // Getter for name
        get name() 
        {
            return this._name;
        }
        // Setter for name
        set name(value) 
        {
            this._name = value;
        }

        // Getter for start date
        get startDate() 
        {
            return this._startDate;
        }
        // Setter for start date
        set startDate(value) 
        {
            this._startDate = value;
        }

        // Getter for end date
        get endDate() 
        {
            return this._endDate;
        }
        // Setter for end date
        set endDate(value) 
        {
            this._endDate = value;
        }

        // Getter for location
        get location() 
        {
            return this._location;
        }
        // Setter for location
        set location(value) 
        {
            this._location = value;
        }

        // Getter for description
        get description() 
        {
            return this._description;
        }
        // Setter for description
        set description(value) 
        {
            this._description = value;
        }

        // Getter for teams
        get teams() 
        {
            return this._teams;
        }

        // Setter for teams
        set teams(value) 
        {
            this._teams = value;
        }

        // Getter for users
        get users() 
        {
            return this._users;
        }

        // Setter for users
        set users(value)
        {
            this._users = value;
        }

        get id()
        {
            return this._id;
        }

        set id(value)
        {
            this._id = value;
        }
    }

    //general user class
    class User 
    {
        constructor(name, password, events = null, teams = null, settings = null, friends = null, id = null, timezone = null, notifications = {}) 
        {
            this.name = name;
            this.password = password;
            this.events = events; //array of event classes
            this.teams = teams; //array of team classes
            this.settings = settings;
            this.friends = friends; //array of users
            this.id = id;
            this.timezone = timezone;
            this.notifications = notifications;
        }
        // Getter for name
        get name() 
        {
            return this._name;
        }
        // Setter for name
        set name(value) 
        {
            this._name = value;
        }

        // Getter for password
        get password() 
        {
            return this._password;
        }
        // Setter for password
        set password(value) 
        {
            this._password = value;
        }

        // Getter for events
        get events() 
        {
            return this._events;
        }
        // Setter for events
        set events(value) 
        {
            this._events = value;
        }

        // Getter for teams
        get teams() 
        {
            return this._teams;
        }
        // Setter for teams
        set teams(value) 
        {
            this._teams = value;
        }

        // Getter for settings
        get settings() 
        {
            return this._settings;
        }
        // Setter for settings
        set settings(value) 
        {
            this._settings = value;
        }

        // Getter for friends
        get friends() 
        {
            return this._friends;
        }
        // Setter for friends
        set friends(value) 
        {
            this._friends = value;
        }

        // Getter for id
        get id() 
        {
            return this._id;
        }
        // Setter for id
        set id(value) 
        {
            this._id = value;
        }

        get notifications()
        {
            return this._notifications;
        }

        set notifications(value)
        {
            this._notifications = value;
        }
    }

    class EventTimes
    {
        constructor(eventId, startTime, endTime)
        {
            this.eventId = eventId;
            this.startTime = startTime;
            this.endTime = endTime;
        }

    }

    if (typeof module !== 'undefined' && module.exports) 
    {
        // Node.js Context
        module.exports = { CalendarEvent, User, CalendarTeam, CalendarTeamEvent, EventTimes };
    } 
    else 
    {
        // Browser Context
        exports.User = User;
        exports.CalendarEvent = CalendarEvent;
        exports.CalendarTeam = CalendarTeam;
        exports.CalendarTeamEvent = CalendarTeamEvent;
        exports.EventTimes = EventTimes;
    }
}) (typeof window === 'undefined' ? module.exports : window);



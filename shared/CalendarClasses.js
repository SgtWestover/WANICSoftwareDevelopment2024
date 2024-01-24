//Name: Zach Rojas and Kaelin Wang Hu
//Date Created: 12/7/2023
//Last Modified: 12/14/2023
//Desc: Handles classes for calendar events, teams, and users

(function(exports)
{
    //Event class for an event on the calendar
    class CalendarEvent 
    {
        constructor(id, users, name, startDate, endDate, description, location = null, teams = null) 
        {
            this.id = id;
            this.users = users;
            this.name = name;
            this.startDate = startDate;
            this.endDate = endDate;
            this.description = description;
            this.location = location;
            this.teams = teams;
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
        constructor(id, name, description, users, joinCode, usersQueued, autoJoin, autoJoinPerms)
        {
            this.id = id;
            this.name = name;
            this.description = description;
            this.users = users;
            this.joinCode = joinCode;
            this.usersQueued = usersQueued;
            this.autoJoin = autoJoin;
            this.autoJoinPerms = autoJoinPerms;
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
        get autoJoinPerms()
        {
            return this._autoJoinPerms;
        }
        set autoJoinPerms(value)
        {
            this._autoJoinPerms = value;
        }
    }


    //general user class
    class User 
    {
        constructor(name, password, events = null, teams = null, settings = null, friends = null, id = null, teamNotifications = null, timezone = null) 
        {
            this.name = name;
            this.password = password;
            this.events = events; //array of event classes
            this.teams = teams; //array of team classes
            this.settings = settings;
            this.friends = friends; //array of users
            this.teamNotifications = teamNotifications;
            this.id = id;
            this.timezone = timezone;
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

        get teamNotifications()
        {
            return this._teamNotifications;
        }
        set teamNotifications(value)
        {
            this._teamNotifications = value;
        }
    }
    if (typeof module !== 'undefined' && module.exports) 
    {
        // Node.js Context
        module.exports = { CalendarEvent, User, CalendarTeam };
    } 
    else 
    {
        // Browser Context
        exports.User = User;
        exports.CalendarEvent = CalendarEvent;
        exports.CalendarTeam = CalendarTeam;
    }
}) (typeof window === 'undefined' ? module.exports : window);
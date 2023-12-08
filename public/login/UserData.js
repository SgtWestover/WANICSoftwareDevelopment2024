//Name: Zach Rojas and Kaelin Wang Hu
//Date Created: 12/7/2023
//Last Modified: 12/7/2023
//Desc: Handles user data

//Event class for an event on the calendar
class Event 
{
    constructor(name, date, location, description, teams, users) 
    {
        this.name = name;
        this.date = date;
        this.location = location;
        this.description = description;
        this.teams = teams;
        this.users = users;
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

    // Getter for date
    get date() 
    {
        return this._date;
    }
    // Setter for date
    set date(value) 
    {
        this._date = value;
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
}


//Team class for the teams that users can create and join
class Team 
{
    constructor(name, description, users, id, permissions) 
    {
        this.name = name;
        this.description = description;
        this.users = users;
        this.id = id;
        this.permissions = permissions;
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
}


//general user class
class User 
{
    constructor(name, password, events, teams, settings, friends, id) 
    {
        this.name = name;
        this.password = password;
        this.events = events;
        this.teams = teams;
        this.settings = settings;
        this.friends = friends;
        this.id = id;
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
}

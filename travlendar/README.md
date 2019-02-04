# Travlendar
> Calendar management application and travel time creator | ASU SER517 Fall 2017 & SER518 Spring 2018: Team 1

## Team members
>
- Cephas Armstrong-Mensah ([@carmstr7](https://github.com/carmstr7) | carmstr7 | carmstr7@asu.edu)
- David Henderson ([@david-henderson](https://github.com/david-henderson) | dchende2 | davidhenderson@asu.edu)
- Gary Morris ([@gamorri1](https://github.com/gamorri1) | gamorri1 | gamorri@asu.edu)
- Jason Rice ([@jasonrice](https://github.com/JasonRice) | jarice6 | jarice6@asu.edu)
- Joe Michaels ([@jrmicha1](https://github.com/jrmicha1) | jrmicha1 | jrmicha1@asu.edu)
- Jessica Liu ([@jessicaorange](https://github.com/jessicaOrange) | jliu311 | jessica.liu.talk@gmail.com)

## Installing Travlendar
*For convenience, add these tools to your PATH, if you would like to follow the run instructions below*
>
- Install [MongoDB v3.4.10+](https://docs.mongodb.com/manual/installation/)
- Install [NodeJS v8.4.0+](https://nodejs.org/en/download/)
- Use NPM to install [Express-generator v4.15.5+](https://www.npmjs.com/package/express-generator) and [Angular-CLI v1.5.0+](https://github.com/angular/angular-cli)
- Run NPM install in ./server and ./travlendar-ui separately

## Running Travlendar
*Please note that the following instructions are to run Travlendar in development mode. Production is live at [Travlendar.me](https://travlendar.me/home).*

The reason for this distinction is because we have seperate credentials for development and production with Google for security and encryption purposes.

### Database (MongoDB)
Start up the MongoDB process or daemon https://docs.mongodb.com/manual/tutorial/manage-mongodb-processes/ 

```
mongod --dbpath <path to your /data/ path>
```

### Backend
In the ./server folder run the following command to start the server on port 3030 by default.

```
npm start
```

### Frontend

In the ./travlendar-ui folder run the following command to start the user interface on port 4200 as a webserver to serve Angular files.

```
ng serve
```

### Consume as a user
Open up a browser and goto the below URL to bring up the user interface.

```
localhost:4200
```

Note that popup blocks may block the Google OUATH dialog upon signing in, be sure to keep an eye out to allow it. In Chrome, for example, at the top right in the omnibar, click the icon and "Always allow popups from (Travlendar)".
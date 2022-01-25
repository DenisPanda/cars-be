# CARS-BE

Small BE written in ExpressJS + MongoDB

# WARNING
App won't work without the required env files.
Update .env file with the following required vars: 

> JWT_SECRET ; MONGO_USER ; MONGO_PASSWORD ;


# Build/run commands
Everything you need to run the app

## NPM install
Install packages like any other js app. There is a 'postinstall' script defined which will compile the code after all packages are installed (into dist folder)

    npm install



## Start quick
Run the app in transpile-on-the-fly mode (ts-node-dev).
Use in dev only.

    npm run start-quick

## Start
Run the compiled app from dist folder

    npm run start

## Watch ts
Listen to changes. Recompiles the app

    npm run watch-ts

## Watch node
Listen to changes. Please **rebuild app** to see changes or start watch ts in another shell.

    npm run watch-node

## Deploy
Deploy app to Heroku. (Please **login into heroku** before)

    npm run watch-node




# File structure

App folder structure isn't done. Needs a code refactor. All src code should be migrated into a dedicated src folder.

## CORE
App initialisation. Maybe it would  be a good idea to put express initialisation code into another separate file like app.ts or express.ts. Food for thought. Currently needs a refactor.	

Location: 

    /index.ts
    
## DB
DB initialisation code. Place migrations and DB specific code.

Location: 

    /db

## Models
Place models && model related schema into here.

Location:

    /models

## Logs
Winston log output.

Location:

    /logs


## Controllers

#TODO: Migrate endpoint defs to dedicated controller files. Currently everything is crammed up in the CORE.


## Utils
Utility functions (mostly app && logging)

Location:

    /utils
    
## Config
Config variables used through the app

Location:

    /config.ts
    
## Middleware
All middleware defined in the app.

Location:

    /middleware
Use the jwt file to exclude certain endpoints for JWT token checks

Location:

    /middleware/jwt

## Postman
Exported postman collection with all available endpoints.
Location:

    /.postman



# Features

 - Typescript
 - Login user (bcrypt used for digest)
 - Create user
 - Get vehicles (sorting, pagination, search)
 - Create vehicle
 - Autocomplete search vehicle WIP (only make & model fields together, uses mongo autocomplete feature)
 - Logging with Morgan middleware and Winston (only error and combined are outputed to a file, currently logging level is fixed to 'info')
 - JWT token authentification (HS256)

# TODOS
 - Add tests
 - Refactor controllers into dedicated files
 - Finish autocomplete control
 - Add logging level variables to env file
 - Implement CI/CD
 - Add migration utility
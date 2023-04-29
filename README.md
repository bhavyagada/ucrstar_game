# UCR Star Game

# for development (mac)

## setup pre-requisites
Install homebrew package manager to make installations/upgrades easier
```console
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
then install node, python3
```console
brew install node python@3.11
```
and mongoDB
```console
brew tap mongodb/brew
brew install mongodb-community
```

## import sample questions (data.json) into mongoDB
Navigate to the subdirectory ```server/``` and run
```console
mongoimport -d ucrstar -c game --file data.json --jsonArray --drop
```
Alternatively, the MongoDB Compass GUI application can be used.<br>
Create a database ```ucrstar```, add a collection ```game``` to it and use the "ADD DATA" button to import the ```data.json``` file.

## start the client
Move to the subdirectory ```client/```
### install dependencies and run locally
Run the following commands
```console
npm install
npm start
```
### env files
In the ```client/``` subdirectory, create ```.env.development``` and ```.env.production``` to store environment specific variables to be used in the application.
For now, it only contains the following keys: <br>
VITE_BASE_URL="http://localhost:8000" (for development) and <br>
VITE_GMAPS_API="API_KEY" (for google maps search) <br>
but more can be added later.

## start the server
Move to the subdirectory ```server/```
### install dependencies and run locally
Run the following commands
```console
pip install -r requirements.txt
python3 -m http.server --cgi
```

# for production
Note: MongoDB should be installed with the sample questions as mentioned in the "for development" section above.
## to build the client
Move to the subdirectory ```client/``` and run
```console
npm run build
```
This will create a ```dist``` directory.
The entire ```dist``` directory is supposed to be copied to the production server.

## to see how the app looks
Move to the subdirectory ```client/``` and run
```console
npm run serve
```
then open [http://localhost:3000/](http://localhost:3000/) to see how the application will look in production

## for the server
## for production
Move to the subdirectory ```server/```,<br>
The files inside the ```cgi-bin``` directory can be copied to the ```cgi-bin``` directory on the web server.<br>
The URL in the client .env files might need to be changed accordingly.

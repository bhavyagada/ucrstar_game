# UCR Star Game

# client

## install dependencies and run locally

```console
npm install
npm start
```

## env files

Create ```.env.development``` and ```.env.production``` to store environment specific variables to be used in the application.  
For now, it only contains the key VITE_API_URL (localhost:8000 for development), but more can be added later.

## to build for production

```console
npm run build
```
This will create a ```dist``` directory which can be deployed to production server.

## to see how the app looks

```console
npm run serve
```
then open [http://localhost:3000/](http://localhost:3000/) to see how the application will look in production

# server

## install dependencies and run locally

```console
pip3 install -r requirements.txt
python3 -m http.server --cgi
```

## for production

the files in ```server/cgi-bin``` can be saved in the ```cgi-bin``` directory on the web server.<br>
The URL in the client .env files might need to be changed accordingly.

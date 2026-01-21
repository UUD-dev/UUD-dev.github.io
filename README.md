# Plugin SETUP:

## Enable WebSocket Server from the settings as follows:

	Servers/Clients
		Websocket Server

## Configure with the following settings:

	Auto Start: On
	Address: 127.0.0.1
	Port:8080
	Endpoint: /
	Authentication: Enabled (password:'password')

## Test the connection:

	Navigate to: https://UUD-dev.github.io

If your Streamer.bot broadcaster accounts and bot accounts are setup correctly you should now be forwarding chat messages between Twitch / YouTube. And you should see a notification: 
	
	"SUCCESS: Websocket connection connected! (localhost:8080)"

## How to use the plugin:

	1. Keep using this web resource (requires URL to be open in browser to work, this works but isnt ideal if you dont want the extra browser window)
	2. Add the URL to OBS as a browser source (will load and run automatically with OBS, will require to stay loaded if you switch scenes. this works but not really optimal)
	3. Download the repo and run index.html locally. (works the same as opening the URL only it is hosted locally on your computer)
	4. Download and run dedicated nodejs client (allows access to local files for saving logs. Will run in a command prompt window)

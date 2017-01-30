# who-is-typing-puhser
This applications shows how to integrate Pusher with a Javascript application to implement a who is typing feature.

# Requirements

- [A free Pusher account](https://pusher.com)
- [Node.js](https://nodejs.org/en/download/) version 5 or greater

# Installation
1. Create an app on Pusher and copy your app's id, key, and secret.
2. Clone this repository and `cd` into it.
4. Execute `npm install` to download dependencies.
5. Execute `PUSHER_APP_ID=XXXXXX PUSHER_APP_KEY=XXXXXX PUSHER_APP_SECRET=XXXXXX node server.js` to set the environment variables needed by the app with your Pusher info and start it.
6. Go to `http://localhost:3000` and start playing with the app. You can open multiple tabs and type on each tab to know who is typing.

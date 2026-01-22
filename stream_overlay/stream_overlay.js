const userColors = new Map();
const MAX_MESSAGES = 50; // adjust for your overlay size


///////////////////////////////////////
//CONNECTING TO THE STREAMER.BOT CLIENT
///////////////////////////////////////
const client = new StreamerbotClient({

    //sicne we are hosting the file locally we dont need an ip, leave as 'localhost' or '127.0.0.1'
    host: '127.0.0.1',

    //the port we used in Streamer.bot's websocket settings.
    port: 8080, 

    //dont change
    endpoint: '/', 

    onError: (err) => {
        console.log("ERROR\m",err)
        displayAlertMessage(
            `[ERROR!] ${JSON.stringify(err)}`,
            ['alertError'],
            5
        );
    },
    onConnect: async (data) => {
        displayAlertMessage(
            'Chat Overlay Connected (v0.5.23)',
            ['alertConnected'],
            5
        );
    }

});

////////////////////////
//SUBSCRIPTION FUNCTIONS
////////////////////////


//This function runs when we detect a twitch chat message has been sent.
client.on('Twitch.ChatMessage', async (data) => {

    //set the username of the message sender.
    let username = data.data.user.name 

    // retreive the broadcaster information from Streamer.bot
    const response = await client.getBroadcaster(); 

    //This loops through all active streaming platforms (Twitch, YouTube)
    for (i in response.platforms){

        //checks for bot user's for all active streams (UUDbot)
        let botUser = response.platforms[i].botUserName 

        //checks for the broadcasters username in all active streams (UUDvideogames)
        let broadcastUser = response.platforms[i].broadcastUserName 
        
        //If we find a bot match, discard the message.
        if (username == botUser){
            console.log("USER MATCH BOT ACCOUNT, IGNORING",username) 
            return
        }

        //If we find a broadcaster match, discard the message.
        if (username == broadcastUser){
            console.log("USER MATCH BROADCAST ACCOUNT, IGNORING",username) 
            return
        }
    }
    
    // Send the chat data to our function to handle displaying twitch messages in the overlay.
    displayTwitchChatMessage(data.data)				
});

//This function runs when we detect a youtube chat message has been sent.
client.on('YouTube.Message', async (data) => {
    
    //set the username of the message sender.
    let username = data.data.user.name

    // retreive the broadcaster information from Streamer.bot
    const response = await client.getBroadcaster();

    //This loops through all active streaming platforms (Twitch, YouTube)
    for (i in response.platforms){

        //checks for bot user's for all active streams (UUDbot)
        let botUser = response.platforms[i].botUserName

        //checks for the broadcasters username in all active streams (UUDvideogames)
        let broadcastUser = response.platforms[i].broadcastUserName

        //If we find a bot match, discard the message.
        if (username == botUser){
            console.log("USER MATCH BOT ACCOUNT, IGNORING",botUser)
            return
        }

        //If we find a broadcaster match, discard the message.
        if (username == broadcastUser){
            console.log("USER MATCH BROADCAST ACCOUNT, IGNORING",botUser)
            return
        }
    }

    // Send the chat data to our function to handle displaying youtube messages in the overlay.
    displayYoutubeChatMessage(data.data)							   
});

client.on('YouTube.NewSubscriber', ({ event, data }) => {
    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);
    //set the username of the message sender.
    let username = data.data.user.name

    displayAlertMessage(
        `${username} just subscribed on YouTube!`,
        ['alertSub']
    );
    

    
});

client.on('YouTube.SuperChat', ({ event, data }) => {
    // Code here will run every time the event is received!
    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let username = data.data.user.name
    let message = data.data.message.message
    displayAlertMessage(
        `[SUPERCHAT] ${username}: ${message}`,
        ['alertSuperchat']
    );

});

client.on('Twitch.Follow', ({ event, data }) => {
    // Code here will run every time the event is received!
    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let username = data.user_name
    displayAlertMessage(
        `${username} Just Followed on Twitch!`,
        ['alertFollow']
    );

});

client.on('Twitch.Cheer', ({ event, data }) => {
    // Code here will run every time the event is received!
    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let username = data.user.name
    let bits = data.bits
    let message = data.message
    displayAlertMessage(
        `${username} Just cheered ${bits}Bits! (${message})`,
        ['alertCheer']
    );

});

client.on('Twitch.CoinCheer', ({ event, data }) => {
    // Code here will run every time the event is received!
    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let username = data.user.name
    let bits = data.bits
    let message = data.message
    
    displayAlertMessage(
        `${username} just cheered ${bits} Bits! (${message})`,
        ['alertCheer']
    );

});

client.on('Twitch.GiftBomb', ({ data }) => {
    const giftReceivers = data.recipients;

    giftReceivers.forEach(receiver => {
        displayAlertMessage(
        `${receiver.name} received a gifted sub!`,
        ['alertSub']
        );
    });

    displayAlertMessage(
        `${data.user} gave out ${giftReceivers.length} gifted subs!`,
        ['alertSub']
    );
});

client.on('Twitch.GiftSub', ({ event, data }) => {

    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let receiver = data.recipient.name
    let gifter = data.user.name

    displayAlertMessage(
        `${receiver} received a gifted sub from ${gifter}!`,
        ['alertSub']
    );

});

client.on('Twitch.ReSub', ({ event, data }) => {

    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let username = data.user.name
    let subLength = data.user.monthsSubscribed
    displayAlertMessage(
        `${username} just re-subscribed! (${subLength} months)`,
        ['alertSub']
    );

});

client.on('Twitch.RewardRedemption', ({ event, data }) => {
    // Code here will run every time the event is received!
    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let username = data.user.name
    let subLength = data.user.monthsSubscribed
    displayAlertMessage(
        `${username} redeemed a channel reward!`,
        ['alertReward']
    );
});

///////////////////
//MESSAGE FUNCTIONS
///////////////////

function createChatMessage({
  icon = null,
  username = null,
  color = null,
  message = '',
  classes = []
    }) {
    const container = document.createElement('div');
    container.classList.add('chat-message', ...classes);

    // Header (icon + username)
    if (icon || username) {
        const header = document.createElement('b');
        header.className = 'chat-header';

        if (icon) {
        const img = document.createElement('img');
        img.className = 'icon';
        img.src = icon;
        img.alt = '';
        header.appendChild(img);
        }

        if (username) {
        const nameSpan = document.createElement('span');
        nameSpan.textContent = username;
        if (color) nameSpan.style.color = color;
        header.appendChild(nameSpan);
        header.append(':');
        }

        container.appendChild(header);
    }

    // Message text
    if (message) {
        const messageSpan = document.createElement('span');
        messageSpan.className = 'message';

        if (Array.isArray(message)) {
            message.forEach(node => messageSpan.appendChild(node));
        } else {
            messageSpan.textContent = message;
        }

        container.appendChild(messageSpan);
    }


    return container;
}

function appendMessage(node, timeout = 0) {
  const messageId = generateMessageId();
  node.id = messageId;

  const chatBox = document.getElementById('messages');
  chatBox.appendChild(node);

  pruneMessages();

  chatBox.scrollTop = chatBox.scrollHeight;

  if (timeout > 0) {
    deleteMessage(messageId, timeout);
  }
}


function displayTwitchChatMessage(data) {
  const username = data.message.displayName;
  const chatColor = getOrAssignColor(username);
  const rawMessage = data.message.message;

  const parsedMessage = parseTwitchMessage(
    rawMessage,
    data.message.emotes
  );

  const classes = [];
  if (data.message.firstMessage) classes.push('firstmessage');
  if (data.message.isHighlighted) classes.push('highlighted');

  const messageNode = createChatMessage({
    icon: 'images/twitch.png',
    username,
    color: chatColor,
    message: parsedMessage,
    classes
  });

  appendMessage(messageNode);
}

function displayYoutubeChatMessage(data) {
  const username = data.user.name;
  const chatColor = getOrAssignColor(username);

  const messageNode = createChatMessage({
    icon: 'images/youtube.png',
    username,
    color: chatColor,
    message: data.message
  });

  appendMessage(messageNode);
}

function displayAlertMessage(text, extraClasses = [], timeout = 20) {
  const alertNode = createChatMessage({
    icon: 'images/alert.png',
    message: text,
    classes: ['alert', ...extraClasses]
  });

  appendMessage(alertNode, timeout);
}

//deletes messages via ID after x time
function deleteMessage(msgId, timeout){
    // Set the timer to remove the message
    if (timeout > 0){
        setTimeout(() => {
                const msgElement = document.getElementById(msgId);
                if (msgElement) {
                        console.log("REMOVING MESSAGE",msgId)
                        msgElement.remove(); // Or msgElement.style.display = 'none'; to hide it
                        // console.log(`Message ${messageId} removed.`);
                }
        }, 1000 * timeout); // in seconds
    }
    
}

//generate a random string to use as a message id (for automatic deletion)
function generateMessageId() {
    // Generate a random number between 0 and 16777215 (0xFFFFFF)
    const randomInt = Math.floor(Math.random() * 16777215);

    // Convert the number to a hexadecimal string
    let hexColor = randomInt.toString(16);

    // Pad the string with leading zeros if necessary to ensure 6 characters
    // '0'.repeat(6) creates a string of six zeros
    // Slice(-6) gets the last six characters (padding at the beginning)
    hexColor = `#${hexColor.padStart(6, '0')}`;
    
    return hexColor;
}

function generateUniqueColor(userId) {
    // Convert to string
    const str = userId.toString();

    // Create a numeric seed from character codes
    let seed = 0;
    for (let i = 0; i < str.length; i++) {
        seed += str.charCodeAt(i);
    }

    // Generate RGB using different multipliers for variety
    let r = (seed * 137) % 256;
    let g = (seed * 251) % 256;
    let b = (seed * 97) % 256;

    // Ensure decent visibility
    r = Math.max(r, 50);
    g = Math.max(g, 50);
    b = Math.max(b, 50);

    // Format to hex
    const hexColor =
        '#' +
        [r, g, b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');

    console.log('GENERATED COLOR:', hexColor);
    return hexColor;
}

function getOrAssignColor(userId) {
  if (userColors.has(userId)) {
    console.log("USER HAS COLOR:",userId,userColors.get(userId))
    return userColors.get(userId);
  } else {
    const color = generateUniqueColor(userId);
    console.log("GENERATED COLOR: ",color,userId)
    userColors.set(userId, color);
    return color;
  }
}

function pruneMessages() {
  const chatBox = document.getElementById('messages');
  const messages = chatBox.children;

  while (messages.length > MAX_MESSAGES) {
    chatBox.removeChild(messages[0]); // remove oldest
  }
}

function parseTwitchMessage(message, emotes) {
  if (!emotes || Object.keys(emotes).length === 0) {
    return [document.createTextNode(message)];
  }

  const fragments = [];
  const emotePositions = [];

  // Normalize emote data
  if (Array.isArray(emotes)) {
    // Array format
    emotes.forEach(e => {
      emotePositions.push({
        id: e.id,
        start: e.start,
        end: e.end
      });
    });
  } else {
    // Object format
    for (const emoteId in emotes) {
      const e = emotes[emoteId];

      // Single object
      if (typeof e.start === 'number') {
        emotePositions.push({
          id: emoteId,
          start: e.start,
          end: e.end
        });
      }

      // Array of positions
      else if (Array.isArray(e)) {
        e.forEach(pos => {
          emotePositions.push({
            id: emoteId,
            start: pos.start,
            end: pos.end
          });
        });
      }
    }
  }

  // Sort by position
  emotePositions.sort((a, b) => a.start - b.start);

  let cursor = 0;

  emotePositions.forEach(emote => {
    if (cursor < emote.start) {
      fragments.push(
        document.createTextNode(message.slice(cursor, emote.start))
      );
    }

    const img = document.createElement('img');
    img.src = `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0`;
    img.className = 'emote';
    img.alt = '';
    img.loading = 'lazy';

    fragments.push(img);

    cursor = emote.end + 1;
  });

  if (cursor < message.length) {
    fragments.push(
      document.createTextNode(message.slice(cursor))
    );
  }

  return fragments;
}

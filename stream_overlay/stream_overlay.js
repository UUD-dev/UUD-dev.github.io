const userColors = new Map();
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
        let message = 
        `
        <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage">[ERROR!] ${JSON.stringify(err)}</span></b></span>
        `
        displayTemporaryMessage(message)
    },
    onConnect: async (data) => {
        let message = 
        `
        <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage">[CONNECTED] Chat Overlay Connected (v0.3.4)</span></b></span>
        `
        displayTemporaryMessage(message)
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

    let alertMessage = 
    `
    <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage">${username} Just subscribed on YouTube!</span></b></span>
    `
    
    displayAlertMessage(alertMessage)

    
});

client.on('YouTube.SuperChat', ({ event, data }) => {
    // Code here will run every time the event is received!
    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let username = data.data.user.name
    let message = data.data.message.message
    let alertMessage = `
    <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage alertSuperchat">[SUPERCHAT] ${username} : ${message}</span></b></span>
    `

    displayAlertMessage(alertMessage)
});

client.on('Twitch.Follow', ({ event, data }) => {
    // Code here will run every time the event is received!
    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let username = data.user_name
    let alertMessage = 
    `
    <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage alertFollow">${username} Just Followed on Twitch!</span></b></span>
    `

    displayAlertMessage(alertMessage)

});

client.on('Twitch.Cheer', ({ event, data }) => {
    // Code here will run every time the event is received!
    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let username = data.user.name
    let bits = data.bits
    let message = data.message
    let alertMessage = 
    `
    <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage alertCheer">${username} Just cheered ${bits}Bits! (${message})</span></b></span>
    `

    displayAlertMessage(alertMessage)

});

client.on('Twitch.CoinCheer', ({ event, data }) => {
    // Code here will run every time the event is received!
    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let username = data.user.name
    let bits = data.bits
    let message = data.message
    let alertMessage = 
    `
    <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage alertCheer">${username} Just cheered ${bits}Bits! (${message})</span></b></span>
    `

    displayAlertMessage(alertMessage)

});

client.on('Twitch.GiftBomb', ({ event, data }) => {
    // Code here will run every time the event is received!
    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let giftReceivers = data.recipients
    for (i in giftReceivers){
        let username = i['name']
        let alertMessage = 
        `
        <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage alertCheer">${username} Received a gifted sub!</span></b></span>
        `

        displayAlertMessage(alertMessage)
    }
    let alertMessage = 
    `
    <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage alertCheer">${data.user} gave out ${giftReceivers.length} Gifted Subs!</span></b></span>
    `

    displayAlertMessage(alertMessage)
});

client.on('Twitch.GiftSub', ({ event, data }) => {

    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let receiver = data.recipient.name
    let gifter = data.user.name

    let alertMessage = 
    `
    <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage alertCheer">${receiver} Just scored a gifted sub from! ${gifter}</span></b></span>
    `

    displayAlertMessage(alertMessage)

});

client.on('Twitch.ReSub', ({ event, data }) => {

    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let username = data.user.name
    let subLength = data.user.monthsSubscribed
    let alertMessage = 
    `
    <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage alertCheer">${username} Just re-Subscribed! (${subLength} months)</span></b></span>
    `

    displayAlertMessage(alertMessage)

});

client.on('Twitch.RewardRedemption', ({ event, data }) => {
    // Code here will run every time the event is received!
    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let username = data.user.name
    let subLength = data.user.monthsSubscribed
    let alertMessage = 
    `
    <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage alertCheer">${username} Just re-Subscribed! (${subLength} months)</span></b></span>
    `

    displayAlertMessage(alertMessage)
});

///////////////////
//MESSAGE FUNCTIONS
///////////////////

function displayTwitchChatMessage(data) {
    let username = data.message.displayName
    const chatColor = getOrAssignColor(username);
    console.log("Chat Colour for ".username," : ",chatColor)
    let message = data.message.message

    let newMessageDiv = document.createElement('div');
    let messageId = generateMessageId()

    let firstMessage = data.message.firstMessage
    let isHighlighted = data.message.isHighlighted

    //check if this is a first time user!
    if (firstMessage){
        firstMessage = "firstMessage"
    }else{
        firstMessage = ""
    }

    if (isHighlighted){
        isHighlighted = "highlighted"
    }else{
        isHighlighted = ""
    }

    newMessageDiv.id = messageId

    //Creates HTML string to display.
    newMessageDiv.innerHTML = `
    <div class="chat-message">
        <b>
            <img class="icon" src="images/youtube.png">
            </img> 
            <span id="${username}" style="color:${chatColor}">
                ${username}
            </span>:
        </b>
        <span class="message">
            ${message}
        </span>
    </div>
    
    `;
    newMessageDiv.className = 'chat-message'; 
    var chatBox = document.getElementById('messages');
    chatBox.appendChild(newMessageDiv); 

    chatBox.scrollTop = chatBox.scrollHeight;
    deleteMessage(messageId, 0)

}

function displayYoutubeChatMessage(data) {
    let username = data.user.name
    const chatColor = getOrAssignColor(username);
    let message = data.message
    let newMessageDiv = document.createElement('div');
    let messageId = generateMessageId()
    newMessageDiv.id = messageId

    newMessageDiv.innerHTML = `
    <div class="chat-message">
        <b>
            <img class="icon" src="images/youtube.png">
            </img> 
            <span id="${username}" style="color:${chatColor}">
                ${username}
            </span>:
        </b>
        <span class="message">
            ${message}
        </span>
    </div>
    
    `;
    newMessageDiv.className = 'chat-message'; 
    var chatBox = document.getElementById('messages');

    chatBox.appendChild(newMessageDiv);

    if (data.message.isHighlighted){
        document.getElementById(messageId).style.backgroundColor = "#a12da5a4";	
    }

    chatBox.scrollTop = chatBox.scrollHeight;
    deleteMessage(messageId, 0)

}

function displayAlertMessage(message) {

    let newMessageDiv = document.createElement('div');
    let messageId = generateMessageId()
    newMessageDiv.id = messageId
    newMessageDiv.innerHTML = `
    <span class="message">${message}</span>`;

    newMessageDiv.className = 'chat-message';
    var chatBox = document.getElementById('messages');
    
    chatBox.appendChild(newMessageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    deleteMessage(messageId, 20)

}
function displayTemporaryMessage(message) {
console.log(message)
let newMessageDiv = document.createElement('div');
let messageId = generateMessageId()
newMessageDiv.id = messageId
newMessageDiv.innerHTML = `
<span class="message">${message}</span>`;

newMessageDiv.className = 'chat-message';
var chatBox = document.getElementById('messages');

chatBox.appendChild(newMessageDiv);
chatBox.scrollTop = chatBox.scrollHeight;

deleteMessage(messageId, 1)

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
  // Simple seeding for consistency, could be more robust
  let seed = userId.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  
  // Generate RGB components from the seed
  let r = (seed * 137) % 256; // Prime numbers help distribute colors
  let g = (seed * 251) % 256;
  let b = (seed * 31) % 256;
  
  // Ensure colors are reasonably bright (optional, but helpful)
  // This avoids very dark or muddy colors by boosting low values
  r = Math.max(r, 50); 
  g = Math.max(g, 50); 
  b = Math.max(b, 50); 
  
  // Convert to hex
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getOrAssignColor(userId) {
  if (userColors.has(userId)) {
    return userColors.get(userId);
  } else {
    const color = generateUniqueColor(userId);
    userColors.set(userId, color);
    return color;
  }
}

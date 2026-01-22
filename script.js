
const websocketport = 8080
const websockethost = '127.0.0.1'
var ignoreList = []
///////////////////////////////////////
//CONNECTING TO THE STREAMER.BOT CLIENT
///////////////////////////////////////

const client = new StreamerbotClient({

    //sicne we are hosting the file locally we dont need an ip, leave as 'localhost' or '127.0.0.1'
    host: websockethost,

    //the port we used in Streamer.bot's websocket settings.
    port: websocketport, 

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
        <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage">[CONNECTED] Client connected succesfully! (v0.3.3)</span></b></span>
        `
        displayTemporaryMessage(message)
        let excludedList = await updateExcluded()
        let ignoreListOutput = 
        `
        <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage">[UPDATE] Ignorelist : ${excludedList}</span></b></span>
        `
        displayTemporaryMessage(ignoreListOutput)

        setInterval(async() => {
            await updateExcluded()
        }, 1000*60*5);
    }
});

////////////////////////
//SUBSCRIPTION FUNCTIONS
////////////////////////

//This function runs when we detect a twitch chat message has been sent.
client.on('Twitch.ChatMessage', (data) => {
    
    //set the username of the message sender.
    let username = data.data.user.name

    //check to see if we should ignore this message
    for (let user in ignoreList){ 
        let ignoreUsername = username.toString().toLowerCase()
        let ignoreCheckname = ignoreList[user].toString().toLowerCase()
        console.log("CHECKING",ignoreUsername,"VS",ignoreCheckname)
        if (ignoreUsername == ignoreCheckname){ 
            console.log("IGNOREING USER:",username)
            return 
        }
    }

    //set the message of the message sender.
    let message = data.data.user.message

    //creating the message string EXAMPLE (   [User1234]: Hello stream!   )
    let messageString = `[${username}]: ${data.data.message.message}` 

    //send the message to youtube.
    sendYoutubeMessage(messageString)    
    
    // Send the chat data to our function to handle displaying twitch messages in the overlay.
    displayTwitchChatMessage(data.data)	
            
});           
//This function runs when we detect a youtube chat message has been sent.
client.on('YouTube.Message', (data) => {
    
    //set the username of the message sender.
    let username = data.data.user.name

    //check to see if we should ignore this message
    for (let user in ignoreList){ 
        let ignoreUsername = username.toString().toLowerCase()
        let ignoreCheckname = ignoreList[user].toString().toLowerCase()
        console.log("CHECKING",ignoreUsername,"VS",ignoreCheckname)
        if (ignoreUsername == ignoreCheckname){ 
            console.log("IGNOREING USER:",username)
            return 
        }
    }

    //set the message of the message sender.
    let message = data.data.user.message
    
    //creating the message string EXAMPLE (   [User1234]: Hello stream!   )
    let messageString = `[${username}]: ${data.data.message}`
    
    //send the message to twitch.
    sendTwitchMessage(messageString)
    
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

    console.log('Received event:', event.source, event.type);
    console.log('Event data:', data);

    let username = data.data.user.name
    let message = data.data.message.message
    let alertMessage = 
        `
        <b><img class="icon" src="images/alert.png"></img> <span class="alertMessage alertSuperchat">[SUPERCHAT] ${username} : ${message}</span></b></span>
        `
    displayAlertMessage(alertMessage)
});

client.on('Twitch.Follow', ({ event, data }) => {

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

async function sendTwitchMessage(message){
    await client.doAction(action = {name:"sendMessageToTwitch"}, args = {message:message});
}

async function sendYoutubeMessage(message){
    await client.doAction(action = {name:"sendMessageToYoutube"}, args = {message:message});
}

function displayTwitchChatMessage(data) {

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
    <span class="message ${firstMessage} ${isHighlighted}">
        <b><img class="icon" src="images/twitch.png"></img> <span class="username">${data.message.displayName}</span>:</b>
        ${data.message.message}</span>
    
    `;
    newMessageDiv.className = 'chat-message'; 
    var chatBox = document.getElementById('messages');
    
    chatBox.appendChild(newMessageDiv); 

    if (data.message.subscriber){
        document.getElementById(messageId).style.color = "#a304a8";	
    }
    if (data.message.isHighlighted){
        document.getElementById(messageId).style.backgroundColor = "#a12da5a4";	
    }

    chatBox.scrollTop = chatBox.scrollHeight;
    deleteMessage(messageId, 0)

}

function displayYoutubeChatMessage(data) {

    let newMessageDiv = document.createElement('div');
    let messageId = generateMessageId()
    newMessageDiv.id = messageId

    newMessageDiv.innerHTML = `
    <span class="message">
        <b><img class="icon" src="images/youtube.png"></img> <span class="username">${data.user.name}</span>:</b>
        ${data.message}</span>
    
    `;
    newMessageDiv.className = 'chat-message'; 
    var chatBox = document.getElementById('messages');

    chatBox.appendChild(newMessageDiv);

    if (data.message.subscriber){
        document.getElementById(messageId).style.color = "#a304a8";	
    }
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

    deleteMessage(messageId, 0)

}

function displayTemporaryMessage(message) {

    let newMessageDiv = document.createElement('div');
    let messageId = generateMessageId()
    newMessageDiv.id = messageId
    newMessageDiv.innerHTML = `
    <span class="message">${message}</span>`;

    newMessageDiv.className = 'chat-message';
    var chatBox = document.getElementById('messages');

    chatBox.appendChild(newMessageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    deleteMessage(messageId, 10)

}

function deleteMessage(msgId, timeout){
    if (timeout > 0){
        setTimeout(() => {
                const msgElement = document.getElementById(msgId);
                if (msgElement) {
                        console.log("REMOVING MESSAGE",msgId)
                        msgElement.remove(); // Or msgElement.style.display = 'none'; to hide it
                }
        }, 1000 * timeout); // in seconds
    }
    
}

function generateMessageId() {
    // Generate a random number between 0 and 16777215 (0xFFFFFF)
    const randomInt = Math.floor(Math.random() * 16777215);
    let hexColor = randomInt.toString(16);
    hexColor = `#${hexColor.padStart(6, '0')}`;
    return hexColor;
}

//////////////////
//HELPER FUNCTIONS
//////////////////

async function updateExcluded(){
    //reset the array
    ignoreList = ['Streamelements']
    // retreive the broadcaster information from Streamer.bot
    const response = await client.getBroadcaster(); 
    // console.log("response",response)
    // console.log(response.platforms)
    //This loops through all active streaming platforms (Twitch, YouTube)
    for (let i in response.platforms){

        if (response.platforms[i].botUserName){
            ignoreList.push(response.platforms[i].botUserName)
        }

        if (response.platforms[i].broadcastUserName){
            ignoreList.push(response.platforms[i].broadcastUserName)
        }
        
    }
    console.log("IGNORELIST : ",ignoreList)
    return ignoreList
}

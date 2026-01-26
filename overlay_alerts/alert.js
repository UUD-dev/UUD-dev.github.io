/////////
//GLOBALS
/////////

const popupQueue = [];
let isPopupActive = false;
const userColors = new Map();
const MAX_MESSAGES = 50; // adjust for your overlay size
var ignoreList = []

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
        console.log("ERROR\n",err)
        displayAlertMessage(
            `[ERROR!] ${JSON.stringify(err)}`,
            ['alertError'],
            5
        );
    },
    onConnect: async (data) => {
        console.log('connected')
        await updateExcluded()
        setInterval(async() => {
                    await updateExcluded()
                }, 1000*60*5);
        displayAlertMessage(
            'Alert Overlay Connected (v0.2.4.2)',
            ['alertConnected'],
            1
        );
    }

});

////////////////////////
//SUBSCRIPTION FUNCTIONS
////////////////////////

client.on('YouTube.NewSubscriber', ({ event, data }) => {
    // console.log('Received event:', event.source, event.type);
    // console.log('Event data:', data);
    //set the username of the message sender.
    let username = data.data.user.name

    displayAlertMessage(
        `${username} just subscribed on YouTube!`,
        ['alertSub']
    );   

    
});

client.on('YouTube.SuperChat', ({ event, data }) => {
    let username = data.data.user.name
    let message = data.data.message.message
    displayAlertMessage(
        `[SUPERCHAT] ${username}: ${message}`,
        ['alertSuperchat']
    );

});

client.on('Twitch.Follow', ({ event, data }) => {
    let username = data.user_name
    displayAlertMessage(
        `${username} Just Followed on Twitch!`,
        ['alertFollow']
    );

});

client.on('Twitch.Cheer', ({ event, data }) => {
    let username = data.user.name
    let bits = data.bits
    let message = data.message
    displayAlertMessage(
        `${username} Just cheered ${bits}Bits! (${message})`,
        ['alertCheer']
    );

});

client.on('Twitch.CoinCheer', ({ event, data }) => {
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
    let receiver = data.recipient.name
    let gifter = data.user.name

    displayAlertMessage(
        `${receiver} received a gifted sub from ${gifter}!`,
        ['alertSub']
    );

});

client.on('Twitch.ReSub', ({ event, data }) => {
    let username = data.user.name
    let subLength = data.user.monthsSubscribed
    displayAlertMessage(
        `${username} just re-subscribed! (${subLength} months)`,
        ['alertSub']
        );
});

// client.on('Twitch.RewardRedemption', ({ event, data }) => {
//     let username = data.user_name
//     let title = data.reward.title
//     displayAlertMessage(
//         `${username} redeemed ${title}!`,
//         ['alertReward'],
//     );   
// });

client.on('Raw.ActionCompleted', (data) => {
	if (data.data.name == "deathAdd"){
		activateDeathAdd(data.data)
	}
	if (data.data.name == "deathSubtract"){
		activateDeathSubtract(data.data)
	}
});

client.on('Command.Triggered', (data) => {
	console.log("COMMAND TRIGGERED:",data.data)
	switch (data.data.name) {
		case "setDeath":
			setDeathCount(data)
			break;
		case "TestCommand":
			playSound('audio/flashbang.mp3')
		case "Refresh":
			location.reload()
			break;
		default:
			console.log("unknown command trigger!")
			return
	}
	
});

client.on('Twitch.RewardRedemption', ({ event, data }) => {
    let username = data.user_name
    let title = data.reward.title
	let message = ""
	if (data.user_input){message = data.user_input}
	console.log('user_input',data.user_input)
	
	let messageString = `[${username}] ${message}`
	console.log(`${username} Redeemed ${title} with message: '${message}'`)
    switch (title) {
		case "Flashbang":
			flashBangActivate(data)
			break;
		case "Blackhole":
			blackoutActivate(data)
			break;
		case "Jumpscare":
			jumpscareActivate(data)
			break;
		case 'Fingerguns':
			queueStreamPopup(
				'images/FingerGuns.png',
				messageString,
				'audio/pewpew.mp3'
				);
			break;
		case 'Facepalm':
			queueStreamPopup(
				'images/Facepalm.png',
				messageString,
				'audio/facepalm.wav'
				);
			break;
		case 'Silly':
			queueStreamPopup(
				'images/Silly.png',
				messageString,
				'audio/Duh.wav'
				);
			break;
		case 'Saiyan':
			queueStreamPopup(
				'images/Saiyan.png',
				messageString,
				'audio/dbz.mp3'
				);
			break;
		case 'RIP':
			queueStreamPopup(
				'images/RIP.png',
				messageString,
				'audio/RIP.mp3'
				);
			break;
		default:
			break;
	}
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
        // header.append(':');
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

    const rawMessage = sanitizeChatText(
        data.message.message,
        { maxLength: 300 }
    );

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

    const safeMessage = sanitizeChatText(data.message, {
        maxLength: 300
    });

    const messageNode = createChatMessage({
        icon: 'images/youtube.png',
        username,
        color: chatColor,
        message: safeMessage
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
                        // console.log("REMOVING MESSAGE",msgId)
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
    // Convert to string to handle numbers or strings
    const str = userId.toString();

    // Create a simple numeric seed from character codes
    let seed = 0;
    for (let i = 0; i < str.length; i++) {
        seed += str.charCodeAt(i);
    }

    // Use the seed to generate a hue between 0-360
    const hue = seed % 360;

    // Set saturation and lightness to make the color vibrant but readable
    const saturation = 70; // 70% saturated
    const lightness = 55;  // 55% lightness

    // Return an HSL color string
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    // console.log('GENERATED COLOR:', color, 'for user:', userId);
    return color;
}


function getOrAssignColor(userId) {
  if (userColors.has(userId)) {
    // console.log("USER HAS COLOR:",userId,userColors.get(userId))
    return userColors.get(userId);
  } else {
    const color = generateUniqueColor(userId);
    // console.log("GENERATED COLOR: ",color,userId)
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
    if (!emotes || emotes.length === 0) {
        return [document.createTextNode(message)];
    }

    const fragments = [];

    // Normalize emotes into { id, name } objects
    const normalizedEmotes = [];

    if (Array.isArray(emotes)) {
        emotes.forEach(e => {
            if (typeof e === 'string') {
                normalizedEmotes.push({ id: e });
            } else if (typeof e === 'object' && e.id) {
                normalizedEmotes.push({ id: e.id, name: e.name });
            }
        });
    } else {
        // IRC-style object { id: ["0-4"] }
        return parseIrcStyleEmotes(message, emotes);
    }

    // Word-based parsing
    const tokens = message.split(/(\s+)/);

    tokens.forEach(token => {
        const emote = normalizedEmotes.find(e => e.name === token);

        if (emote) {
            const img = document.createElement('img');
            img.src = `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0`;
            img.className = 'emote';
            img.alt = token;
            img.loading = 'lazy';
            fragments.push(img);
        } else {
            fragments.push(document.createTextNode(token));
        }
    });

    return fragments;
}

function parseIrcStyleEmotes(message, emotes) {
    const fragments = [];
    const emotePositions = [];

    for (const emoteId in emotes) {
        const ranges = emotes[emoteId];
        if (!Array.isArray(ranges)) continue;

        ranges.forEach(range => {
            const [start, end] = range.split('-').map(Number);
            emotePositions.push({ id: emoteId, start, end });
        });
    }

    if (emotePositions.length === 0) {
        return [document.createTextNode(message)];
    }

    emotePositions.sort((a, b) => a.start - b.start);

    let cursor = 0;

    for (const emote of emotePositions) {
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
    }

    if (cursor < message.length) {
        fragments.push(
            document.createTextNode(message.slice(cursor))
        );
    }

    return fragments;
}


function sanitizeChatText(text, options = {}) {
    const {
        maxLength = 300,
        removeZeroWidth = true,
        normalizeWhitespace = true
    } = options;

    if (typeof text !== 'string') return '';

    let clean = text;

    // Remove zero-width & invisible characters
    if (removeZeroWidth) {
        clean = clean.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '');
    }

    // Remove bidi override characters (text direction exploits)
    clean = clean.replace(/[\u202A-\u202E\u2066-\u2069]/g, '');

    // Normalize whitespace
    if (normalizeWhitespace) {
        clean = clean.replace(/\s+/g, ' ').trim();
    }

    // Hard length limit (prevents lag spam)
    if (clean.length > maxLength) {
        clean = clean.slice(0, maxLength) + '…';
    }

    return clean;
}
  
async function updateExcluded(){
    //reset the array
    ignoreList = ['Streamelements', 'NightBot']
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
    // console.log("IGNORELIST : ",ignoreList)
    return ignoreList
}

/////////////////////////
//DEATH COUNTER FUNCTIONS
/////////////////////////

function activateDeathAdd(data){
	let element = document.getElementById("death-counter")
	element.innerHTML = parseInt(element.innerHTML) + 1
}
function activateDeathSubtract(data){
	let element = document.getElementById("death-counter")
	element.innerHTML = parseInt(element.innerHTML) + -1
}

function setDeathCount(data){
	console.log(data.data.message)
	let deathcount = data.data.message.replace(`${data.data.command} `,"")
	let element = document.getElementById("death-counter")
	element.innerHTML = parseInt(deathcount)
}

/////////////////
//ALERT FUNCTIONS
/////////////////

var flashbangDiv = document.getElementById('flashbang');
	flashbangDiv.style.backgroundColor = "#00000000";

function flashBangActivate(data) {

    var flashbangDiv = document.getElementById('flashbang');
	
	var flashbangMessage = document.getElementById('flashbangMessage');

    flashbangDiv.style.transition = 'none';
    flashbangDiv.style.backgroundColor = 'white';
	flashbangMessage.innerHTML = `[${data.user_name}]`
	playSound('audio/flashbang.mp3')
    setTimeout(() => {
		flashbangDiv.style.transition = 'background-color 5s ease-out';
        flashbangDiv.style.backgroundColor = "#00000000";
		flashbangMessage.style.transition = 'color 5s ease-out';
		flashbangMessage.style.color = "#00000000";
    }, 2000);
}

function blackoutActivate(data) {
    var blackoutDiv = document.getElementById('blackout');
	var blackoutMessage = document.getElementById('blackoutMessage')

    blackoutDiv.style.transition = 'none';
    blackoutDiv.style.backgroundColor = 'white';
	blackoutMessage.innerHTML = `[${data.user_name}]`
    blackoutDiv.style.backgroundColor = 'black';

    setTimeout(() => {
		blackoutDiv.style.transition = 'background-color 3s ease-out';
        blackoutDiv.style.backgroundColor = "#00000000";
		blackoutMessage.style.transition = 'color 3s ease-out';
		blackoutMessage.style.color = "#00000000";
    }, 5000);
}

function jumpscareActivate(data) {
    var jumpscareDiv = document.getElementById('jumpscare');
	var jumpscareMessage = document.getElementById('jumpscareMessage');

	playSound("audio/jumpscare.mp3")

    jumpscareDiv.style.transition = 'none';
    jumpscareDiv.style.opacity = '100%';
	jumpscareMessage.innerHTML = `[${data.user_name}]`
    jumpscareDiv.style.backgroundColor = 'black';

    setTimeout(() => {
		jumpscareDiv.style.transition = 'opacity 1s ease-out';
        jumpscareDiv.style.opacity = "0%";
		jumpscareMessage.style.transition = 'color 1s ease-out';
		jumpscareMessage.style.color = "#00000000";
    }, 1000);
}


function showStreamPopup(imageUrl, messageText, onComplete, soundUrl) {
	const root = document.getElementById('overlay-root');

	const container = document.createElement('div');
	container.className = 'stream-popup';

	const img = document.createElement('img');
	img.src = imageUrl;

	const message = document.createElement('div');
	message.className = 'message';
	message.textContent = messageText;

	container.appendChild(img);
	container.appendChild(message);
	root.appendChild(container);

	container.offsetHeight;

	// 🔊 PLAY SOUND WHEN POPUP ENTERS
	if (soundUrl) {
		playAlertSound(soundUrl, 0.8);
	}

	// Slide in
	container.classList.add('show');

	const visibleDuration = 10_000;
	const exitAnimationDuration = 500;

	setTimeout(() => {
		container.classList.remove('show');
		container.classList.add('hide');

		setTimeout(() => {
		onComplete?.();
		}, exitAnimationDuration);

	}, visibleDuration);

	// Cleanup (non-blocking)
	setTimeout(() => {
		container.remove();
	}, visibleDuration + exitAnimationDuration + 1000);
}

function playAlertSound(url, volume = 1.0) {
	const audio = new Audio(url);
	audio.volume = volume;
	audio.play().catch(err => {
		console.warn('Alert sound blocked:', err);
	});
}

function queueStreamPopup(imageUrl, messageText, soundUrl) {
	popupQueue.push({ imageUrl, messageText, soundUrl });
	processPopupQueue();
}


function processPopupQueue() {
	if (isPopupActive) return;
	if (popupQueue.length === 0) return;

	isPopupActive = true;
	const { imageUrl, messageText, soundUrl } = popupQueue.shift();

	showStreamPopup(imageUrl, messageText, () => {
		isPopupActive = false;
		processPopupQueue();
	}, soundUrl);
}

const userColors = new Map();
const MAX_MESSAGES = 50; // adjust for your overlay size

///////////////////////////////////////
// CONNECT TO STREAMER.BOT CLIENT
///////////////////////////////////////
const client = new StreamerbotClient({
    host: '127.0.0.1',
    port: 8080,
    endpoint: '/',
    onError: (err) => {
        console.log("ERROR\n", err);
        displayAlertMessage(`[ERROR!] ${JSON.stringify(err)}`, ['alertError'], 5);
    },
    onConnect: async () => {
        displayAlertMessage('Chat Overlay Connected (v0.5.25.1)', ['alertConnected'], 5);
    }
});

////////////////////////
// SUBSCRIPTION FUNCTIONS
////////////////////////

// Helper to filter bot/broadcaster messages
async function shouldIgnoreUser(username) {
    const response = await client.getBroadcaster();
    for (const platform of response.platforms) {
        if (username === platform.botUserName || username === platform.broadcastUserName) {
            console.log("Ignoring message from:", username);
            return true;
        }
    }
    return false;
}

// Twitch chat message
client.on('Twitch.ChatMessage', async ({ data }) => {
    if (await shouldIgnoreUser(data.user.name)) return;
    displayTwitchChatMessage(data);
});

// YouTube chat message
client.on('YouTube.Message', async ({ data }) => {
    if (await shouldIgnoreUser(data.user.name)) return;
    displayYoutubeChatMessage(data);
});

////////////////////////
// ALERT EVENTS
////////////////////////
client.on('YouTube.NewSubscriber', ({ data }) => {
    const username = data.user.name;
    displayAlertMessage(`${username} just subscribed on YouTube!`, ['alertSub']);
});

client.on('YouTube.SuperChat', ({ data }) => {
    const username = data.user.name;
    const message = data.message?.message || data.message;
    displayAlertMessage(`[SUPERCHAT] ${username}: ${message}`, ['alertSuperchat']);
});

client.on('Twitch.Follow', ({ data }) => {
    displayAlertMessage(`${data.user_name} just followed on Twitch!`, ['alertFollow']);
});

client.on('Twitch.Cheer', ({ data }) => {
    displayAlertMessage(`${data.user.name} cheered ${data.bits} Bits! (${data.message})`, ['alertCheer']);
});

client.on('Twitch.CoinCheer', ({ data }) => {
    displayAlertMessage(`${data.user.name} cheered ${data.bits} Bits! (${data.message})`, ['alertCheer']);
});

client.on('Twitch.GiftBomb', ({ data }) => {
    data.recipients.forEach(r => displayAlertMessage(`${r.name} received a gifted sub!`, ['alertSub']));
    displayAlertMessage(`${data.user} gave out ${data.recipients.length} gifted subs!`, ['alertSub']);
});

client.on('Twitch.GiftSub', ({ data }) => {
    displayAlertMessage(`${data.recipient.name} received a gifted sub from ${data.user.name}!`, ['alertSub']);
});

client.on('Twitch.ReSub', ({ data }) => {
    displayAlertMessage(`${data.user.name} just re-subscribed! (${data.user.monthsSubscribed} months)`, ['alertSub']);
});

client.on('Twitch.RewardRedemption', ({ data }) => {
    displayAlertMessage(`${data.user.name} redeemed a channel reward!`, ['alertReward']);
});

///////////////////
// MESSAGE FUNCTIONS
///////////////////

function createChatMessage({ icon = null, username = null, color = null, message = '', classes = [] }) {
    const container = document.createElement('div');
    container.classList.add('chat-message', ...classes);

    // Header
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

    if (timeout > 0) deleteMessage(messageId, timeout);
}

function displayTwitchChatMessage(data) {
    const username = data.message.displayName;
    const chatColor = getOrAssignColor(username);
    const rawMessage = data.message.message;
    const emotes = data.message.emotes;

    const parsedMessage = parseTwitchMessage(rawMessage, emotes);

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
    const messageText = data.message?.message || data.message;

    const node = createChatMessage({
        icon: 'images/youtube.png',
        username,
        color: chatColor,
        message: messageText
    });

    appendMessage(node);
}

function displayAlertMessage(text, extraClasses = [], timeout = 20) {
    const alertNode = createChatMessage({
        icon: 'images/alert.png',
        message: text,
        classes: ['alert', ...extraClasses]
    });

    appendMessage(alertNode, timeout);
}

function deleteMessage(msgId, timeout) {
    if (timeout > 0) {
        setTimeout(() => {
            const msgElement = document.getElementById(msgId);
            if (msgElement) msgElement.remove();
        }, 1000 * timeout);
    }
}

function generateMessageId() {
    return `msg_${Math.random().toString(36).substr(2, 9)}`;
}

function generateUniqueColor(userId) {
    let seed = 0;
    const str = userId.toString();
    for (let i = 0; i < str.length; i++) seed += str.charCodeAt(i);

    const hue = seed % 360;
    return `hsl(${hue}, 70%, 55%)`;
}

function getOrAssignColor(userId) {
    if (userColors.has(userId)) return userColors.get(userId);
    const color = generateUniqueColor(userId);
    userColors.set(userId, color);
    return color;
}

function pruneMessages() {
    const chatBox = document.getElementById('messages');
    while (chatBox.children.length > MAX_MESSAGES) chatBox.removeChild(chatBox.children[0]);
}

// Fixed Twitch emote parsing
function parseTwitchMessage(message, emotes) {
    if (!emotes || Object.keys(emotes).length === 0) return [document.createTextNode(message)];

    const fragments = [];
    const emotePositions = [];

    for (const emoteId in emotes) {
        const positions = emotes[emoteId]; // array of "start-end" strings
        positions.forEach(pos => {
            const [start, end] = pos.split('-').map(Number);
            emotePositions.push({ id: emoteId, start, end });
        });
    }

    emotePositions.sort((a, b) => a.start - b.start);

    let cursor = 0;
    emotePositions.forEach(emote => {
        if (cursor < emote.start) fragments.push(document.createTextNode(message.slice(cursor, emote.start)));

        const img = document.createElement('img');
        img.src = `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0`;
        img.className = 'emote';
        img.alt = '';
        fragments.push(img);

        cursor = emote.end + 1;
    });

    if (cursor < message.length) fragments.push(document.createTextNode(message.slice(cursor)));

    return fragments;
}

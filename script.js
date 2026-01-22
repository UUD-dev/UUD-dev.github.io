const websocketport = 8080;
const websockethost = '127.0.0.1';
const seenMessageIds = new Set();

///////////////////////////////////////
// CONNECTING TO STREAMER.BOT
///////////////////////////////////////

const client = new StreamerbotClient({
    host: websockethost,
    port: websocketport,
    endpoint: '/',

    onError: (err) => {
        console.error(err);
        displayTemporaryMessage(
            `<b><img class="icon" src="images/alert.png"> [ERROR!] ${JSON.stringify(err)}</b>`
        );
    },

    onConnect: async () => {
        displayTemporaryMessage(
            `<b><img class="icon" src="images/alert.png"> [CONNECTED]</b>`
        );

        await updateExcluded();

        setInterval(updateExcluded, 1000 * 60 * 5);
    }
});

////////////////////////
// CHAT EVENTS
////////////////////////

client.on('Twitch.ChatMessage', (data) => {
    const msg = data.data;

    const username = msg.user.name.toLowerCase();

    // 🔁 Deduplicate messages
    if (seenMessageIds.has(msg.message.id)) return;
    seenMessageIds.add(msg.message.id);

    // 🤖 Ignore bots (Streamer.bot flag)
    if (msg.user.isBot) return;

    // 🎥 Ignore broadcaster
    if (msg.user.isBroadcaster) return;

    // 🚫 Ignore known bots by name
    if (ignoreList.includes()) return;

    displayTwitchChatMessage(msg);
});


client.on('YouTube.Message', (data) => {
    const msg = data.data;
    const username = msg.user.name.toLowerCase();

    if (username === 'streamelements') return;

    displayYoutubeChatMessage(msg);
});

////////////////////////
// MESSAGE DISPLAY
////////////////////////

function displayTwitchChatMessage(data) {
    const div = document.createElement('div');
    div.className = 'chat-message';

    div.innerHTML = `
        <span class="message ${data.message.firstMessage ? 'firstmessage' : ''} ${data.message.isHighlighted ? 'highlighted' : ''}">
            <b><img class="icon" src="images/twitch.png"> 
            <span class="username">${data.message.displayName}</span>:</b>
            ${data.message.message}
        </span>
    `;

    document.getElementById('messages').appendChild(div);
}

function displayYoutubeChatMessage(data) {
    const div = document.createElement('div');
    div.className = 'chat-message';

    div.innerHTML = `
        <span class="message">
            <b><img class="icon" src="images/youtube.png"> 
            <span class="username">${data.user.name}</span>:</b>
            ${data.message}
        </span>
    `;

    document.getElementById('messages').appendChild(div);
}

function displayTemporaryMessage(html) {
    const div = document.createElement('div');
    div.className = 'chat-message';
    div.innerHTML = `<span class="message">${html}</span>`;

    document.getElementById('messages').appendChild(div);

    setTimeout(() => div.remove(), 10000);
}

////////////////////////
// HELPERS
////////////////////////

setInterval(() => seenMessageIds.clear(), 1000 * 60 * 10);


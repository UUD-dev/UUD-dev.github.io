const ver = "1.1.4"
const websocketport = 8080;
const websockethost = '127.0.0.1';
let ignoreList = [];

/////////////////////////
// CONNECTING TO STREAMER.BOT CLIENT
/////////////////////////

const client = new StreamerbotClient({
    host: websockethost,
    port: websocketport,
    endpoint: '/',
    onError: (err) => {
        console.log("ERROR", err);
        displayTemporaryMessage(
            `<b><img class="icon" src="images/alert.png"></img> <span class="alertMessage">[ERROR!] ${JSON.stringify(err)}</span></b>`
        );
    },
    onConnect: async () => {
        displayTemporaryMessage(
            `<b><img class="icon" src="images/alert.png"></img> <span class="alertMessage">[CONNECTED] Client connected successfully! (v${ver})</span></b>`
        );
        const excludedList = await updateExcluded();
        displayTemporaryMessage(
            `<b><img class="icon" src="images/alert.png"></img> <span class="alertMessage">[UPDATE] Ignorelist: ${excludedList}</span></b>`
        );

        // Refresh ignore list every 5 minutes
        setInterval(updateExcluded, 1000 * 60 * 5);
    }
});

/////////////////////////
// CHAT / ALERT HANDLERS
/////////////////////////

function isIgnored(username) {
    username = username.toLowerCase();
    return ignoreList.some(user => user.toLowerCase() === username);
}

function handleTwitchMessage(data) {
    const username = data.data.user.name;
    if (isIgnored(username)) return;

    const messageString = `[${username}]: ${data.data.message.message}`;
    sendYoutubeMessage(messageString);
    displayChatMessage(data.data, 'twitch');
}

function handleYoutubeMessage(data) {
    const username = data.data.user.name;
    if (isIgnored(username)) return;

    const messageString = `[${username}]: ${data.data.message}`;
    sendTwitchMessage(messageString);
    displayChatMessage(data.data, 'youtube');
}

function handleRewardRedemption(data){
    const username = data.data.user_name
    const title = data.data.reward.title
	let message = ""
	if (data.data.user_input){message = `: ${data.data.user_input}`}
	let messageString = `[${username} Redeemed ${title}]${message}`
    displayAlertMessage(messageString)
}

function handleTwitchFollow(data){
    console.log(data.data)
}
function displayChatMessage(data, platform) {
    const newMessageDiv = document.createElement('div');
    const messageId = generateMessageId();

    const firstMessage = data.message?.firstMessage ? "firstMessage" : "";
    const highlighted = data.message?.isHighlighted ? "highlighted" : "";

    let icon = platform === 'twitch' ? 'twitch.png' : 'youtube.png';
    let username = platform === 'twitch' ? data.message.displayName : data.user.name;
    let message = platform === 'twitch' ? data.message.message : data.message;

    newMessageDiv.id = messageId;
    newMessageDiv.className = 'chat-message';
    newMessageDiv.innerHTML = `
        <span class="message ${firstMessage} ${highlighted}">
            <b><img class="icon" src="images/${icon}"></img> <span class="username">${username}</span>:</b>${message}
        </span>
    `;

    const chatBox = document.getElementById('messages');
    chatBox.appendChild(newMessageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (data.message?.subscriber) newMessageDiv.style.color = "#a304a8";
    if (data.message?.isHighlighted) newMessageDiv.style.backgroundColor = "#a12da5a4";

    deleteMessage(messageId, 0);
}

function displayAlertMessage(message) {
    const newMessageDiv = document.createElement('div');
    const messageId = generateMessageId();
    newMessageDiv.id = messageId;
    newMessageDiv.className = 'chat-message';
    newMessageDiv.innerHTML = `<span class="message">${message}</span>`;
    const chatBox = document.getElementById('messages');
    chatBox.appendChild(newMessageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    deleteMessage(messageId, 0);
}

function displayTemporaryMessage(message) {
    const newMessageDiv = document.createElement('div');
    const messageId = generateMessageId();
    newMessageDiv.id = messageId;
    newMessageDiv.className = 'chat-message';
    newMessageDiv.innerHTML = `<span class="message">${message}</span>`;
    const chatBox = document.getElementById('messages');
    chatBox.appendChild(newMessageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    deleteMessage(messageId, 10);
}

/////////////////////////
// MESSAGES / ACTIONS
/////////////////////////

async function sendTwitchMessage(message) {
    await client.doAction({ name: "sendMessageToTwitch" }, { message });
}

async function sendYoutubeMessage(message) {
    await client.doAction({ name: "sendMessageToYoutube" }, { message });
}

function deleteMessage(msgId, timeout) {
    if (timeout > 0) {
        setTimeout(() => {
            const msgElement = document.getElementById(msgId);
            if (msgElement) {
                msgElement.remove();
            }
        }, 1000 * timeout);
    }
}

function generateMessageId() {
    const randomInt = Math.floor(Math.random() * 16777215);
    return `#${randomInt.toString(16).padStart(6, '0')}`;
}

/////////////////////////
// HELPER FUNCTIONS
/////////////////////////

async function updateExcluded() {
    ignoreList = ['Streamelements'];

    const response = await client.getBroadcaster();
    const platforms = response.platforms || {};

    // Use Object.values for safe iteration even if platforms is an object
    Object.values(platforms).forEach(platform => {
        if (platform?.botUserName) ignoreList.push(platform.botUserName);
        if (platform?.broadcastUserName) ignoreList.push(platform.broadcastUserName);
    });

    return ignoreList;
}

/////////////////////////
// SUBSCRIPTIONS
/////////////////////////

client.on('Twitch.ChatMessage', handleTwitchMessage);
client.on('YouTube.Message', handleYoutubeMessage);
client.on('Twitch.RewardRedemption', handleRewardRedemption);
client.on('Twitch.Follow', handleTwitchFollow)
// Example alert events
client.on('YouTube.NewSubscriber', ({ data }) => {
    const username = data.data.user.name;
    displayAlertMessage(`<b><img class="icon" src="images/alert.png"></img> <span class="alertMessage">${username} Just subscribed on YouTube!</span></b>`);
});

// Add other alert events similarly as needed...



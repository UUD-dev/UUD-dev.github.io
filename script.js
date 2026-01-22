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
            `<b><img class="icon" src="images/alert.png"></img> <span class="alertMessage">[CONNECTED] Client connected successfully! (v0.4.3)</span></b>`
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

const websocketport = 8080;
const websockethost = "127.0.0.1";

let ignoreList = [];

/* =====================
   STREAMER.BOT CLIENT
===================== */
const client = new StreamerbotClient({
  host: websockethost,
  port: websocketport,
  endpoint: "/",

  onError: (err) => {
    console.error("ERROR", err);
    appendMessage({
      html: formatAlert(`[ERROR] ${JSON.stringify(err)}`),
      timeout: 10
    });
  },

  onConnect: async () => {
    appendMessage({
      html: formatAlert("[CONNECTED] Client connected successfully (v0.4.1)"),
      timeout: 10
    });

    const excluded = await updateExcluded();
    appendMessage({
      html: formatAlert(`[UPDATE] Ignorelist: ${excluded.join(", ")}`),
      timeout: 10
    });

    setInterval(updateExcluded, 1000 * 60 * 5);
  }
});

/* =====================
   EVENT HANDLERS
===================== */

client.on("Twitch.ChatMessage", ({ data }) => {
  const username = data.user.name;
  if (shouldIgnore(username)) return;

  sendYoutubeMessage(`[${username}]: ${data.message.message}`);
  renderChatMessage({
    platform: "twitch",
    username: data.message.displayName,
    message: data.message.message,
    first: data.message.firstMessage,
    highlighted: data.message.isHighlighted
  });
});

client.on("YouTube.Message", ({ data }) => {
  const username = data.user.name;
  if (shouldIgnore(username)) return;

  sendTwitchMessage(`[${username}]: ${data.message}`);
  renderChatMessage({
    platform: "youtube",
    username: data.user.name,
    message: data.message
  });
});

client.on("Twitch.Follow", ({ data }) =>
  appendMessage({ html: formatAlert(`${data.user_name} followed on Twitch`) })
);

client.on("YouTube.NewSubscriber", ({ data }) =>
  appendMessage({ html: formatAlert(`${data.data.user.name} subscribed on YouTube`) })
);

client.on("Twitch.Cheer", ({ data }) =>
  appendMessage({
    html: formatAlert(`${data.user.name} cheered ${data.bits} bits (${data.message})`)
  })
);

/* =====================
   MESSAGE RENDERING
===================== */

function renderChatMessage({ platform, username, message, first, highlighted }) {
  const classes = [];
  if (first) classes.push("firstmessage");
  if (highlighted) classes.push("highlighted");

  appendMessage({
    classes,
    html:
      `<span class="message">` +
      `<b>${platformIcon(platform)}<span class="username">${escapeHtml(username)}</span>:</b> ` +
      `${escapeHtml(message)}` +
      `</span>`
  });
}

function appendMessage({ html, classes = [], timeout = 0 }) {
  const div = document.createElement("div");
  div.id = generateMessageId();
  div.className = "chat-message " + classes.join(" ");
  div.innerHTML = html;

  const chatBox = document.getElementById("messages");
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (timeout > 0) {
    setTimeout(() => div.remove(), timeout * 1000);
  }
}

/* =====================
   HELPERS
===================== */

function platformIcon(platform) {
  const src =
    platform === "twitch"
      ? "images/twitch.png"
      : platform === "youtube"
      ? "images/youtube.png"
      : "images/alert.png";
  return `<img class="icon" src="${src}"> `;
}

function formatAlert(text) {
  return (
    `<span class="message">` +
    `<img class="icon" src="images/alert.png"> ` +
    `<span class="alertMessage">${escapeHtml(text)}</span>` +
    `</span>`
  );
}

function shouldIgnore(username) {
  return ignoreList
    .map(u => u.toLowerCase())
    .includes(username.toLowerCase());
}

function generateMessageId() {
  return "msg-" + Math.random().toString(36).slice(2, 10);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* =====================
   OUTGOING CHAT
===================== */

async function sendTwitchMessage(message) {
  await client.doAction({ name: "sendMessageToTwitch" }, { message });
}

async function sendYoutubeMessage(message) {
  await client.doAction({ name: "sendMessageToYoutube" }, { message });
}

/* =====================
   IGNORE LIST
===================== */

async function updateExcluded() {
  ignoreList = ["streamelements"];

  const response = await client.getBroadcaster();
  for (const platform of response.platforms) {
    if (platform.botUserName) ignoreList.push(platform.botUserName);
    if (platform.broadcastUserName) ignoreList.push(platform.broadcastUserName);
  }

  console.log("IGNORELIST:", ignoreList);
  return ignoreList;
}

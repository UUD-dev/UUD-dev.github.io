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
            'Alert Overlay Connected (v0.2)',
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

let FB = require("fb");
let SlackBot = require("slackbots");
let fs = require("fs");
let slackInfo;
let bot;
let slackToken, fbToken;
let listToSearch;
let sameNames = {};

function readSlackJSON() {
	slackInfo = JSON.parse(fs.readFileSync("./slack.json", {
		encoding: "utf-8"
	}));
}

function readFacebookToken() {
	fbToken = fs.readFileSync("./facebook_token.txt", {
		encoding: "utf-8"
	});
}

function readListToSearch() {
	listToSearch = fs.readFileSync("names.txt", {
		encoding: "utf-8"
	})
	.split("\n")
	.map(function(name) {
		let splitedName = name.split(" ");
		return {
			firstName: splitedName[0],
			lastName: splitedName[1]
		}
	});
	listToSearch.pop();
	console.log(listToSearch);
}

function initSlack() {
	readSlackJSON();
	bot = new SlackBot(slackInfo);
	bot.on("start", function() {
		console.log("slack started");
	});
}

function initFacebook() {
	readFacebookToken();
	FB.setAccessToken(fbToken);
}
function init() {
	initSlack();
	initFacebook();
	readListToSearch();
}

function sendMessage(name, now, prev){
	if (now > prev){
		bot.postMessageToChannel("general", name + "ってユーザーが" + (now - prev) + "人増えてるぜ", null);
	} else if (now < prev){
		bot.postMessageToChannel("general", "やったな!" + name + "ってユーザーが" + (prev - now) + "人削除されたぜ", null);
	}
}
function saveResult(){
	fs.writeFile("data.json", JSON.stringify(sameNames), function(err){
		console.log(err);
	});
}

function check(){
	listToSearch.forEach(function(user){
		let name = user.firstName + " " + user.lastName;
		FB.api("/search", {
			fields: "id,last_name,first_name",
			q: name,
			type: "user"
		}, function(res){
			console.log(res);
			let count = res.data.filter(function(u){
				if (user.firstName.toLowerCase() == u.first_name.toLowerCase() 
					&& user.lastName.toLowerCase() == u.last_name.toLowerCase()){
					return true;
				}
				return false;
			}).length;
			if (sameNames[name] != undefined){
				if (sameNames[name] != count){
					sendMessage(name, count, sameNames[name]);
				}
			}
			sameNames[name] = count;
		});
	});
}

function start() {
	fs.readFile("data.json", "utf8", function(err, text){
		let json = JSON.parse(text);
		sameNames = json;
		setTimeout(check, 5000);
		setTimeout(saveResult, 9000);
		setTimeout(function(){
			process.exit(0);
		}, 1000 * 11);
	});
}

init();
start();

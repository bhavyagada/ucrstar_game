import * as map from './map';
import * as helpers from './helpers';

// fetch question
let gameData = "";
(async() => {
	console.log(import.meta.env.VITE_BASE_URL)
	const response = await fetch(`${import.meta.env.VITE_BASE_URL}/cgi-bin/app.cgi`);
	const responseData = await response.json();
	console.log(responseData);

	// save game data
	if (!localStorage.getItem("game")) {
		gameData = responseData.game
		localStorage.setItem("game", JSON.stringify(gameData));
	} else {
		gameData = JSON.parse(localStorage.getItem("game"));
	}
	// save attempt count
	if (!localStorage.getItem("attemptCount")) {
		localStorage.setItem("attemptCount", 1); // game hasn't started
	}

	// get the google maps api url and add it in html
	const gmaps_script = document.getElementById("gmaps");
	gmaps_script.src = responseData.gmap_api_url

	const question = gameData.question;
	const questionLink = gameData.question_link;
	helpers.displayQuestion(question, questionLink);

	const dataset = gameData.dataset;
	const dataset_type = gameData.dataset_type;
	console.log(dataset, dataset_type);

	// has to be deleted later
	// const box = gameData.answer_stats;
	// map.displayAnswerBox(box.bottom_left.concat(box.top_right));

	// start position with dataset
	helpers.displayMap(questionLink)
	map.displayDataset(dataset, dataset_type);
	const openTutorial = document.getElementById("tutorial-quiz");
	openTutorial.onclick = function() { 
		return helpers.tutorialMode(true, dataset, dataset_type);
	}
})();

// submit answer (#TODO also send attempt number for corresponding hint number) to receive hint if answer is wrong
const submit = document.getElementById("submit");
submit.onclick = function submitAnswer() {
	const count = parseInt(localStorage.getItem("attemptCount"));
	const scoreData = map.getScore();

	let data = new URLSearchParams()
	for (let key in scoreData) {
		data.append(key, scoreData[key]);
	}
	console.log(data);

	(async() => {
		const response = await fetch(`${import.meta.env.VITE_BASE_URL}/cgi-bin/answer.cgi`, {
			method: 'POST',
			body: data // send answer attempt to server for check
		});

		const responseData = await response.json();
		console.log(responseData.response);

		// save attempt history
		scoreData["hint"] = responseData.response.hint;
		scoreData["score"] = responseData.response.score;
		if (!localStorage.getItem("history")) {
			localStorage.setItem("history", JSON.stringify([scoreData]));
		} else if (localStorage.getItem("history") && count > 0 && count < 6){
			let historyData = JSON.parse(localStorage.getItem("history"));
			console.log(historyData);
			historyData.push(scoreData);
			localStorage.setItem("history", JSON.stringify(historyData));
		}

		async function myFunction() {
			document.getElementById("blur-back").style.display = "block";
			await helpers.animateScore(responseData.response.score);
			await new Promise(resolve => setTimeout(resolve, 2500));
			document.getElementById("counter").style.display = "none";
			await helpers.animateHint(responseData.response, count);
			await new Promise(resolve => setTimeout(resolve, 5000));
			document.getElementById("hint").style.display = "none";
			document.getElementById("blur-back").style.display = "none";
			await helpers.historyMode(false);
		}
		myFunction();
		// helpers.displayHint(responseData.response, count, false);
	})();

	// count number of attemps and stop after 5 attempts
	helpers.attemptCount();
}

// to open or close modal
const gameover = document.getElementById("game-over");
const closegameover = document.getElementById("close-answer");
closegameover.onclick = function() {
	gameover.style.display = gameover.style.display === "block" ? "none" : "block";
}

window.onload = () => {
	return helpers.historyMode(false);
}
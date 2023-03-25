import * as map from './map';
import * as helpers from './helpers';

// fetch question
if (document.body.classList.contains('main')) {
	(async() => {
		console.log(import.meta.env.VITE_BASE_URL)
		const response = await fetch(`${import.meta.env.VITE_BASE_URL}/cgi-bin/app.cgi`);
		const responseData = await response.json();
		console.log(responseData);

		// save game data
		let gameData = "";
		const localGameData = localStorage.getItem("game");
		if (!localGameData) {
			gameData = responseData.game
			localStorage.setItem("game", JSON.stringify(gameData));
		} else {
			gameData = JSON.parse(localGameData);
		}
		// save attempt count
		if (!localStorage.getItem("attemptCount")) {
			localStorage.setItem("attemptCount", 1); // game hasn't started
		}

		// get the google maps api url and add it in html
		const gmaps_script = document.getElementById("gmaps");
		gmaps_script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GMAPS_API}&callback=initAutocomplete&libraries=places&v=weekly`;

		helpers.displayQuestion(gameData.question, gameData.question_link);
		document.getElementById("title").innerHTML += `Question ${gameData._id}`;
		
		// has to be deleted later
		// map.displayAnswerBox(gameData.answer_stats.bottom_left.concat(gameData.answer_stats.top_right));

		// start position with dataset
		helpers.displayMap(gameData.question_link)
		map.displayDataset(gameData.dataset, gameData.dataset_type);
		const openTutorial = document.getElementById("tutorial-quiz");
		openTutorial.onclick = function() { 
			return helpers.tutorialMode(true, gameData.dataset, gameData.dataset_type);
		}
	})();
} else {
	var params = {};
	location.search.slice(1).split("&").forEach(function(pair) {
		pair = pair.split("=");
		params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
	});
	map.displayDataset(params.dataset, params.dataset_type);
	console.log(params);

	const gmaps_script = document.getElementById("gmaps");
	gmaps_script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GMAPS_API}&callback=initAutocomplete&libraries=places&v=weekly`;
}

// submit answer
const submit = document.getElementById("submit");
submit.onclick = function () {return helpers.submitAnswer();}

// alternate submit answer
const tooltip = document.getElementById("tooltip");
if (document.body.classList.contains('admin')) {
	tooltip.onclick = function () { return map.addQuestion(); }
} else {
	tooltip.onclick = function () { return helpers.submitAnswer(); }
}

// stop score & hint animation when clicked on background
document.onclick = function () {
	document.getElementById("counter").style.display = "none";
	document.getElementById("hint").style.display = "none";
	document.getElementById("blur-back").style.display = "none";
	helpers.historyMode(false);
}

// to open or close modal
const gameover = document.getElementById("game-over");
const closegameover = document.getElementById("close-answer");
closegameover.onclick = function() {
	gameover.style.display = gameover.style.display === "block" ? "none" : "block";
}

// show history when window loads
window.onload = () => {
	return helpers.historyMode(false);
}

// reload screen to show history if window is resized
window.addEventListener('resize',() => {
	location.reload();
	return helpers.historyMode(false);
})
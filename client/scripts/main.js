import * as map from './map';
import * as helpers from './helpers';

// function to initialize game
(async() => {
	// get environment variables
	const baseURL = import.meta.env.VITE_BASE_URL;
    const gmapsAPIKey = import.meta.env.VITE_GMAPS_API;

	// fetch question data
	const response = await fetch(`${baseURL}/cgi-bin/app.cgi`);
	const responseData = await response.json();
	console.log(responseData);

	// save game data locally
	const gameData = helpers.checkAndSetLocalStorage("game", responseData.game);

	// save attempt count locally
	helpers.checkAndSetLocalStorage("attemptCount", 1);

	// get the google maps api url and add it in html (for search)
	const gmaps_script = document.getElementById("gmaps");
	gmaps_script.src = `https://maps.googleapis.com/maps/api/js?key=${gmapsAPIKey}&callback=initAutocomplete&libraries=places&v=weekly`;

	// show the question in question box
	helpers.displayQuestion(gameData.question, gameData.question_link);
	document.getElementById("title").innerHTML += `Question ${gameData._id}`;
	
	// TODO: delete
	// map.displayAnswerBox(gameData.answer_stats.bottom_left.concat(gameData.answer_stats.top_right));

	// visualize dataset and start at initial position of the question
	helpers.displayMap(gameData.question_link)
	map.displayDataset(gameData.dataset, gameData.dataset_type);

	// handle tutorial mode
	const openTutorial = document.getElementById("tutorial-quiz");
	openTutorial.onclick = function() { 
		return helpers.tutorialMode(true, gameData.dataset, gameData.dataset_type);
	}
})();

// event delegation for multiple click handlers
document.addEventListener("click", (event) => {
    const targetId = event.target.id;

    if (targetId === "question-link") { // takes you to initial position of question
        event.preventDefault();
        const localGameData = JSON.parse(localStorage.getItem("game"));
        helpers.displayMap(localGameData.question_link);
    } else if (targetId === "submit" || targetId === "tooltip") { // either get hint or submit answer
        helpers.submitAnswer();
    }
});

// stop score & hint animation when clicked on background
document.onclick = function () {
	document.getElementById("counter").style.display = "none";
	document.getElementById("hint").style.display = "none";
	document.getElementById("blur-back").style.display = "none";
	helpers.historyMode(false);
}

// open or close game over modal message
const gameover = document.getElementById("game-over");
const closegameover = document.getElementById("close-answer");
closegameover.onclick = function() {
	gameover.style.display = gameover.style.display === "block" ? "none" : "block";
}

// show history when window loads
window.addEventListener("load", () => {
    helpers.historyMode(false);
});

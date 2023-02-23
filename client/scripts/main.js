import * as map from './map';
import * as helpers from './helpers';

// global variables
const quiz = document.getElementById("quiz");
const closequiz = document.getElementById("close-quiz");
const tutorial = document.getElementById("tutorial");
const openTutorial = document.getElementById("tutorial-quiz");
const closetutorial = document.getElementById("close-tutorial");
const gameover = document.getElementById("game-over");
const closegameover = document.getElementById("close-answer");
const submit = document.getElementById("submit");

// submit answer (#TODO also send attempt number for corresponding hint number) to receive hint if answer is wrong
function submitAnswer() {
	const count = parseInt(localStorage.getItem("attemptCount"));
	const scoreData = map.getScore();

	let data = new URLSearchParams()
	for (let key in scoreData) {
		data.append(key, scoreData[key]);
	}
	console.log(data);

	(async() => {
		const response = await fetch("http://localhost:8000/cgi-bin/answer.cgi", {
    		method: 'POST',
    		body: data // send answer attempt to server for check
    	});

    	const responseData = await response.json();
    	console.log(responseData.response);

		// helpers.displayHint(responseData.response, count);
	})();

	// count number of attemps and stop after 5 attempts
	helpers.attemptCount();
}

// fetch question
(async() => {
	const response = await fetch("http://localhost:8000/cgi-bin/app.cgi");
	const responseData = await response.json();
	let gameData = "";

	if (!localStorage.getItem("game")) {
		gameData = responseData.game;
		helpers.saveData(gameData); // save question locally
	} else {
		gameData = JSON.parse(localStorage.getItem("game"));
	}
	console.log(gameData);

	const question = gameData.question;
	const questionLink = gameData.question_link;
	helpers.displayQuestion(question, questionLink);

	const dataset = gameData.dataset;
	const dataset_type = gameData.dataset_type;
	console.log(dataset, dataset_type);

	// has to be deleted later
	const box = gameData.answer_stats;
	map.displayAnswerBox(box.bottom_left.concat(box.top_right));

	// get the google maps api url and add it in html
	const gmaps_script = document.getElementById("gmaps");
	gmaps_script.src = responseData.gmap_api_url
	helpers.displayMap(questionLink);
	map.displayDataset(dataset, dataset_type);
})();

// to open or close modal => false - open, true - close
helpers.toggleModal(tutorial, openTutorial, false);
helpers.toggleModal(tutorial, closetutorial, true);
helpers.toggleModal(quiz, closequiz, true);
helpers.toggleModal(gameover, closegameover, true);

// to drag the quiz box around the screen
helpers.dragElement(quiz);

submit.onclick = function() { return submitAnswer(); };

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
	const current = map.getCurrentLocation();
	//console.log(current);

	// -------------------------------------------
	// Similarity and Distance Calculations
	const localdata = JSON.parse(localStorage.getItem("quiz"));
	const answerLink = localdata.answer_link;

	const currBox = map.getCurrentBox();
	const answerBox = map.getAnswerBox(answerLink);
	const scoreData = map.getScore(currBox, answerBox);

	// -------------------------------------------	
	
	// const payload = {"user_answer": current, "score": score, "message": message};

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
    	console.log(responseData);

    	if (count === -1) {
    		helpers.displayGameOver(responseData.response);
    	}
	})();

	// count number of attemps and stop after 5 attempts
	helpers.attemptCount();
	if (count === -1) {
		console.log("Game Over!");
	} else if (count > 0 && count < 6) {
		console.log("Hint number:", count);
	}
}

// fetch question
(async() => {
	const response = await fetch("http://localhost:8000/cgi-bin/app.cgi");
	const responseData = await response.json();
	const data = responseData;
	const quizData = data.quiz;
	console.log(quizData);

	// save question locally
	helpers.saveData(quizData);

	// set attempt count
	if (!localStorage.getItem("attemptCount")) {
    	localStorage.setItem("attemptCount", 1); // game hasn't started
	}

	// get the question, initial map link and answer link
	// TODO: get it from localStorage
	const question = quizData.question;
	const questionLink = quizData.question_link;
	
  	// get the google maps api url and add it in html
  	let gmaps_script = document.getElementById("gmaps");
  	gmaps_script.src = data.gmap_api_url

	helpers.displayQuestion(question, questionLink);
	helpers.displayMap(questionLink);
})();

// to open or close modal => false - open, true - close
helpers.toggleModal(tutorial, openTutorial, false);
helpers.toggleModal(tutorial, closetutorial, true);
helpers.toggleModal(quiz, closequiz, true);
helpers.toggleModal(gameover, closegameover, true);

// to drag the quiz box around the screen
helpers.dragElement(quiz);

submit.onclick = function() { return submitAnswer(); };

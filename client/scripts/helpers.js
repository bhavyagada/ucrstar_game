import { view, transformLocation } from './map';

// create the google maps search box
export function initAutocomplete() {
    const input = document.getElementById("search");
    const searchBox = new google.maps.places.SearchBox(input);
}

// to open or close modal => false - open, true - close
export function toggleModal(element, button, toggle) {
    button.onclick = function() {
        if (toggle) {
            element.style.display = "none";
        } else {
            element.style.display = "block";
        }
    }
}

// display question
export function displayQuestion(question, questionLink) {
    // break question and put link in brackets as 'start here'
    const breakQuestion = question.split("[]");
    const a = document.getElementById("question-link");
    a.href = questionLink
    a.insertAdjacentText('beforebegin', breakQuestion[0]);
    a.insertAdjacentText('afterend', breakQuestion[1]);
}

// save quiz progress data
export function saveData(quizData) {
    if (!localStorage.getItem("quiz")) {
        localStorage.setItem("quiz", JSON.stringify(quizData));
    } else {
        const quiz = localStorage.getItem("quiz");
        const questionId = quiz["id"];
        // console.log(questionId);
    }
}

// get location coordinates and zoom level from url
export function getMapDetailsFromUrl(url) {
    const link = new URL(url);
    const hash = link.hash.substring(1);
  
    const result = hash.split('&').reduce(function (res, item) {
        const parts = item.split('=');
        res[parts[0]] = parts[1];
        return res;
    }, {});
  
    return [result.center.split(','), result.zoom];
}

// display location on map
export function displayMap(url) {
    const [location, zoom] = getMapDetailsFromUrl(url);
    const center = transformLocation(location)
  
    view.animate({center: center, zoom: zoom, duration: 2000});
}

// display hint, score or congratulations text
export function displayGameOver(gameOverData) {
    const box = document.getElementById("game-over");
    const messageBox = document.getElementById("message");
    const messageText = gameOverData.message;
    console.log(gameOverData);
    messageBox.innerHTML = messageText;
    box.style.display = "block";
}

// count number of attempts
export function attemptCount() {
    let count = parseInt(localStorage.getItem("attemptCount"));
    if (count === -1) {
        return;
    } else if (count > 4) {
        localStorage.setItem("attemptCount", -1); // game over
    } else {
        count = count + 1;
        localStorage.setItem("attemptCount", count);
    }
    console.log(count);
}

// to drag the quiz box around the screen
export function dragElement(el) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById("title"))
        document.getElementById("title").onmousedown = dragMouseDown;
    else
        el.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }
  
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";
    }
  
    function closeDragElement() {
        // stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

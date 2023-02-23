import { view, transform } from './map';

// create the google maps search box
export function initAutocomplete() {
    const input = document.getElementById("search");
    new google.maps.places.SearchBox(input);
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
export function saveData(gameData) {
    // save game data
    if (!localStorage.getItem("game")) {
        localStorage.setItem("game", JSON.stringify(gameData));
    }
    // save attempt count
	if (!localStorage.getItem("attemptCount")) {
    	localStorage.setItem("attemptCount", 1); // game hasn't started
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
    const center = transform([parseFloat(location[1]), parseFloat(location[0])], 'EPSG:4326', 'EPSG:3857');
  
    view.animate({center: center, zoom: zoom, duration: 2000});
}

function displayGameOver(messageBox, win=false) {
    const topScore = localStorage.getItem("score");
    if (win) {
        messageBox.innerHTML = `Congratulations! You got the perfect score!<br> Come back tomorrow for a new game!`
    } else {
        messageBox.innerHTML = `Game Over! You used up all your attempts!<br> Your highest score is ${topScore}!`;
    }
    const share = document.getElementById("share");
    const text = `I just won this game! Can you beat my top score ${topScore}?`;
    share.innerHTML = `<br><hr>
        <a id="twitter" href="https://twitter.com/intent/tweet?text=${text}&url=https://star.cs.ucr.edu/" target="_blank" aria-label="Share on Twitter">
            <i class="bi bi-twitter" style="font-size:20px;"></i>
            Share on twitter!
        </a>
        <a id="fb" href="https://www.facebook.com/sharer/sharer.php?u=https://star.cs.ucr.edu/&quote=${text}" target="_blank" aria-label="Share on Facebook">
            <i class="bi bi-facebook" style="font-size:20px;"></i>
            Share on facebook!
        </a>
    `
}

// display hint, score and corresponding text
export function displayHint(gameStats, count) {
    console.log(gameStats, count);
    const box = document.getElementById("game-over");
    const messageBox = document.getElementById("message");
    const overlap = gameStats.overlap;
    const score = gameStats.score;
    const hint = gameStats.hint;
    const message = gameStats.message;
    const icons = {
        "zoom_in": "bi-zoom-in",
        "zoom_out": "bi-zoom-out",
        "east": "bi-arrow-right",
        "west": "bi-arrow-left",
        "north": "bi-arrow-up",
        "south": "bi-arrow-down",
        "south_east": "bi-arrow-down-right",
        "south_west": "bi-arrow-down-left",
        "north_east": "bi-arrow-up-right",
        "north_west": "bi-arrow-up-left"
    }

    if (!localStorage.getItem("score")) {
        localStorage.setItem("score", score);
    } else {
        const lastScore = localStorage.getItem("score");
        if (score > lastScore && count !== -1) {
            localStorage.setItem("score", score);
            if (score === 100) {
                displayGameOver(messageBox, true); // won
                localStorage.setItem("attemptCount", -1);
            }
        }
    }

    if (count > 0 && count < 6) {
        if (overlap) {
            messageBox.innerHTML = `Here's a hint to guide you:<br><i class="bi ${icons[hint]}" style="font-size:45px;"></i><br>Your score is ${score}!<br> ${message}`
        } else {
            messageBox.innerHTML = `Here's a hint to guide you:<br><i class="bi ${icons[hint]}" style="font-size:45px;"></i><i class="bi ${icons[hint]}" style="font-size:45px;"></i><br>Your score is ${score}!<br> ${message}`
        }
    } else {
        displayGameOver(messageBox, false); // lost
    }
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

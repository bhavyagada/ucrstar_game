import { osmMap, view, transform, olExtent, removeDataset, displayDataset, transformExtent } from './map';

// display question
export function displayQuestion(question, questionLink) {
    // break question and put link in brackets as 'start here'
    const breakQuestion = question.split("[]");
    const a = document.getElementById("question-link");
    a.href = questionLink
    a.insertAdjacentText('beforebegin', breakQuestion[0]);
    a.insertAdjacentText('afterend', breakQuestion[1]);
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

function displayGameOver(messageBox, win=false, tutorial) {
    let topScore = 0;
    if (tutorial) {
        topScore = 100;
    } else {
        topScore = 0;
        for (const attempt in JSON.parse(localStorage.getItem("history"))) {
            for(const [key, value] of Object.entries(attempt)) {
                if(value["score"] > topScore) {
                    topScore = value;
                }
            }    
        }
        console.log(topScore);
    }
    if (win) {
        messageBox.innerHTML = `Congratulations! You got the perfect score of ${topScore}!<br> Come back tomorrow for a new game!<br>`
    } else {
        messageBox.innerHTML = `Game Over! You used up all your attempts!<br> Your highest score is ${topScore}!<br>`;
    }
    const share = document.getElementById("share");
    // share.style.textAlign = "center";
    const text = `I just won this game! Can you beat my top score ${topScore}?`;
    share.innerHTML = `<hr><br>
        <a id="twitter" href="https://twitter.com/intent/tweet?text=${text}&url=https://star.cs.ucr.edu/" target="_blank" aria-label="Share on Twitter">
            <i class="bi bi-twitter" style="font-size:20px;"></i>
            Share on twitter!
        </a>&nbsp;
        <a id="fb" href="https://www.facebook.com/sharer/sharer.php?u=https://star.cs.ucr.edu/&quote=${text}" target="_blank" aria-label="Share on Facebook">
            <i class="bi bi-facebook" style="font-size:20px;"></i>
            Share on facebook!
        </a>
    `
}

// display hint, score and corresponding text
export function displayHint(gameStats, count, tutorial) {
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

    let scoreStyle = "";
    if (score < 35) {
        console.log("reached here");
        scoreStyle = "#FF0000";
    } else if (score > 35 && score < 70) {
        scoreStyle = "#FFC300";
    } else {
        scoreStyle = "#4CBB17";
    }

    if (tutorial) {
        messageBox.innerHTML = `<b>All possible hints available: </b><br>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));grid-gap:10px;padding:10px;">
            <div style="text-align:center;"><span><i class="bi bi-zoom-in" style="font-size:25px;"></i><br>ZOOM IN</span></div>
            <div style="text-align:center;"><span><i class="bi bi-zoom-out" style="font-size:25px;"></i><br>ZOOM OUT</span></div>
            <div style="text-align:center;"><span><i class="bi bi-arrow-right" style="font-size:25px;"></i><br>EAST</span></div>
            <div style="text-align:center;"><span><i class="bi bi-arrow-left" style="font-size:25px;"></i><br>WEST</span></div>
            <div style="text-align:center;"><span><i class="bi bi-arrow-up" style="font-size:25px;"></i><br>NORTH</span></div>
            <div style="text-align:center;"><span><i class="bi bi-arrow-down" style="font-size:25px;"></i><br>SOUTH</span></div>
            <div style="text-align:center;"><span><i class="bi bi-arrow-down-right" style="font-size:25px;"></i><br>SOUTH EAST</span></div>
            <div style="text-align:center;"><span><i class="bi bi-arrow-down-left" style="font-size:25px;"></i><br>SOUTH WEST</span></div>
            <div style="text-align:center;"><span><i class="bi bi-arrow-up-right" style="font-size:25px;"></i><br>NORTH EAST</span></div>
            <div style="text-align:center;"><span><i class="bi bi-arrow-up-left" style="font-size:25px;"></i><br>NORTH WEST</span></div>
        </div>`;
    } else {
        let hintLabel = ""
        if (hint) {
            const newHintString = hint.split("_").join(" ")
            hintLabel = newHintString.charAt(0).toUpperCase() + newHintString.slice(1);
        }

        if (score === 100) {
            displayGameOver(messageBox, true, false); // won
            localStorage.setItem("attemptCount", -1);
        }

        if (count > 0 && count < 6) {
            if (overlap) {
                messageBox.innerHTML = `<b>Here's a hint to guide you</b>
                <div style="text-align:center;">
                    <div style="padding:15px;margin:2px;font-size:17.5px">
                        <i id="${hint}" class="bi ${icons[hint]} animate" style="font-size:45px;"></i><br>
                        ${hintLabel}
                    </div><hr>
                    <div style="font-size:25px;padding:5px;">Score : <span style="color:${scoreStyle};">${score}</span></div>
                </div>`;
            } else {
                messageBox.innerHTML = `<b style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">Here's a hint to guide you</b>
                <div style="text-align:center;">
                    <div style="padding:15px;margin:2px;font-size:17.5px">
                        <i id="${hint}" class="bi ${icons[hint]}" style="font-size:45px;"></i>
                        <i id="${hint}" class="bi ${icons[hint]}" style="font-size:45px;"></i><br>
                        ${hintLabel}
                    <div><hr>
                    <div style="font-size:25px;padding:5px;">Score : <span style="color:${scoreStyle};">${score}</span></div>
                </div>`;
            }
        } else {
            displayGameOver(messageBox, false, false); // lost
        }
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

export function tutorialMode(mode, dataset, type) {
    const intro = introJs();
    const setoptions = {
        tooltipClass: 'tutorialMode',
        showProgress: true,
        hideNext: false,
        hidePrev: true,
        doneLabel: 'Play',
        keyboardNavigation: true,
        exitOnEsc: true,
        exitOnOverlayClick: false,
        helperElementPadding: 0.5,
        overlayOpacity: 0.8,
        showStepNumbers: false,
        showBullets: false
    };
    const steps = {
        steps: [{
            title: '<b style="color:#fbfbfb">Welcome!</b>',
            element: document.querySelector('#tutorial-quiz'),
            intro: '<span style="color:#fbfbfb"><button type="button"><span>Next</span></button> for <b>tutorial.</b></span><br><span style="color:#fbfbfb"><button type="button"><span>Esc</span></button> to <b>play.</b></span>'
        }, {
            title: '<b style="color:#fbfbfb">Daily Question</b>',
            element: document.querySelector('#question'),
            intro: '<span style="color:#fbfbfb">A new question will be displayed here every day.</span>'
        }, {
            title: '<b style="color:#fbfbfb">Start Point</b>',
            element: document.querySelector('#question-link'),
            intro: '<span style="color:#fbfbfb">Click here to reset your position on the map.</span>'
        }, {
            title: '<b style="color:#fbfbfb">Interactive Map</b>',
            element: document.querySelector('#map'),
            intro: '<span style="color:#fbfbfb">Interact with the map and look for the answer.<br><br>The closer you are, the better score you get. [<span style="color:red;">0</span> - <span style="color:lightgreen;">100</span>]</span>',
        }, {
            title: '<b style="color:#fbfbfb">Submit Answer</b>',
            element: document.querySelector('#submit'),
            intro: '<span style="color:#fbfbfb">Try to fit the answer on screen and submit it.</span>'
        }, {
            title: '<b style="color:#fbfbfb">Attempt History</b>',
            element: document.querySelector('#history'),
            intro: '<span style="color:#fbfbfb">See previous answers and respective scores.</span>'
        }, {
            title: '<b style="color:#fbfbfb">Checkpoints</b>',
            element: document.querySelector('#message'),
            intro: '<span style="color:#fbfbfb">Your answer history will be saved here and clicking on any of them will take you to that location.</span>'
        }, {
            title: '<b style="color:#fbfbfb">Search</b>',
            element: document.querySelector('#search'),
            intro: '<span style="color:#fbfbfb">Search for a location to directly jump there.</span>'
        },{
            title: '<b style="color:#fbfbfb">Hints</b>',
            element: document.querySelector('#message'),
            intro: '<span style="color:#fbfbfb">With each attempt, you will get hints to guide you.<br></span>',
        }, {
            title: '<b style="color:#fbfbfb">Share</b>',
            element: document.querySelector('#share'),
            intro: '<span style="color:#fbfbfb">Share your score on social media & invite friends to play!</span>',
        }]
    }
    intro.setOptions(setoptions);
    intro.setOptions(steps);
    if (mode) {
        removeDataset();
        const currentCenter = view.getCenter();
        const currentZoom = view.getZoom();
        intro
        .onbeforechange(function() {
            if (intro._currentStep === 3) {
                setTimeout(function() {
                    const tutorialBox = document.getElementsByClassName("introjs-tooltip")[0];
                    tutorialBox.style.top = "135px";
                }, 700);
            }
        })
        .onchange(function() {
            if (intro._currentStep === 1) {
                view.setCenter(transform([-0.12755, 51.507222], 'EPSG:4326', 'EPSG:3857'));
                view.setZoom(8);
                document.getElementById("game-over").style.display = "none";
            }
            if (intro._currentStep === 3) {
                setTimeout(function() {
                    view.animate({center: transform([7.4458, 46.95], 'EPSG:4326', 'EPSG:3857'), duration: 2000});
                    view.animate({zoom: 7, duration: 1000}, {zoom: 8, duration: 1000});
                }, 600);
                setTimeout(function() {
                    view.animate({center: transform([12.5, 41.9], 'EPSG:4326', 'EPSG:3857'), duration: 2000});
                    view.animate({zoom: 7, duration: 1000}, {zoom: 12, duration: 1000});
                }, 2750);
                setTimeout(function() {
                    view.animate({center: transform([12.4528527, 41.903411], 'EPSG:4326', 'EPSG:3857'), duration: 2000});
                    view.animate({zoom: 8, duration: 1000}, {zoom: 13, duration: 1000});
                }, 2750);
                document.getElementById("game-over").style.display = "none";
            }
            if (intro._currentStep === 4 || intro._currentStep === 5 || intro._currentStep === 7) {
                document.getElementById("game-over").style.display = "none";
            }
            if (intro._currentStep === 6) {
                if (!localStorage.getItem("history")) {
                    const fakeHistory = [
                        {"bottom_left":[0,0], "top_right":[0,0]},
                        {"bottom_left":[0,0], "top_right":[0,0]},
                        {"bottom_left":[0,0], "top_right":[0,0]},
                        {"bottom_left":[0,0], "top_right":[0,0]},
                        {"bottom_left":[0,0], "top_right":[0,0]}
                    ]
                    const fakeScores = [32, 41, 67, 80, 91]
                    localStorage.setItem("fakehistory", JSON.stringify(fakeHistory))
                }
                historyMode(true);
            }
            if (intro._currentStep === 8) {
                displayHint({}, 0, true);
            }
            if (intro._currentStep === 9) {
                displayGameOver(document.getElementById("message"), true, true);
            }
        })
        .onbeforeexit(function() {
            view.setCenter(currentCenter);
            view.setZoom(currentZoom);
            if (localStorage.getItem("fakehistory")) {
                localStorage.removeItem("fakehistory");
            }
            document.getElementById("game-over").style.display = "none";
        })
        .onexit(function() {
            displayDataset(dataset, type);
        })
        .start();
    }
    mode = !mode;
}

export async function historyMode(tutorial) {
    const unicodes = {
        "zoom_in": "&#128269;+",
        "zoom_out": "&#128269;-",
        "west": "&#11104;",
        "north": "&#11105;",
        "east": "&#11106;",
        "south": "&#11107;",
        "north_west": "&#8598;",
        "north_east": "&#8599;",
        "south_east": "&#8600;",
        "south_west": "&#8601",
    }
    let historyData = JSON.parse(localStorage.getItem("history"));

    if (tutorial && !localStorage.getItem("history")) {
        historyData = JSON.parse(localStorage.getItem("fakehistory"));
        scoreData = JSON.parse(localStorage.getItem("fakescores"));
    }
    console.log(historyData);

    const history = document.getElementById("history");
    if (historyData === null || historyData.length < 0) {
        history.innerHTML = `<button disabled="disabled" style="color:#000;width:99%;margin:2px;
        height:20px;font-weight:900;box-sizing:border-box;border-radius:5px;">No history!</button>`;
    } else {
        if (tutorial && !localStorage.getItem("history")) {
            history.innerHTML = `<b style="color:#eee;padding:5px;float:left;">Fake tutorial answers</b>`;
        } else {
            history.innerHTML = `<b style="color:#eee;padding:5px;float:left;">Your history</b>`;
        }
        let scoreStyle = "";
        for (let i = 0; i < historyData.length; i++) {
            // const historyModal = document.getElementById("history-modal");
            let scoreData = historyData[i].score;
            if (scoreData < 35) {
                scoreStyle = "#FF0000";
            } else if (scoreData > 35 && scoreData < 70) {
                scoreStyle = "#FFDD22";
            } else {
                scoreStyle = "#4CBB17";
            }
            const history = document.getElementById("history");
            const item = document.createElement("button");
            item.id = (i+1).toString() + "-link";
            item.style.cssText = `display:grid;grid-template-columns:repeat(auto-fit,minmax(10px,1fr));width:99%;
            height:20px;margin:2px;box-sizing:border-box;border-radius:5px;color:#000;background-color:${scoreStyle}`
            item.innerHTML = `<span style="text-align:left;padding:2px;"><i class="bi bi-geo-alt-fill"></i> ${i+1}.</span>`;
            item.innerHTML += `<span style="text-align:center;padding:6px;">${scoreData}</span>`;
            item.innerHTML += `<span style="text-align:right;padding:6px;">${unicodes[historyData[i].hint]}</span>`
            history.appendChild(item);
        }

        for (let i = 0; i < historyData.length; i++) {
            const extent = transformExtent(historyData[i].bottom_left.concat(historyData[i].top_right), 'EPSG:4326', 'EPSG:3857')

            const button = document.getElementById((i+1).toString()+"-link");
            button.onclick = function() {
                const resolution = view.getResolutionForExtent(extent, osmMap.getSize());
                view.animate({ center: olExtent.getCenter(extent), duration: 3000, zoom: view.getZoomForResolution(resolution) });
            };
        }
    }
}

export async function animateScore(score) {
    document.getElementById("hint").style.display = "none";
    const counter = document.getElementById("counter");
    counter.style.display = "block";

    const speed = 10;
    let currentValue = 0;
    let scoreStyle = "";

    if (score < 35) {
        scoreStyle = "#FF0000";
    } else if (score > 35 && score < 70) {
        scoreStyle = "#FFDD22";
    } else {
        scoreStyle = "#4CBB17";
    }

    const animate = () => {
        counter.innerHTML = `<span style="color:${scoreStyle};">${currentValue}</span>`;

        if (currentValue < score) {
            currentValue += 1;
            setTimeout(animate, speed);
        }
    }
    animate();
}

export async function animateHint(gameStats, count) {
    document.getElementById("counter").style.display = "none";
    const hintSpan = document.getElementById("hint");
    hintSpan.style.display = "block";

    const overlap = gameStats.overlap;
    const hint = gameStats.hint;
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
    const animations = {
        "zoom_in": [
            { textAlign: "center", transform: "scale(1, 1)" },
            { textAlign: "center", transform: "scale(0.75, 0.75)" },
            { textAlign: "center", transform: "scale(0.5, 0.5)" }
        ],
        "zoom_out": [
            { textAlign: "center", transform: "scale(0.5, 0.5)" },
            { textAlign: "center", transform: "scale(0.75, 0.75)" },
            { textAlign: "center", transform: "scale(1, 1)" }
        ],
        "east": [
            { left: "20%" },
            { left: "50%"}
        ],
        "west": [
            { left: "50%" },
            { left: "20%"}
        ],
        "north": [
            {
                verticalAlign: "bottom",
                textAlign: "center",
                transform: "translateY(75%)"
            },
            {
                verticalAlign: "bottom",
                textAlign: "center",
                transform: "translateY(-75%)"
            }
        ],
        "south": [
            {
                verticalAlign: "top",
                textAlign: "center",
                transform: "translateY(-75%)"
            },
            {
                verticalAlign: "top",
                textAlign: "center",
                transform: "translateY(75%)"
            }
        ],
        "south_east": [
            {
                margin: "0",
                left: "15%",
                top: "15%",
            },
            {
                margin: "0",
                left: "55%",
                top: "55%",
            }
        ],
        "south_west": [
            {
                textAlign: "right",
                margin: "0",
                right: "15%",
                top: "15%",
            },
            {
                textAlign: "right",
                margin: "0",
                right: "55%",
                top: "55%",
            }
        ],
        "north_east": [
            {
                margin: "0",
                left: "15%",
                bottom: "15%",
            },
            {
                margin: "0",
                left: "55%",
                bottom: "55%",
            }
        ],
        "north_west": [
            {
                margin: "0",
                left: "15%",
                bottom: "15%",
            },
            {
                margin: "0",
                left: "55%",
                bottom: "55%",
            }
        ]
    }
    const timings = {
        duration: 2500,
        iterations: 2,
    }
    let hintLabel = "";
    if (hint) {
        const newHintString = hint.split("_").join(" ")
        hintLabel = newHintString.charAt(0).toUpperCase() + newHintString.slice(1);
    }

    if (count > 0 && count < 6) {
        if (overlap) {
            hintSpan.innerHTML = `<i class="bi ${icons[hint]}"></i>`
            hintSpan.animate(animations[hint], timings);
        } else {
            hintSpan.innerHTML = `<i class="bi ${icons[hint]}"></i><i class="bi ${icons[hint]}"></i>`
            hintSpan.animate(animations[hint], timings);
        }
    } else {
        displayGameOver(messageBox, false, false); // lost
    }
}
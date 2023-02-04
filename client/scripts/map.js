import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Control, defaults as defaultControls } from 'ol/control';
import { transform, transformExtent } from 'ol/proj';
import * as olExtent from 'ol/extent';
import { initAutocomplete, getMapDetailsFromUrl } from "./helpers";

// create custom search and submit controls
class CustomControls extends Control {
    constructor(opt_options) {
        const options = opt_options || {};

        const search = document.createElement('input');
        search.type = "text";
        search.placeholder = 'Go to location';
        search.id = 'search';
    
        const submit = document.createElement('input');
        submit.type = "submit";
        submit.value = "submit answer";
        submit.id = 'submit';
        // submit.onclick = function() { return submitAnswer(); };
  
        const element = document.createElement('div');
        element.className = 'custom-controls ol-unselectable ol-control';
        element.appendChild(search);
        element.appendChild(submit)
  
        super({
            element: element,
            target: options.target,
        });
    }
  }

// map view
const view = new View({
    center: [0, 0],
    zoom: 2
});
  
// map
const map = new Map({
    controls: defaultControls().extend([new CustomControls()]),
    target: 'map',
    layers: [
        new TileLayer({
            source: new OSM()
        })
    ],
    view: view
});
  
window.initAutocomplete = initAutocomplete;

// transform extent/bounding box
function transformBox(extent) {
    return transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
}

// tranform coordinates
export function transformLocation(coordinates) {
    return transform([parseFloat(coordinates[1]), parseFloat(coordinates[0])], 'EPSG:4326', 'EPSG:3857');
}

export function getCurrentLocation() {
    const currentLocation = map.getView().getCenter();
    const current = transform(currentLocation, 'EPSG:3857', 'EPSG:4326');
    return [parseFloat(current[1]), parseFloat(current[0])];
}

// get current box
export function getCurrentBox() {
    return transformBox(map.getView().calculateExtent(map.getSize()));
}

// TODO: Move all following logic to backend
// get answer box
export function getAnswerBox(answerLink) {
    const [location, zoom] = getMapDetailsFromUrl(answerLink);
    const center = transformLocation(location)

    const answerView = new View({ center: center, zoom: zoom });
    return transformBox(answerView.calculateExtent(map.getSize()));
}

export function getBoxCorners(extent) {
    return [olExtent.getBottomLeft(extent), olExtent.getTopRight(extent)];
}

export function getBoxArea(extent) {
    return olExtent.getArea(extent);
}

export function getScore(currBox, answerBox) {
    console.log("current box", currBox);
    console.log("answer box", answerBox);
    const [currBottomLeft, currTopRight] = getBoxCorners(currBox);
    const [answerBottomLeft, answerTopRight] = getBoxCorners(answerBox);
    const c1 = olExtent.getCenter(currBox);
    const c2 = olExtent.getCenter(answerBox);
    const w1 = olExtent.getWidth(currBox);
    const h1 = olExtent.getHeight(currBox);
    const w2 = olExtent.getWidth(answerBox);
    const h2 = olExtent.getHeight(answerBox);
    const x1 = currBottomLeft[0];
    const y1 = currBottomLeft[1];
    const x2 = currTopRight[0];
    const y2 = currTopRight[1];
    const x3 = answerBottomLeft[0];
    const y3 = answerBottomLeft[1];
    const x4 = answerTopRight[0];
    const y4 = answerTopRight[1];

    const x5 = Math.max(x1, x3);
    const y5 = Math.max(y1, y3);
    const x6 = Math.min(x2, x4);
    const y6 = Math.min(y2, y4);
    
    let data = {};

    if (olExtent.intersects(currBox, answerBox)) {
        const currBoxArea = olExtent.getArea(currBox);
        const answerBoxArea = olExtent.getArea(answerBox);
        const intersectionArea = (x6 - x5) * (y6 - y5); // widht * height

        const jaccardIndex = intersectionArea / (currBoxArea + answerBoxArea - intersectionArea);
        console.log("jaccard index", jaccardIndex);
        // slope = (output_end - output_start) / (input_end - input_start)
        // output = output_start + slope * (input - input_start)
        const slope = 50.0 / 0.95;
        const jaccardScore = parseInt(50.0 + slope * jaccardIndex);
        console.log(jaccardScore);
        
        data["index"] = jaccardIndex;
        data["score"] = jaccardScore;
        data["message"] = "Answer found! For a better score, try "
        data["found"] = true;

        if (x5 > x1 && y5 > y1 && x6 < x2 && y6 < y2) {
            data["direction"] = "Zooming In!";
            return data;
        }
        if (x5 > x3 && y5 > y3 && x6 < x4 && y6 < y4) {
            data["direction"] = "Zooming Out!";
            return data;
        }
        if (x3 === x5 && x5 < x6 && x6 < x4) {
            if (y4 === y6) {
                data["direction"] = "Moving South East!";
            } else if (y3 === y5) {
                data["direction"] = "Moving North East!";
            } else {
                data["direction"] = "Moving East!";
            }
            return data;
        }
        if (x4 === x6 && x3 < x5 && x5 < x6) {
            if (y4 === y6) {
                data["direction"] = "Moving South West!";
            } else if (y3 === y5) {
                data["direction"] = "Moving North West!";
            } else {
                data["direction"] = "Moving West!";
            }
            return data;
        }
        if (y3 === y5 && y5 < y6 && y6 < y4) {
            data["direction"] = "Moving North!";
            return data;
        }
        if (y4 === y6 && y3 < y1 && y1 < y6) {
            data["direction"] = "Moving South!";
            return data;
        }
    } else {
        const centerDistance = Math.sqrt(Math.pow(c2[0] - c1[0], 2) + Math.pow(c2[1] - c1[1], 2));
        const averageEdges = (w1 + h1 + w2 + h2) / 4.0;
        const geodesicDistance = centerDistance / averageEdges;
        console.log(geodesicDistance);

        data["index"] = geodesicDistance;
        data["score"] = 0;
        data["message"] = "You still have another chance! Try ";
        data["found"] = false;

        if (x2 < x3) {
            if (y2 < y3) {
                data["direction"] = "Moving North East!";
            } else if (y4 < y1) {
                data["direction"] = "Moving South East!";
            } else {
                data["direction"] = "Moving East!";
            }
            return data;
        }
        if (x1 > x4) {
            if (y2 < y3) {
                data["direction"] = "Moving North West!";
            } else if (y4 < y1) {
                data["direction"] = "Moving South West!";
            } else {
                data["direction"] = "Moving West!";
            }
            return data;
        }
        if (y1 > y4) {
            data["direction"] = "Moving South!";
            return data;
        }
        if (y2 < y3) {
            data["direction"] = "Moving North!";
            return data;
        }
    }
}

export {view}
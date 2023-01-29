import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Control, defaults as defaultControls } from 'ol/control';
import { transform, transformExtent } from 'ol/proj';
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
    return [current[1], current[0]];
}

// get current box
export function getCurrentBox() {
    return transformBox(map.getView().calculateExtent(map.getSize()));
}

// get answer box
export function getAnswerBox(answerLink) {
    const [location, zoom] = getMapDetailsFromUrl(answerLink);
    const center = transformLocation(location)

    return transformBox(new View({
        center: center,
        zoom: zoom
    }).calculateExtent(map.getSize()));
}

export {view}
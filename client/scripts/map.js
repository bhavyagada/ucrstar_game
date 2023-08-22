import { Feature, Map, View, Overlay } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import { Control, defaults as defaultControls } from 'ol/control';
import { transform, transformExtent, getTransform } from 'ol/proj';
import * as olExtent from 'ol/extent';
import { fromExtent } from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Fill } from 'ol/style';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';

// create custom history and search controls
class CustomControls extends Control {
    constructor(opt_options) {
        const options = opt_options || {};

        const quiz = document.createElement("div");
        quiz.id = "quiz";

        const tutorialQuiz = document.createElement("span");
        tutorialQuiz.id = "tutorial-quiz";
        tutorialQuiz.innerHTML = '<i class="bi bi-question-diamond"></i>';

        const titleText = document.createElement("p");
        titleText.id = "title";
        titleText.appendChild(tutorialQuiz);
        quiz.appendChild(titleText);

        const question = document.createElement("p");
        question.id = "question";

        const questionA = document.createElement("a");
        questionA.id = "question-link";
        questionA.innerText = "[start here]";

        question.appendChild(questionA);
        quiz.append(document.createElement("hr"), question);

        const history = document.createElement("div");
        history.id = "history";

        const search = document.createElement("input");
        search.type = "text";
        search.placeholder = "Go to location";
        search.id = "search";
  
        const element = document.createElement("div");
        element.className = "custom-controls ol-unselectable ol-control";
        element.append(quiz, history, search);
  
        super({
            element: element,
            target: options.target,
        });
    }
}

// TODO: Also need to change tutorial, answer handling and hint handling
// submit answer button
class CustomHint extends Control {
    constructor(opt_options) {
        const options = opt_options || {};

        const getHint = document.createElement("input");
        getHint.type = "submit";
        getHint.value = "give me a hint";
        getHint.id = "submit";
        getHint.name = "mainsubmit"

        const element = document.createElement("div");
        element.className = "custom-submit ol-unselectable ol-control";
        element.append(getHint);

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

// map layer
const layers = [new TileLayer({
    source: new OSM()
})];

// map tooltip for information
const tooltipOverlay = [new Overlay({
    element: document.getElementById('tooltip'),
    offset: [10, 0],
    positioning: 'bottom-left'
})];

// map
const map = new Map({
    controls: defaultControls().extend([new CustomControls(), new CustomHint()]),
    target: 'map',
    layers: layers,
    overlays: tooltipOverlay,
    view: view
});

const mapViewport = document.querySelector(".ol-overlaycontainer-stopevent");

const blurback = document.createElement("div");
blurback.id = "blur-back";

// to show the score
const counter = document.createElement("span");
counter.id = "counter";
counter.innerHTML = "0";

// to show hints
const hint = document.createElement("span");
hint.id = "hint";

mapViewport.append(blurback, counter, hint);

// create the google maps search box
window.initAutocomplete = function initAutocomplete() {
    const input = document.getElementById("search");
    const searchBox = new google.maps.places.Autocomplete(input);
    searchBox.addListener('place_changed', function() {
        const place = searchBox.getPlace();
        // console.log(place);
        const southWestY = place.geometry.viewport.Ka.lo;
        const southWestX = place.geometry.viewport.Va.lo;
        const northEastY = place.geometry.viewport.Ka.hi;
        const northEastX = place.geometry.viewport.Va.hi;
        const extent = [southWestY, southWestX, northEastY, northEastX];
        const transformedExtent = olExtent.applyTransform(extent, getTransform('EPSG:4326', 'EPSG:3857'));
        const resolution = view.getResolutionForExtent(transformedExtent, map.getSize());
        view.animate({ center: olExtent.getCenter(transformedExtent), duration: 3000, zoom: view.getZoomForResolution(resolution) });
    });
};

// display answer for debuggin: TODO: delete later
export function displayAnswerBox(extent) {
    map.addLayer(new VectorLayer({
        source: new VectorSource({
            features: [new Feature({
                geometry: fromExtent(extent).transform('EPSG:4326','EPSG:3857')
            })]
        }),
        style: new Style({
            stroke: new Stroke({
                width: 3,
                color: [255, 0, 0, 1]
            })
        })
    }))
}

// send extent coordinates to get scores
export function getAnswerExtent() {
    const currentAnswer = transformExtent(map.getView().calculateExtent(map.getSize()), 'EPSG:3857', 'EPSG:4326');

    return {
        "bottom_left": olExtent.getBottomLeft(currentAnswer),
        "top_right": olExtent.getTopRight(currentAnswer)
    };
}

function writeValueToHTML(attributeValue) {
    let html = "";
    if (typeof attributeValue === 'string')
        html += "\""+attributeValue+"\"";
    else if (typeof attributeValue === 'number')
        html += attributeValue;
    else if (Array.isArray(attributeValue)) {
        html += "["+attributeValue.toString+"]";
    } else if (typeof attributeValue === 'object') {
        html += "{"
        let first = true;
        for (const key in attributeValue) {
            if (!first)
                html += ", "
            html += key +" &rarr;"+ writeValueToHTML(attributeValue[key]);
            first = false;
        }
        html += "}"
    }
    return html;
}

function displayXYZData(data, position, dataset) {
    const tooltip = document.getElementById("tooltip");
    tooltip.style.display = data ? '' : 'none';
    if (data) {
        tooltipOverlay[0].setPosition(position);
        const attributeNames = Object.keys(data);
        let html = "";
        for (let i = 0; i < attributeNames.length; i++) {
            const attributeName = attributeNames[i];
            html += attributeName + ": ";
            html += writeValueToHTML(data[attributeName]);
            html += "<br/>"
        }
        html += `<input id="submit" type="submit" value="submit answer" name=${writeValueToHTML(data["attr#0"])}>`;

        tooltip.innerHTML = html;
    }
}

function displayGeoJSONData(event) {
    const tooltip = document.getElementById("tooltip");
    const pixel = event.pixel;
    const feature = map.forEachFeatureAtPixel(pixel, function(feature) {
        return feature;
    });
    tooltip.style.display = feature ? '' : 'none';
    if (feature) {
        tooltipOverlay[0].setPosition(event.coordinate);
        const attributeNames = feature.getKeys();
        let html = "";
        for (let i = 0; i < attributeNames.length; i++) {
            const attributeName = attributeNames[i];
            if (attributeName != feature.getGeometryName()) {
                const attributeValue = feature.get(attributeName)
                html += attributeName + ": " + attributeValue + "<br/>"
            }
        }
        html += `<input id="submit" type="submit" value="submit answer" name=${attributeNames["OBJECTID"]}>`;

        tooltip.innerHTML = html;
    }
};

export function displayDataset(dataset, type) {
    console.log(dataset, type);
    // https://gis.stackexchange.com/questions/302532/how-to-update-tile-source-url-at-zoom-change
    if (type == "large") {
        map.addLayer(new TileLayer({
            source: new XYZ({
                tileUrlFunction: function(tileCoord) {
                    return `https://star.cs.ucr.edu/dynamic/visualize.cgi/${dataset}/plot/tile-${tileCoord[0]}-${tileCoord[1]}-${tileCoord[2]}.png`
                },
                minZoom: 0,
                maxZoom: 19
            }),
            visible: true,
            preload: Infinity,
            useInterimTilesOnError: true
        }))
        map.on('click', function(event) {
            const px = event.pixel;
            const southwest = transform(map.getCoordinateFromPixel([px[0] - 3, px[1] + 3]), 'EPSG:3857', 'EPSG:4326');
            const northeast = transform(map.getCoordinateFromPixel([px[0] + 3, px[1] - 3]), 'EPSG:3857', 'EPSG:4326');
            const opx = map.getCoordinateFromPixel(event.pixel);
            const url = `https://star.cs.ucr.edu/datasets/${dataset}/view.json?mbr=${southwest[0]},${southwest[1]},${northeast[0]},${northeast[1]}`;
            (async() => {
                const response = await fetch(url);
                const data = await response.json();
                if(!data.out_bound) {
                    displayXYZData(data, opx, dataset);
                } else {
                    tooltip.style.display = 'none';
                }
            })();
        });
    } else {
        map.addLayer(new VectorLayer({
            source: new VectorSource({
                format: new GeoJSON(),
                url: `https://star.cs.ucr.edu/dynamic/download.cgi/${dataset}/data_index.geojson`
            }),
            style: function() {
                return new Style({
                    stroke: new Stroke({
                        color: 'black',
                        width: 1
                    }),
                    fill: new Fill({
                        color: 'rgba(211,211,211,0.5)'
                    })
                });
            },
            visible: true,
        }));
        map.getLayers().item(0).setOpacity(0.5);
        map.on('click', displayGeoJSONData);
    }
}

export {map as osmMap, view, transform, getTransform, olExtent, transformExtent}
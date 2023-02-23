import os
import json
from bson import ObjectId, json_util
from pymongo import MongoClient
from datetime import date, timedelta
from dotenv import load_dotenv
load_dotenv()

MONGODB_URL = os.getenv('MONGODB_URL')
GMAPS_API_KEY = os.getenv('GMAPS_API_KEY')
TODAY = date.today()
DATA = [{
    "question": "Can you spot Camp Nou using sports dataset on UCR-Star? Here is a starting point for you on UCR-Star []",
    "answer": "Here you can find Camp Nou and 5 million other sports related polygons on UCR-Star []",
    "answer_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.380925,2.122928&zoom=18",
    "answer_stats": {
        "bottom_left": [
            2.120406723526001,
            41.37934110772656
        ],
        "top_right": [
            2.125449276473999,
            41.38250885369828
        ]
    },
    "question_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.3957,2.1813&zoom=13"
},{
    "question": "Is that a road? Can you guess where this road located at? Use UCR-Star to find it out []",
    "answer": "Do you want to see the correct answer? Follow the link [] to find the location for this road and 72 million others on UCR-Star!",
    "answer_link": "https://star.cs.ucr.edu/?OSM2015/roads#center=51.0207,1.4972&zoom=12",
    "question_link": "https://star.cs.ucr.edu/?OSM2015/roads#center=45.06,27.21&zoom=5"
},{
    "question": "Can you guess where this park is located at? Use UCR-Star to find it out []",
    "answer": "Do you want to see the correct answer? Follow the link [] to find the location of this park and 10 millon others on UCR-Star!",
    "answer_link": "https://star.cs.ucr.edu/?OSM2015/parks#center=40.78225,-73.95892&zoom=15",
    "question_link": "https://star.cs.ucr.edu/?OSM2015/parks#center=40.783,-73.542&zoom=9"
},{
    "question": "Can you locate this building on the map? Try using buildings dataset on UCR-Star []",
    "answer": "It is Sydney Opera House visualized on UCR-Star! To see the dataset and find other many other dataset check the link []",
    "answer_link": "https://star.cs.ucr.edu/?OSM2015/buildings#center=-33.856826,151.215611&zoom=18",
    "question_link": "https://star.cs.ucr.edu/?OSM2015/buildings#center=-34.000,151.041&zoom=9"
},{
    "question": "This country is the home of the comodo dragon. Try to locate it on the countries dataset at UCR-Star. []",
    "answer": "The comodo dragon is found in five islands, all in Indonesia. Check it out on this link []",
    "answer_link": "https://star.cs.ucr.edu/?NE/countries#center=-1.15,111.67&zoom=6",
    "question_link": "https://star.cs.ucr.edu/?NE/countries#center=26.3,24.8&zoom=3"
}]

DUMMY_DATA = [{
    "question": "Can you spot Camp Nou using sports dataset on UCR-Star? Here is a starting point for you on UCR-Star []",
    "answer": "Here you can find Camp Nou and 5 million other sports related polygons on UCR-Star []",
    "answer_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.380925,2.122928&zoom=18",
    "answer_stats": {
        "bottom_left": [ 2.120406723526001, 41.37934110772656 ],
        "top_right": [ 2.125449276473999, 41.38250885369828 ]
    },
    "dataset":"OSM2015/sports",
    "dataset_type": "large",
    "question_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.3957,2.1813&zoom=13"
}, {
   "question": "Can you spot China []",
    "answer": "Here you can find Camp Nou and 5 million other sports related polygons on UCR-Star []",
    "answer_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.380925,2.122928&zoom=18",
    "answer_stats": {
        "bottom_left": [ 73.6753792663, 18.197700914 ],
        "top_right": [ 135.026311477, 53.4588044297 ]
    },
    "dataset":"OSM2015/lakes",
    "dataset_type": "large",
    "question_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.3957,2.1813&zoom=13", 
},{
    "question": "Can you spot California []",
    "answer": "Here you can find Camp Nou and 5 million other sports related polygons on UCR-Star []",
    "answer_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.380925,2.122928&zoom=18",
    "answer_stats": {
        "bottom_left": [ -124.409591, 32.534156 ],
        "top_right": [ -114.131211, 42.009518 ]
    },
    "dataset":"Riverside/Subdivision",
    "dataset_type": "small",
    "question_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.3957,2.1813&zoom=13",
}, {
   "question": "Can you spot New Zealand []",
    "answer": "Here you can find Camp Nou and 5 million other sports related polygons on UCR-Star []",
    "answer_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.380925,2.122928&zoom=18",
    "answer_stats": {
        "bottom_left": [ 166.509144322, -46.641235447 ],
        "top_right": [ 178.517093541, -34.4506617165 ]
    },
    "dataset":"OSM2015/buildings",
    "dataset_type": "large",
    "question_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.3957,2.1813&zoom=13", 
}, {
   "question": "Can you spot India []",
    "answer": "Here you can find Camp Nou and 5 million other sports related polygons on UCR-Star []",
    "answer_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.380925,2.122928&zoom=18",
    "answer_stats": {
        "bottom_left": [ 68.1766451354, 7.96553477623 ],
        "top_right": [ 97.4025614766, 35.4940095078 ]
    },
    "dataset":"OSM2015/all_nodes",
    "dataset_type": "large",
    "question_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.3957,2.1813&zoom=13", 
}]

def populate_db():
    for i, doc in enumerate(DUMMY_DATA):
        doc["date"] = str(TODAY + timedelta(days=i))
    
    con = MongoClient(MONGODB_URL)
    db = con.ucrstar
    db.game.insert_many(DUMMY_DATA)
    con.close()

def cursor_to_json(cursor):
    documents = [document for document in cursor]
    json_dump = json.dumps(documents, default=json_util.default)
    return json.loads(json_dump)

def get_gmaps_script_url():
    return "https://maps.googleapis.com/maps/api/js?key=" + GMAPS_API_KEY + "&callback=initAutocomplete&libraries=places&v=weekly"
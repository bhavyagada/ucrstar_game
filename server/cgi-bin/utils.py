import os
import json
import logging
from bson import ObjectId, json_util
from pymongo import MongoClient
from datetime import date, timedelta
from dotenv import load_dotenv
load_dotenv()

MONGODB_URL = os.getenv('MONGODB_URL')
GMAPS_API_KEY = os.getenv('GMAPS_API_KEY')
TODAY = date.today()

# for debugging
log_file = os.path.join(os.getcwd(), "server.log")
logging.basicConfig(filename=log_file, level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")

# DATA = [{
#     "question": "Can you spot Camp Nou using sports dataset on UCR-Star? Here is a starting point for you on UCR-Star []",
#     "answer": "Here you can find Camp Nou and 5 million other sports related polygons on UCR-Star []",
#     "answer_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.380925,2.122928&zoom=18",
#     "answer_stats": {
#         "bottom_left": [
#             2.120406723526001,
#             41.37934110772656
#         ],
#         "top_right": [
#             2.125449276473999,
#             41.38250885369828
#         ]
#     },
#     "question_link": "https://star.cs.ucr.edu/?osm21/sports#center=41.3957,2.1813&zoom=13"
# },{
#     "question": "Is that a road? Can you guess where this road located at? Use UCR-Star to find it out []",
#     "answer": "Do you want to see the correct answer? Follow the link [] to find the location for this road and 72 million others on UCR-Star!",
#     "answer_link": "https://star.cs.ucr.edu/?OSM2015/roads#center=51.0207,1.4972&zoom=12",
#     "question_link": "https://star.cs.ucr.edu/?OSM2015/roads#center=45.06,27.21&zoom=5"
# },{
#     "question": "Can you guess where this park is located at? Use UCR-Star to find it out []",
#     "answer": "Do you want to see the correct answer? Follow the link [] to find the location of this park and 10 millon others on UCR-Star!",
#     "answer_link": "https://star.cs.ucr.edu/?OSM2015/parks#center=40.78225,-73.95892&zoom=15",
#     "question_link": "https://star.cs.ucr.edu/?OSM2015/parks#center=40.783,-73.542&zoom=9"
# },{
#     "question": "Can you locate this building on the map? Try using buildings dataset on UCR-Star []",
#     "answer": "It is Sydney Opera House visualized on UCR-Star! To see the dataset and find other many other dataset check the link []",
#     "answer_link": "https://star.cs.ucr.edu/?OSM2015/buildings#center=-33.856826,151.215611&zoom=18",
#     "question_link": "https://star.cs.ucr.edu/?OSM2015/buildings#center=-34.000,151.041&zoom=9"
# },{
#     "question": "This country is the home of the comodo dragon. Try to locate it on the countries dataset at UCR-Star. []",
#     "answer": "The comodo dragon is found in five islands, all in Indonesia. Check it out on this link []",
#     "answer_link": "https://star.cs.ucr.edu/?NE/countries#center=-1.15,111.67&zoom=6",
#     "question_link": "https://star.cs.ucr.edu/?NE/countries#center=26.3,24.8&zoom=3"
# }]

def populate_db():
    data = {}
    try:
        with open("cgi-bin/data.json", "r") as data_file:
            data = json.load(data_file)
    except Exception as e:
        logging.info(f'error in reading data file : {e}')

    con = MongoClient(MONGODB_URL)
    db = con.ucrstar
    result = db.game.aggregate([{ "$group": {
            "_id": None,
            "earliestDate": { 
                "$min": { 
                    "$toDate": "$date" 
                }
            }
        }
    }])
    
    doc_count = db.game.count()
    if doc_count == 0:
        count = 0
    else:
        earliest_date = list(result)[0]['earliestDate'].date()
        count = doc_count - (TODAY - earliest_date).days
    # logging.info(f'earliest date : {earliest_date}')
    # logging.info(f'count of documents : {count}')

    for i, doc in enumerate(data):
        doc["date"] = str(TODAY + timedelta(days=i+count))
    # logging.info(f'updated data : {data}')

    db.game.insert_many(data)
    con.close()

def cursor_to_json(cursor):
    documents = [document for document in cursor]
    json_dump = json.dumps(documents, default=json_util.default)
    return json.loads(json_dump)

def get_gmaps_script_url():
    return "https://maps.googleapis.com/maps/api/js?key=" + GMAPS_API_KEY + "&callback=initAutocomplete&libraries=places&v=weekly"
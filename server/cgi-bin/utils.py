import os
import json
from bson import ObjectId, json_util
from pymongo import MongoClient
from dotenv import load_dotenv
load_dotenv()

MONGODB_URL = os.getenv('MONGODB_URL')
GMAPS_API_KEY = os.getenv('GMAPS_API_KEY')

def cursor_to_json(cursor):
    documents = [document for document in cursor]
    json_dump = json.dumps(documents, default=json_util.default)
    return json.loads(json_dump)

def get_gmaps_script_url():
    return "https://maps.googleapis.com/maps/api/js?key=" + GMAPS_API_KEY + "&callback=initAutocomplete&libraries=places&v=weekly"
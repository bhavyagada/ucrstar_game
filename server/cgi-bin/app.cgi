#!/usr/bin/env python3

import json
import utils
from bson import ObjectId
from pymongo import MongoClient

# temporary - populate db with some data
# utils.populate_db()

# getting a random question from db
def get_question():
    con = MongoClient(utils.MONGODB_URL)
    db = con.ucrstar
    game = db.game.find_one({"date": str(utils.TODAY)})
    con.close()
    if game:
        return game
    return None

# create data object to be sent
data = {}
game = get_question()
data["game"] = {}
for field in game:
    if field != '_id':
        data["game"][field] = game[field]
data["gmap_api_url"] = utils.get_gmaps_script_url()

# send data
print("Content-Type: application/json")
print("Access-Control-Allow-Origin: *")
print()
print(json.JSONEncoder().encode(data))

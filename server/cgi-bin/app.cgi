#!/usr/bin/env python3

import json
import utils
from pymongo import MongoClient

# getting a random question from db
def get_question():
    con = MongoClient(utils.MONGODB_URL)
    db = con.ucrstar
    game = db.game.find_one({"date": str(utils.TODAY)}, {"_id": 1, "question": 1, "question_link": 1, "dataset": 1, "dataset_type": 1})
    con.close()
    if game:
        return game
    return None

# create data object to be sent
data = {}
game = get_question()
data["game"] = {}
for field in game:
    data["game"][field] = game[field]

# send data
print("Content-Type: application/json")
print("Access-Control-Allow-Origin: *")
print()
print(json.JSONEncoder().encode(data))

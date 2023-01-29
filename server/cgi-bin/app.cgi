#!/usr/bin/env python3

import json
import utils
from pymongo import MongoClient

# getting a random question from db
def get_question():
    con = MongoClient(utils.MONGODB_URL)
    db = con.test
    quiz = db.quiz.aggregate([
        {"$match" : {"done" : False}},
        {"$sample" : {"size" : 1}}
    ])
    con.close()
    if quiz:
        return utils.cursor_to_json(quiz)
    return None

# create data object to be sent
data = {}
quiz = get_question()
data["quiz"] = {}
for field in quiz[0]:
    if field == '_id':
        data["quiz"]["id"] = quiz[0][field]["$oid"]
    else:
        data["quiz"][field] = quiz[0][field]
data["gmap_api_url"] = utils.get_gmaps_script_url()

# send data
print("Content-Type: application/json")
print("Access-Control-Allow-Origin: *")
print()
print(json.JSONEncoder().encode(data))

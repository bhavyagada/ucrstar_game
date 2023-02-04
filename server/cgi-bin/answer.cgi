#!/usr/bin/env python3

import cgi, cgitb
import json
import utils
from bson import ObjectId
from pymongo import MongoClient

cgitb.enable()
params = cgi.FieldStorage()
question_id = params.getvalue("quesion_id")
user_answer = params.getvalue("user_answer")
current_bounding_box = params.getvalue("current_bounding_box")

# to be implemented here instead of the frontend
score = int(params.getvalue("score"))
text = params.getvalue("message")
direction = params.getvalue("direction")
found = params.getvalue("found")

res = {}
message = ""
# res = {
#   "message": (str) // game over or keep going
#   "hint": (str)
#   "score": (int/float)
#   "status": in_progress, win, lose 
# }

def calculate_distance(answer, user_answer):
    # calculate the distance in miles/km and direction (NSEW)

    # return both for determining hint
    pass

def get_hint(answer, closeness):
    # determine criteria to send distance or the direction as hint
    # eg. if very far then send distance, if close then send direction
    # return either one of it as hint (direction or distance)
    
    # res["hint"] = ""

    # return direction, distance
    pass

def get_score(score, arg2):
    # calculate score here

    # res["score"] += new_score
    pass

def check_answer(user_answer):
    con = MongoClient(utils.MONGODB_URL)
    db = con.test
    quiz = db.quiz.find({"_id": ObjectId(id)})
    answer = quiz.answer_link
    closeness = calculate_distance(answer, user_answer) # calculate how far/close to answer
    if (closeness in range): # if it's in some close range then done
        res["message"] = "Congratulations! You found the answer."
    else: # if not in close range then 
        res["message"] = get_hint(user_answer, closeness) # get direction or distance as hint
    get_score() # get overall score
    con.close()

if found:
    message = "Your score is " + str(score) + ". " + text + direction
else:
    message = text + direction

print("Status: 200 OK")
print("Content-Type: application/json")
print("Access-Control-Allow-Origin: *")
print()
print(json.JSONEncoder().encode({"response": {"message": message}}))
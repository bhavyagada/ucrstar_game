#!/usr/bin/env python3

import os
import math
import utils
import cgi
import json
from pymongo import MongoClient

from math import radians, sin, cos, sqrt, atan2, degrees

# Function to calculate Haversine distance
def haversine_distance(coord1, coord2):
    R = 6371  # Earth radius in km
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance = R * c
    return distance

# Function to calculate Jaccard similarity for overlapping boxes
def jaccard_similarity(box1, box2):
    west1, south1, east1, north1 = box1
    west2, south2, east2, north2 = box2
    
    x_overlap = max(0, min(east1, east2) - max(west1, west2))
    y_overlap = max(0, min(north1, north2) - max(south1, south2))
    
    intersection = x_overlap * y_overlap
    area1 = (east1 - west1) * (north1 - south1)
    area2 = (east2 - west2) * (north2 - south2)
    
    union = area1 + area2 - intersection
    
    return intersection / union

# Function to give hints on how to get from box1 to box2
def navigate_box(box1, box2):
    west1, south1, east1, north1 = box1
    west2, south2, east2, north2 = box2
    
    # Check if the boxes overlap
    if east1 >= west2 and east2 >= west1 and north1 >= south2 and north2 >= south1:
        # Boxes overlap
        area1 = (east1 - west1) * (north1 - south1)
        area2 = (east2 - west2) * (north2 - south2)
        
        # Determine zoom direction based on the size of the boxes
        if area1 > area2:
            return "zoom_in"
        else:
            return "zoom_out"
    else:
        # Boxes do not overlap
        # Calculate the center point of each box
        center1 = ((north1 + south1) / 2, (west1 + east1) / 2)
        center2 = ((north2 + south2) / 2, (west2 + east2) / 2)
        
        # Calculate initial compass bearing
        bearing = calculate_initial_compass_bearing(center1, center2)
        
        # Determine direction based on bearing
        if 0 <= bearing < 22.5 or 337.5 <= bearing < 360:
            hint = "north"
        elif 22.5 <= bearing < 67.5:
            hint = "north_east"
        elif 67.5 <= bearing < 112.5:
            hint = "east"
        elif 112.5 <= bearing < 157.5:
            hint = "south_east"
        elif 157.5 <= bearing < 202.5:
            hint = "south"
        elif 202.5 <= bearing < 247.5:
            hint = "south_west"
        elif 247.5 <= bearing < 292.5:
            hint = "west"
        elif 292.5 <= bearing < 337.5:
            hint = "north_west"
            
        return hint

# Function to calculate initial bearing
def calculate_initial_compass_bearing(coord1, coord2):
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    
    phi1 = radians(lat1)
    phi2 = radians(lat2)
    delta_lambda = radians(lon2 - lon1)
    
    x = sin(delta_lambda) * cos(phi2)
    y = cos(phi1) * sin(phi2) - (sin(phi1) * cos(phi2) * cos(delta_lambda))
    
    initial_bearing = atan2(x, y)
    initial_bearing = degrees(initial_bearing)
    
    # Normalize to 0-360
    compass_bearing = (initial_bearing + 360) % 360
    
    return compass_bearing


# Function to calculate the similarity score between two boxes
def box_similarity(box1, box2):
    west1, south1, east1, north1 = box1
    west2, south2, east2, north2 = box2
    
    if east1 < west2 or east2 < west1 or north1 < south2 or north2 < south1:
        # Boxes do not overlap
        center1 = ((north1 + south1) / 2, (west1 + east1) / 2)
        center2 = ((north2 + south2) / 2, (west2 + east2) / 2)
        distance = haversine_distance(center1, center2)
        max_distance = 2000  # km
        score = (1 - min(distance, max_distance) / max_distance) * 50
    else:
        # Boxes overlap
        jaccard = jaccard_similarity(box1, box2)
        if jaccard >= 0.9:
            score = 100
        else:
            score = 50 + (min(jaccard, 0.9) / 0.9 * 50)
    
    return round(score)

def check_answer(user_answer):
    con = MongoClient(utils.MONGODB_URL)
    db = con.ucrstar
    quiz = db.game.find_one({"date": str(utils.TODAY)})
    answer = {"main": quiz["answer_stats"], "other": quiz["alternate_answer"]}
    con.close()
    result = {}
    if user_answer["other"] == answer["other"]:
      result["score"] = 100
      result["hint"] = "win"
      return result

    user_box = (user_answer["bottom_left"][0], user_answer["bottom_left"][1], user_answer["top_right"][0], user_answer["top_right"][1])
    answer_box = (answer["main"]["bottom_left"][0], answer["main"]["bottom_left"][1], answer["main"]["top_right"][0], answer["main"]["top_right"][1])
    score = box_similarity(user_box, answer_box)
    if (score == 100):
        hint = "win"
    else:
        hint = navigate_box(user_box, answer_box)
    result["score"] = score
    result["hint"] = hint
    return result

current = cgi.FieldStorage()
bottom_left = current.getvalue('bottom_left')
top_right = current.getvalue('top_right')
other = current.getvalue('other')

user_answer = {
    "bottom_left": [float(i) for i in bottom_left.split(',')],
    "top_right": [float(i) for i in top_right.split(',')],
    "other": other
}

result = check_answer(user_answer)

print("Status: 200 OK")
print("Content-Type: application/json")
print("Access-Control-Allow-Origin: *")
print()
print(json.JSONEncoder().encode({"response": result}))
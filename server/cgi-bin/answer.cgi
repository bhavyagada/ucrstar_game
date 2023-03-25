#!/usr/bin/env python3

import os
import math
import utils
import cgi
import json
import logging
from pymongo import MongoClient

# for debugging
log_file = os.path.join(os.getcwd(), "server.log")
logging.basicConfig(filename=log_file, level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")

current = cgi.FieldStorage()
bottom_left = current.getvalue('bottom_left')
top_right = current.getvalue('top_right')
other = current.getvalue('other')

user_answer = {
    "bottom_left": [float(i) for i in bottom_left.split(',')],
    "top_right": [float(i) for i in top_right.split(',')],
    "other": other
}

def to_radians(angle):
    return angle * math.pi / 180

def calculate_score(input, input_start, input_end, output_start, output_end):
    slope = (output_end - output_start) / (input_end - input_start)
    return math.ceil(output_start + slope * (input - input_start))

def calculate_distance(c1, c2):
    # references for haversine distance formula
    # https://github.com/openlayers/openlayers/blob/v7.2.2/src/ol/sphere.js#L34
    # https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula/27943#27943

    # radius = 6371008.8 / 1000.0
    radius = 6371008.8 / 1000.0
    lat1 = to_radians(c1[1])
    lat2 = to_radians(c2[1])
    delta_lat_by_2 = (lat2 - lat1) / 2
    delta_lon_by_2 = to_radians(c2[0] - c1[0]) / 2
    a = math.sin(delta_lat_by_2) * math.sin(delta_lat_by_2) + math.sin(delta_lon_by_2) * math.sin(delta_lon_by_2) * math.cos(lat1) * math.cos(lat2)
    
    return 2 * radius * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def get_other_box_details(x1, y1, x2, y2):
    center = [(x1 + x2) / 2, (y1 + y2) / 2]
    area = (x2 - x1) * (y2 - y1)

    return center, area

def intersects(x1, y1, x2, y2, x3, y3, x4, y4):
    # if rectangle area is 0
    if x1 == x2 or y1 == y2 or x3 == x4 or y3 == y4:
        return False
    # if one rectangles is on the left or right of another
    if x1 > x4 or x3 > x2:
        return False
    # if one rectangle is on the top or bottom of another
    if y3 > y2 or y1 > y4:
        return False
    
    return True

def zooms(x1, y1, x2, y2, x3, y3, x4, y4, x5, y5, x6, y6):
    # if answer rectangle is entirely contained
    if x3 == x5 and x4 == x6 and y3 == y5 and y4 == y6:
        return True, "in"
    if x1 == x5 and x2 == x6 and y1 == y5 and y2 == y6:
        return True, "out"
    return False, ""

def get_stats(user_answer, answer):
    result = {}

    if user_answer["other"] == answer["other"]:
        result["score"] = 100
        result["hint"] = "win"
        return result

    # https://www.analytics-link.com/post/2018/08/21/calculating-the-compass-direction-between-two-points-in-python
    directions = ["west", "south_west", "south", "south_east", "east", "north_east", "north", "north_west", "west"]

    x1 = user_answer["bottom_left"][0]
    y1 = user_answer["bottom_left"][1]
    x2 = user_answer["top_right"][0]
    y2 = user_answer["top_right"][1]
    x3 = answer["main"]["bottom_left"][0]
    y3 = answer["main"]["bottom_left"][1]
    x4 = answer["main"]["top_right"][0]
    y4 = answer["main"]["top_right"][1]

    user_center, user_area = get_other_box_details(x1, y1, x2, y2)
    ans_center, ans_area = get_other_box_details(x3, y3, x4, y4)

    x5 = max(x1, x3)
    y5 = max(y1, y3)
    x6 = min(x2, x4)
    y6 = min(y2, y4)
    
    ans_ratio = (x4 - x3) / (y4 - y3)
    user_ratio = (x2 - x1) / (y2 - y1)

    max_index = 0.95
    if ans_ratio < user_ratio:
        max_index = (ans_ratio / user_ratio) - 0.05
    else:
        max_index = (user_ratio / ans_ratio) - 0.05

    intersection_area = (x6 - x5) * (y6 - y5)
    jaccard_index = intersection_area / (user_area + ans_area - intersection_area)

    overlap = intersects(x1, y1, x2, y2, x3, y3, x4, y4)
    zoom, direction = zooms(x1, y1, x2, y2, x3, y3, x4, y4, x5, y5, x6, y6)

    angle = math.degrees(math.atan2(user_center[1] - ans_center[1], user_center[0] - ans_center[0]))
    if angle < 0:
        angle += 360 # convert negative degrees to the positive range of 0-360
    
    if overlap:
        result["user_ratio"] = user_ratio
        result["ans_ratio"] = ans_ratio
        result["max_index"] = max_index
        result["score"] = 0
        result["overlap"] = overlap
        jaccard_index_threshold = 0.005
        result["jaccard_index_threshold"] = jaccard_index_threshold
        if zoom and direction == "in": 
            if jaccard_index_threshold <= jaccard_index <= max_index:
                score = calculate_score(jaccard_index, jaccard_index_threshold, max_index, 50.0, 100.0)
                result["index"] = jaccard_index
                result["hint"] = "zoom_in"
                result["score"] = score
                return result
            if jaccard_index < jaccard_index_threshold:
                result["index"] = jaccard_index
                result["score"] = 0
                result["hint"] = "zoom_in"
                return result
            if jaccard_index > max_index:
                result["index"] = jaccard_index
                result["score"] = 100
                result["hint"] = "win"
                return result
        elif zoom and direction == "out":
            if jaccard_index <= max_index:
                score = calculate_score(jaccard_index, 0.0, max_index, 50.0, 100.0)
                result["hint"] = "zoom_out"
            else:
                score = 100
                result["hint"] = "win"
            result["index"] = jaccard_index
            result["score"] = score
            return result
        else:
            if jaccard_index <= max_index:
                score = calculate_score(jaccard_index, 0.0, max_index, 50.0, 100.0)
                result["hint"] = directions[round(angle / 45)]
            else:
                score = 100
                result["hint"] = "win"
            result["index"] = jaccard_index
            result["score"] = score
            return result
    else:
        result["overlap"] = False
        distance = calculate_distance(user_center, ans_center)
        # distance_threshold = math.ceil(ans_area) * 20
        distance_threshold = 1000
        result["distance_threshold"] = distance_threshold
        if distance <= distance_threshold:
            score = calculate_score(distance, distance_threshold, 1.0, 0.0, 50.0)
        else:
            score = 0
        result["distance"] = distance
        result["score"] = score
        result["hint"] = directions[round(angle / 45)]
        return result

def check_answer(user_answer):
    con = MongoClient(utils.MONGODB_URL)
    db = con.ucrstar
    quiz = db.game.find_one({"date": str(utils.TODAY)})
    answer = {"main": quiz["answer_stats"], "other": quiz["alternate_answer"]}
    con.close()
    return get_stats(user_answer, answer)

result = check_answer(user_answer)

print("Status: 200 OK")
print("Content-Type: application/json")
print("Access-Control-Allow-Origin: *")
print()
print(json.JSONEncoder().encode({"response": result}))
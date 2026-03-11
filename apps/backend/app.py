from flask import Flask, jsonify
import redis
# @Saatwik for the unique session id - we can use any version 4 or 5. Let's stick on to version 4 da.
import uuid 

app =Flask("backend_app")
redis_cache_for_backend =redis.Redis(host='localhost',port=6379, decode_responses=True) #1 hour expiry for sessions

@app.route("/uni/create-session", methods=["POST"])
def create_session_for_user():
    session_id =str(uuid.uuid4()) #Mentioned above @Saatwik
    redis_cache_for_backend.set(session_id, "active",ex=3600)
    return jsonify({"session_id": session_id}, {"code": 201},{"message": "Session created successfully!"},)


@app.route("/uni/validate-session/<session_id>", methods=["GET"])
def validate_session(session_id):
    session_status =redis_cache_for_backend.get(session_id)
    if session_status is None:
        return jsonify({"code": 404}, {"Error": "Your session doesn't exist. Please create a new session."})
    return jsonify({"session_id": session_id}, {"code": 200},{"message": f"The session: {session_id} is valid!"})

if __name__ == "__main__":
    app.run(debug=True)

#Note: @Saatwik, we can also add a route to delete a session if needed. Also I have attached screenshots of the API testing from bash under assets folder which we will need it for sure.

from flask import Flask, jsonify
import redis
import uuid 

app =Flask("backend_app")
redis_cache_for_backend =redis.Redis(
    host='localhost',port=6379, decode_responses=True) #1 hour expiry for sessions

@app.route("/api/create-session", methods=["POST"])
def create_session_for_user():
    session_id =str(uuid.uuid4())
    redis_cache_for_backend.set(session_id, "active",ex=3600)
    return jsonify({"session_id": session_id}, {"code": 201},{"message": f"Session created successfully!!. Your session time is active for 1 hour."},)


@app.route("/api/validate-session/<session_id>", methods=["GET"])
def validate_session(session_id):
    session_status =redis_cache_for_backend.get(session_id)
    if session_status is None:
        return jsonify({"code": 404}, {"Error": "Your session doesn't exist. Please create a new session."})
    return jsonify({"session_id": session_id}, {"code": 200},{"message": f"The session: {session_id} is valid!"})

if __name__ == "__main__":
    app.run(debug=True)
# visualizer# visualizer

## Architecture Overview

- We are building a system which exposes a **universal backend endpoint (`/uni`)** that handles all incoming requests from users.  
- A **new session gets created** for each new request arrival and we store this session information along with LLM response in **Redis cache**, and **spins up an AI agent** for that interaction.    
- We use a separate **`/get-session` endpoint** that allows the system to retrieve all the existing session data from Redis as per each anonymous user.
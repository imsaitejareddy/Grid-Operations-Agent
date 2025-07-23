from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import time
import json
from agent_logic import agent_app
import kb_manager

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

mock_anomaly_feed = [
    { "id": 1, "type": "Performance Degradation", "description": "Turbine #4 is consistently producing 15% less power than the theoretical curve predicts.", "short_desc": "Underperformance on Turbine #4." },
    { "id": 2, "type": "Grid Anomaly", "description": "On 2018-09-05, the turbine's active power was 0 kW despite high wind speed.", "short_desc": "Zero power output with high wind." },
    { "id": 3, "type": "System Health Alert", "description": "Turbine #2 reporting intermittent blade pitch errors.", "short_desc": "Blade pitch errors on Turbine #2." }
]

@app.route('/api/events')
def get_events():
    return jsonify(mock_anomaly_feed)

@app.route('/api/investigate', methods=['POST'])
def investigate():
    data = request.get_json()
    event_description = data.get('event')
    def stream_events():
        initial_input = {"anomaly_description": event_description}
        for step in agent_app.stream(initial_input):
            node_name = list(step.keys())[0]
            sse_data = f"data: {json.dumps({node_name: step[node_name]})}\n\n"
            yield sse_data
            time.sleep(1)
    return Response(stream_events(), mimetype='text/event-stream')

@app.route('/api/logs', methods=['GET'])
def get_logs():
    all_logs = kb_manager.get_all_logs()
    return jsonify(all_logs)

@app.route('/api/log', methods=['POST'])
def handle_log():
    log_entry = request.get_json().get('log_message')
    if not log_entry:
        return jsonify({"status": "error", "message": "No message provided"}), 400
    kb_manager.add_log_entry(log_entry)
    return jsonify({"status": "success", "message": "Log added and knowledge base updated."})

if __name__ == '__main__':
    app.run(debug=True, threaded=True)

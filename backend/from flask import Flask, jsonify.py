from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/test')
def test_connection():
    return jsonify({"message": "Backend is connected successfully!"})

if __name__ == '__main__':
    app.run(debug=True)

#!/Library/Frameworks/Python.framework/Versions/3.13/bin/python3

from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import setproctitle

setproctitle.setproctitle("gemini_server")

app = Flask(__name__)
CORS(app)

GOOGLE_API_KEY = "REDACTED"
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize the model with a specific prompt for classification
model = genai.GenerativeModel("gemini-1.5-flash")
chat = model.start_chat(
    history=[
        {"role": "user", "parts": "You are a classifier that determines if a YouTube title represents potentially distracting content. Respond with only a score (from 0-1) of your confidence that the title is for a distracting video. Consider as distracting: entertainment, gaming, memes, viral content, drama, reactions, etc. Consider as non-distracting: educational, documentary, tutorials, lectures, news, etc."},
        {"role": "model", "parts": "Understood. I will give YouTube titles a number score (from 0-1) for how confident I am that the video has distracting content (ex: 0.8)."},
    ]
)

@app.route('/classify', methods=['POST'])
def classify_title():
    try:
        data = request.get_json()
        
        if not data or 'title' not in data:
            return jsonify({'error': 'Missing title in request body'}), 400
        
        youtube_title = data['title']
        
        # Get classification from Gemini
        response = chat.send_message(f"Is this YouTube title distracting? Title: {youtube_title}")
        
        # Extract just the yes/no from response
        confidence_score = float(response.text.strip().lower())

        if not 0. <= confidence_score <= 1.:
            confidence_score = 1. if confidence_score > 1 else 0.
        
        return jsonify({
            'confidence': confidence_score
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
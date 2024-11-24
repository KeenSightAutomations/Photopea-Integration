from flask import Flask, request, jsonify, send_from_directory
import os
from flask_cors import CORS
import time
import json


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Directory to store uploaded images
EXPORT_DIR = "exported_images"

# Ensure the directory exists
if not os.path.exists(EXPORT_DIR):
    os.makedirs(EXPORT_DIR)


@app.route('/<path:filename>', methods=['GET'])
def download_file(filename):
    """
    Download a specific file from the current directory.
    """
    try:
        # Serve the file from the current directory
        return send_from_directory('.', filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

@app.route('/', methods=['POST'])
def save_from_photopea():
    try:
        # Read the first 2000 bytes for JSON data
        raw_data = request.get_data()
        json_data = raw_data[:2000]
        payload = json.loads(json_data.decode("utf-8"))

        # Get file versions from JSON data
        versions = payload.get("versions", [])
        source = payload.get("source", "local,0,unknown")

        # Determine filename
        if source.startswith("local"):
            _, _, name = source.split(",")
        else:
            name = source.split("/")[-1]

        # Save each version of the file
        for version in versions:
            format_name = version["format"]
            start = version["start"]
            size = version["size"]
            file_data = raw_data[2000 + start : 2000 + start + size]

            # File path
            timestamp = int(time.time() * 1000)
            file_path = os.path.join(EXPORT_DIR, f"export_{name.split('.')[0]}_{timestamp}.{format_name}")
            with open(file_path, "wb") as f:
                f.write(file_data)

        return jsonify({"message": "Files saved successfully", "files": [f"{name}.{v['format']}" for v in versions]}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)


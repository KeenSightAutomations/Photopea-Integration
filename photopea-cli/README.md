# Flask Photopea Integration API

A simple Flask API to integrate with Photopea for uploading, saving, and managing files. This app supports:

Receiving binary files from Photopea via POST requests.
Saving files in multiple formats (e.g., PNG, JPG, PSD) to a server.
Cross-Origin Resource Sharing (CORS) with Access-Control-Allow-Origin: *.

# Prerequisites
* Python 3: Ensure Python 3.x is installed on your machine.
* Web Browser: The script uses the default web browser to open Photopea.(I use Google Chrome and it works correctly on it and not sure if it work to other browsers so make sure google chrome is default browser)


# Installation:
* Install the following dependencies:
    ```
    pip3 install flask flask-cors
    ```


# How To run:

## Run a Flask Server
* In the terminal, navigate to the directory where your images and PSD file are located, and make sure to copy the app.py file and paste it into your working directory.
* Start Flask server:
    ```
    cd Photopea-Integration/photopea-cli
    python3 app.py
    ```

## Execute the Script
* Run the script from the command line
    ```
    Usage: python3 script.py <psd_file_path> <input_directory>
    Ex: python3 script.py smartObject.psd input
    ```
* Replace <psd_file_path> with the path to your PSD file (e.g., smartObject.psd).
* Replace <input_directory> with the path to the folder containing the images you want to insert into the PSD file (e.g., input)

## Features
### Save Files from Photopea:

* Accepts POST requests from Photopea.
* Extracts files in specified formats (e.g., PNG, JPG, PSD) and saves them locally in the exported_images directory.

### Cross-Origin Resource Sharing (CORS):

* Fully enabled with Access-Control-Allow-Origin: *, allowing requests from any origin.

# Photopea using CLI

# Prerequisites
* Python 3: Ensure Python 3.x is installed on your machine.
* Local HTTP Server: The script assumes you are running a local HTTP server (using Python's built-in http.server module) to serve your images and PSD files. Make sure to run it in the same directory that contains the PSD file and the input directory of images.
* Web Browser: The script uses the default web browser to open Photopea.(I use Google Chrome and it work correctly and not sure if it work to other browsers or not so make sure google chrome is default browser)
* install this extension on default browser and make it ON (to resolve problem related with cross origin):
    https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf


# How To run

## Run a Local HTTP Server
* In the terminal, navigate to the folder where your images and PSD file are located.
* Start a local HTTP server to serve the files using the following command:
    ```
    cd Photopea-Integration/photopea-cli
    python3 -m http.server 8000
    ```

## Execute the Script
* Run the script from the command line
    ```
    Usage: python3 script.py <psd_file_path> <input_directory>
    Ex: python3 script.py smartObject.psd input
    ```
* Replace <psd_file_path> with the path to your PSD file (e.g., smartObject.psd).
* Replace <input_directory> with the path to the folder containing the images you want to insert into the PSD file (e.g., input)

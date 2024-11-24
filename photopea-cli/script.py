import os
import urllib.parse
import webbrowser
import json
import time
import sys


# Function to open PSD file in Photopea
def send_script_to_photopea(imagePath, psd_file_path, server_url, script):
    # Prepare the JSON configuration
    config = {
        "files": [f"{server_url}/{imagePath}",f"{server_url}/{psd_file_path}"],
        "server": {
            "version": 1,
            "url": server_url,
            "formats": ["jpg:1"]
        },
        "script": script
    }

    # Convert the config to JSON and encode it as a URL parameter
    json_config = json.dumps(config)
    encoded_config = urllib.parse.quote(json_config)

    # Construct the full URL to open in the browser
    url = f"https://www.photopea.com#{encoded_config}"

    # Open the URL in the browser
    webbrowser.open(url)


# Function to process images in a folder
def process_images_in_folder(imagePath, psd_file_path, server_url):
    """Process all images in the folder."""
    # Open the PSD file in Photopea
    timestamp = int(time.time() * 1000)
    commands = [
        '''
        var smartObjectLayer = null;
        var psdDoc = app.documents[1];
        app.aactiveDocument = psdDoc
        var lays = app.activeDocument.layers;
        for(var i=0; i< lays.length; i++)
        {
            smartObjectLayer = lays[i]
            if (smartObjectLayer.kind === LayerKind.SMARTOBJECT){
                alert("smartObjectLayer: " + smartObjectLayer.name + ' Num ' + i)
                break;
            }
        }
        if (!smartObjectLayer || smartObjectLayer.kind != LayerKind.SMARTOBJECT) {
                alert("Image Opened");
            }
        else {
        ''',
            'app.activeDocument.activeLayer = app.activeDocument.layers[i];'
            'var idEditContents = stringIDToTypeID("placedLayerEditContents");',
            'var desc = new ActionDescriptor();',
            'executeAction(idEditContents, desc, DialogModes.NO);',
            '''
            var imageDoc = app.documents[0];
            var smartLayer = app.documents[2];
            app.activeDocument = imageDoc;
            imageDoc.activeLayer.copy(); 
            app.activeDocument = smartLayer;
            smartLayer.paste();

            var soDoc = app.activeDocument;
            var placedLayer = soDoc.activeLayer;  
            var soWidth = soDoc.width;
            var soHeight = soDoc.height;
            var imgWidth = placedLayer.bounds[2] - placedLayer.bounds[0];
            var imgHeight = placedLayer.bounds[3] - placedLayer.bounds[1];
            
            var soRatio = soWidth / soHeight;
            var imgRatio = imgWidth / imgHeight;
            var scalePercentage;

            if (imgRatio > soRatio) {
                scalePercentage = (soHeight / imgHeight) * 100;
            } else {
                scalePercentage = (soWidth / imgWidth) * 100;
            }
            placedLayer.resize(scalePercentage, scalePercentage, AnchorPosition.MIDDLECENTER);
            
            // Clean up extra layers if necessary
            var nowDoc = app.activeDocument;
            while (nowDoc.layers.length > 1) {
                nowDoc.layers[1].remove();  // Remove the original layer if it's not the smart object layer
            }
            
            app.activeDocument.save();
            app.activeDocument.close();
            app.activeDocument = app.documents[1];

            app.activeDocument.save();
            '''
            

            # 'var exportOptions = new ExportOptionsSaveForWeb();',
            # 'exportOptions.format = SaveDocumentType.JPEG;',
            # 'exportOptions.quality = 100;',
            # f'var outputName = "export_{timestamp}.jpg";',
            # 'app.activeDocument.exportDocument(new File(outputName), ExportType.SAVEFORWEB, exportOptions);',
        '}'
    ]

    send_script_to_photopea(imagePath, psd_file_path, server_url, ";".join(commands))
    time.sleep(5)



# Main function
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 script.py <psd_file> <input_directory>")
        sys.exit(1)

    psd_file_path = sys.argv[1]  # Path to your PSD file
    input_dir = sys.argv[2]  # Folder containing images to insert
    port = 8000
    server_url = f"http://localhost:{port}"

    files = os.listdir(input_dir)

    for file in files:
        file_path = input_dir + '/' + file
        print(file_path)
        process_images_in_folder(file_path, psd_file_path, server_url)



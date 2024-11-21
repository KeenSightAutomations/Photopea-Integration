let photopeaFrame = document.getElementById('photopeaFrame');

let notificationDiv = document.getElementById('notification');

let outputImage = document.getElementById('outputImage');
let outputFolderHandle = null; // To store the selected folder handle
let inputFolderHandle = null; // To store the selected input folder handle
let currentFile = null;
let activeLayer =  null;
let NumActiveLayer = null;

function showNotification(message, type = 'info') {
    // Set message and class based on type
    notificationDiv.textContent = message;
    notificationDiv.className = `notification ${type}`;
    notificationDiv.style.display = 'block';

    // Hide the notification after 4 seconds
    setTimeout(() => {
        notificationDiv.style.display = 'none';
    }, 4000);
}

async function ensureFolderPermission(folderHandle) {
    const permission = await folderHandle.queryPermission({ mode: 'readwrite' });
    if (permission === 'granted') return true;

    const request = await folderHandle.requestPermission({ mode: 'readwrite' });
    return request === 'granted';
}


async function selectOutputFolder() {
    try {
        outputFolderHandle = await window.showDirectoryPicker();
        const hasPermission = await ensureFolderPermission(outputFolderHandle);
        if (!hasPermission) {
            alert("Permission denied. Please grant permission to the folder.");
        }
        showNotification('Output folder selected successfully.', 'success');
    } catch (error) {
        showNotification('Folder selection failed. Make sure you use chrome or edge browser', 'error');
        console.error(error);
    }
}

async function selectInputFolder() {
    try {
        inputFolderHandle = await window.showDirectoryPicker();
        showNotification('Input folder selected successfully.', 'success');
    } catch (error) {
        showNotification('Folder selection failed. Make sure you use chrome or edge browser', 'error');
        console.error(error);
    }
}

async function getFilesFromFolder(folderHandle) {
    const files = [];
    for await (const [name, handle] of folderHandle) {
        if (handle.kind === 'file' && /\.(png|jpg|jpeg)$/i.test(name)) {
            files.push(handle);
        }
    }
    console.log(files);
    return files;
}

async function saveToFolder(data, fileName) {
    if (!outputFolderHandle) {
        showNotification('Output folder not selected. Please select a folder first.', 'error');
        return;
    }

    try {
        const exportName = `export_${fileName}_${Date.now()}.jpg`;
        const fileHandle = await outputFolderHandle.getFileHandle(exportName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
        showNotification(`Image saved successfully as ${exportName}`, 'success');
    } catch (error) {
        showNotification('Failed to save image to the selected folder.', 'error');
        console.error(error);
    }
}   

function handleExportedImage(data, fileName) {
    const blob = new Blob([data], { type: 'image/jpg' });
    saveToFolder(blob, fileName);
}


async function readFileAsBase64(fileHandle) {
    const file = await fileHandle.getFile();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function openPSD(file) {
    try {
        console.log('Processing psd:', file.name);
        const base64Data = await fileToBase64(file);
        // console.log(base64Data)
        
        // Script to handle image processing in smart object
        const commands = [
            // Open the image file
            'app.open("' + base64Data + '", null, true)',
            
        ];
        const script = commands.join(';');
        photopeaFrame.contentWindow.postMessage(script, "*");
    } catch (error) {
        console.error('Error processing image:', error);
        showNotification('Error processing PSD: ' + error.message, 'error');
    }
}

function selectActiveLayer() {
    const commands = [
        `
        var lays = app.activeDocument.layers;
        for(var i=0; i< lays.length; i++)
        {
            var smartObjectLayer = lays[i]
            if (smartObjectLayer.kind === LayerKind.SMARTOBJECT){
                app.echoToOE("smartObjectLayer: " + smartObjectLayer.name + ' Num ' + i)
                break;
            }
        }
        `,
        
    ];
    photopeaFrame.contentWindow.postMessage(commands.join(';'), '*');
}

function insertImageIntoSmartObject() {
    showNotification('Please wait, processing your image...');
    const commands = [
            `app.activeDocument.activeLayer = app.activeDocument.layers[${NumActiveLayer}];`,
            'var smartObjectLayer = app.activeDocument.activeLayer;',            
            `if (!smartObjectLayer || smartObjectLayer.kind != LayerKind.SMARTOBJECT) {
                alert("Please select a valid Smart Object layer.");
            }`
            ,
            'var idEditContents = stringIDToTypeID("placedLayerEditContents");',
            'var desc = new ActionDescriptor();',
            'executeAction(idEditContents, desc, DialogModes.NO);',
    ];
    photopeaFrame.contentWindow.postMessage(commands.join(';'), '*');
}


async function openImage(fileHandle) {
    const base64Data = await readFileAsBase64(fileHandle);

    const commands = [
            'var newDoc = app.activeDocument;',
            'app.open("' + base64Data + '", null, true);',
    ];
    photopeaFrame.contentWindow.postMessage(commands.join(';'), '*');
}

function reziseImage() {
    const commands = [
        // Automatically save the active document
        'alert("rezise Image");',
        'var soDoc = app.activeDocument;',
        'var placedLayer = soDoc.activeLayer;', // Save the document
        'var widthScale = (soDoc.width / placedLayer.bounds[2]) * 100;',
        'var hightScale = (soDoc.height / placedLayer.bounds[3]) * 100;',
        'placedLayer.resize(widthScale , hightScale, AnchorPosition.MIDDLECENTER);'
    ];
    photopeaFrame.contentWindow.postMessage(commands.join(';'), '*');
}

function reziseImage_v2() {
    const commands = [
        // Automatically save the active document
        'alert("reziseImage");',
        'var soDoc = app.activeDocument;', // Reference the smart object document
        'var placedLayer = soDoc.activeLayer;', // Reference the active layer
        'var soWidth = soDoc.width;', // Get smart object width
        'var soHeight = soDoc.height;', // Get smart object height',
        'var layerBounds = placedLayer.bounds;', // Get layer bounds',
        'var layerWidth = layerBounds[2] - layerBounds[0];', // Calculate layer width
        'var layerHeight = layerBounds[3] - layerBounds[1];', // Calculate layer height',
        
        // Calculate scaling factors while preserving the aspect ratio
        'var widthScale = (soWidth / layerWidth) * 100;',
        'var heightScale = (soHeight / layerHeight) * 100;',
        'var scaleFactor = Math.min(widthScale, heightScale);', // Choose the smaller factor to fit
        
        // Resize the layer with the calculated scale factor
        'placedLayer.resize(scaleFactor, scaleFactor, AnchorPosition.MIDDLECENTER);'
    ];
    photopeaFrame.contentWindow.postMessage(commands.join(';'), '*');
}

function reziseImage_v3(fitType = "contain") {
    const commands = [
        // Define variables
        'var soDoc = app.activeDocument;',
        'var placedLayer = soDoc.activeLayer;',
        
        // Get dimensions
        'var soWidth = soDoc.width;',
        'var soHeight = soDoc.height;',
        'var imgWidth = placedLayer.bounds[2] - placedLayer.bounds[0];',
        'var imgHeight = placedLayer.bounds[3] - placedLayer.bounds[1];',
        
        // Calculate aspect ratios
        'var soRatio = soWidth / soHeight;',
        'var imgRatio = imgWidth / imgHeight;',
        
        // Initialize scalePercentage
        'var scalePercentage;',
        
        // Fit type handling
        fitType === "contain"
            ? `
                if (imgRatio > soRatio) {
                    scalePercentage = (soWidth / imgWidth) * 100;
                } else {
                    scalePercentage = (soHeight / imgHeight) * 100;
                }
            `
            : fitType === "cover"
            ? `
                if (imgRatio > soRatio) {
                    scalePercentage = (soHeight / imgHeight) * 100;
                } else {
                    scalePercentage = (soWidth / imgWidth) * 100;
                }
            `
            : fitType === "stretch"
            ? `
                placedLayer.resize(
                    (soWidth / imgWidth) * 100,
                    (soHeight / imgHeight) * 100,
                    AnchorPosition.MIDDLECENTER
                );
                app.echoToOE("Stretch applied");
                return;
            `
            : `
                app.echoToOE("Invalid fitType");
                return;
            `,
        
        // Apply the uniform scale
        
        `if (scalePercentage) {
            placedLayer.resize(scalePercentage, scalePercentage, AnchorPosition.MIDDLECENTER);
        }
        app.echoToOE("Image resized successfully with fitType: ${fitType}");`
        
    ];
    photopeaFrame.contentWindow.postMessage(commands.join(';'), '*');
}

function clearSmartObjectContent() {
    const commands = [
        'var soDoc = app.activeDocument;', // Reference the smart object document
        'while (soDoc.layers.length > 1) {',
        '   soDoc.layers[1].remove();', // Delete all layers
        '}',
        'app.echoToOE("Smart object content cleared");'
    ];
    photopeaFrame.contentWindow.postMessage(commands.join(';'), '*');
}

function saveDocument() {
    const commands = [
        // Automatically save the active document
        'var activeDocument = app.activeDocument;',
        'activeDocument.save();', // Save the document
        'activeDocument.close();',
        'app.echoToOE("Processing Complete");' // Notify success
    ];
    photopeaFrame.contentWindow.postMessage(commands.join(';'), '*');
}

function closeDocument() {
    const commands = [
        // Automatically save the active document
        'var activeDocument = app.activeDocument;',
        'activeDocument.close();',
        'app.echoToOE("Processing Complete");' // Notify success
    ];
    photopeaFrame.contentWindow.postMessage(commands.join(';'), '*');
}


function exportImage(fileName) {
    const commands = [
        // Save the current active document to Output Environment as a jpg
        
        `var activeDocument = app.activeDocument;
        if (activeDocument) {
            activeDocument.saveToOE("jpg"); // Save the active document as jpg
            app.echoToOE('${fileName}'); // Send a success message
        } else {
            app.echoToOE("Error: No active document to export."); // Notify error if no document
        }`
        
    ];
    photopeaFrame.contentWindow.postMessage(commands.join(';'), '*');
}


async function processImage(fileName) {

    currentFile = fileName.name.split('.')[0];

    insertImageIntoSmartObject()
    await openImage(fileName);
    await new Promise(resolve => setTimeout(resolve, 4000));
    // reziseImage()
    reziseImage_v3("cover");
    await new Promise(resolve => setTimeout(resolve, 2000));
    clearSmartObjectContent();
    await new Promise(resolve => setTimeout(resolve, 2000));
    saveDocument()
    await new Promise(resolve => setTimeout(resolve, 2000));
    exportImage(fileName);
    await new Promise(resolve => setTimeout(resolve, 2000));
}


async function processAllImages() {
    const file = document.getElementById('psdFile').files[0];
        if (!file) {
            showNotification('Please select a PSD file', 'error');
            return;
        }

    if (!inputFolderHandle) {
        showNotification('Input folder not selected. Please select an input folder first.', 'error');
        return;
    }
    if (!outputFolderHandle) {
        showNotification('Output folder not selected. Please select an output folder first.', 'error');
        return;
    }


    const files = await getFilesFromFolder(inputFolderHandle);

    if (files.length === 0) {
        showNotification('No images found in the selected input folder.', 'error');
        return;
    }

    await openPSD(file);
    await new Promise(resolve => setTimeout(resolve, 10000));
    selectActiveLayer()
    await new Promise(resolve => setTimeout(resolve, 1500));

    showNotification('Processing images...');
    for (const fileHandle of files) {
        await processImage(fileHandle);
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    closeDocument()

    showNotification('All images processed and saved successfully.', 'success');
}


window.addEventListener('message', function(e) {
    if (e.origin === 'https://www.photopea.com') {
        if (typeof e.data === 'string') {
            if (typeof e.data === 'string') {
                if (e.data.startsWith('smartObjectLayer:')){
                    const layerData = e.data.split(' Num ');
                    activeLayer = layerData[0].replace('smartObjectLayer: ', '').trim();
                    NumActiveLayer = parseInt(layerData[1].trim());
                    console.log('Extracted layer name:', activeLayer);
                }
            }
            if (e.data.startsWith('Error')){
                showNotification(e.data, 'error')
            }
        } else if (e.data && e.data.error) {
            showNotification('Error processing image: ' + error.message, 'error');
        } else if (e.data instanceof ArrayBuffer) {
            handleExportedImage(e.data, currentFile);
            showNotification('Image downloaded successfully.');
        }
    }
});

photopeaFrame.onload = function() {
    showNotification('Ready - Please load your mockup template in Photopea');
};
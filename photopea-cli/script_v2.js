const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    // Parse command-line arguments for input and output folder
    const [,, psdFilePath, inputFolder, outputFolder] = process.argv;

    if (!psdFilePath || !inputFolder || !outputFolder) {
        console.error("Usage: node index.js <psdFilePath> <inputFolder> <outputFolder>");
        process.exit(1);
    }

    // Ensure output folder exists
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
    }

    // Get the list of image files from the input folder
    const files = fs.readdirSync(inputFolder).filter(file => /\.(png|jpg|jpeg)$/i.test(file));

    if (files.length === 0) {
        console.error('No images found in the input folder.');
        process.exit(1);
    }

    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://www.photopea.com#');

    // Wait for Photopea to load
    await page.waitForFunction(
        () => typeof window['app'] !== 'undefined',
        { timeout: 60000 }
    );

    console.log('Photopea loaded.');

    // Inject the custom script into Photopea
    // Inject your custom Photopea script
    const customScript = fs.readFileSync(path.resolve(__dirname, 'photopea-script.js'), 'utf-8');
    await page.evaluate(customScript => {
        const scriptTag = document.createElement('script');
        scriptTag.textContent = customScript;
        document.body.appendChild(scriptTag);
    }, customScript);

    console.log('Custom Photopea script injected.');

    // Load the PSD file into Photopea
    const psdData = fs.readFileSync(psdFilePath).toString('base64');
    await page.evaluate(async (base64, fileName) => {
        const u8arr = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const fileBlob = new Blob([u8arr]);
        const file = new File([fileBlob], fileName);
        app.open(file);
    }, psdData, path.basename(psdFilePath));

    console.log('PSD file loaded.');
    await page.waitForTimeout(10000); // Adjust if needed for PSD processing

    // Process each image in the input folder
    for (const file of files) {
        const filePath = path.join(inputFolder, file);
        console.log(`Processing ${filePath}...`);

        // Read image file and convert to Base64
        const fileData = fs.readFileSync(filePath).toString('base64');

        await page.evaluate(async (base64, fileName) => {
            const u8arr = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const fileBlob = new Blob([u8arr]);
            const file = new File([fileBlob], fileName);

            // Inject the image into the smart object and process
            await insertImageIntoSmartObject();
            await app.open(file);

            // Resize, clear content, save, and export
            reziseImage_v3("cover");
            clearSmartObjectContent();
            saveDocument();
            exportImage(fileName);
        }, fileData, file);

        // Wait for processing to complete
        await page.waitForTimeout(5000); // Adjust as needed

        console.log(`Processed: ${file}`);
    }

    console.log('All files processed successfully.');

    // Close the browser
    await browser.close();
})();

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

     // Read the PSD file as Base64
    const psdData = fs.readFileSync(psdFilePath).toString('base64');

    // Inject the file into Photopea
    await page.evaluate(async (base64, fileName) => {
        // Convert Base64 data to a file object and open it in Photopea
        const u8arr = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const fileBlob = new Blob([u8arr]);
        const file = new File([fileBlob], fileName);
        await app.open(file);
    }, psdData, path.basename(psdFilePath));

    console.log('PSD file opened successfully.');

    // Optional: Wait to observe the result in the browser
    await page.waitForTimeout(10000); // Adjust the timeout as needed

    // Close the browser
    await browser.close();
})();

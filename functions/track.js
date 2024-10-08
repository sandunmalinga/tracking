const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

async function trackShipment(trackingNumber) {
  let browser = null;
  try {
    // Launch Puppeteer with chrome-aws-lambda on Render
    browser = await puppeteer.launch({
      args: [...chrome.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath || puppeteer.executablePath(),
      headless: chrome.headless,
    });

    const page = await browser.newPage();

    // Navigate to Pronto tracking page
    await page.goto('https://www.prontolanka.lk/', { waitUntil: 'networkidle2' });

    // Enter the tracking number into #TextBox3
    await page.type('#TextBox3', trackingNumber);

    // Click the "Track" button (#LinkButton1)
    await page.evaluate(() => {
      document.querySelector('#LinkButton1').click();
    });

    // Wait for the tracking result table to load
    await page.waitForSelector('.contactForm.track-form.mb-0 table', { timeout: 10000 });

    // Add a delay to ensure the table has fully loaded
    await page.waitForTimeout(5000);

    // Extract the table HTML
    const tableHTML = await page.evaluate(() => {
      const table = document.querySelector('.contactForm.track-form.mb-0 table');
      return table ? table.outerHTML : null;
    });

    // Close browser
    await browser.close();

    // Return the extracted HTML
    return { success: true, table: tableHTML };

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('Error during tracking:', error);
    return { success: false, message: 'Error during tracking', error: error.message };
  }
}

// Lambda handler for Render.com
exports.handler = async (event) => {
  try {
    // Get tracking number from query parameters
    const trackingNumber = event.queryStringParameters.trackingNumber;

    if (!trackingNumber) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Tracking number not provided' }),
      };
    }

    // Call the trackShipment function
    const result = await trackShipment(trackingNumber);

    // Return the result
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Error during tracking', error: error.message }),
    };
  }
};

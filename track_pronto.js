const puppeteer = require('puppeteer');

async function trackShipment(trackingNumber) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the Pronto tracking page
    await page.goto('https://www.prontolanka.lk/', { waitUntil: 'networkidle2' });

    // Enter the tracking number into #TextBox3
    await page.type('#TextBox3', trackingNumber);

    // Click the "Track" button (#LinkButton1)
    await page.evaluate(() => {
      document.querySelector('#LinkButton1').click();
    });

    // Wait for the table to load
    await page.waitForSelector('.contactForm.track-form.mb-0 table', { timeout: 10000 });

    // Add a delay to ensure the table has fully loaded
    await page.waitForTimeout(5000);

    // Extract the table HTML
    const tableHTML = await page.evaluate(() => {
      const table = document.querySelector('.contactForm.track-form.mb-0 table');
      return table ? table.outerHTML : null;
    });

    await browser.close();
    return tableHTML;
  } catch (error) {
    console.error('Error while tracking shipment:', error);
    await browser.close();
    return null;
  }
}

// Get the tracking number from the command line arguments
const trackingNumber = process.argv[2];

// Ensure the trackingNumber is defined, adding a fallback for older Node.js
if (trackingNumber === undefined || trackingNumber === null) {
  console.log(JSON.stringify({ success: false, message: 'Tracking number not provided' }));
} else {
  trackShipment(trackingNumber).then((tableHTML) => {
    if (tableHTML) {
      console.log(JSON.stringify({ success: true, table: tableHTML }));
    } else {
      console.log(JSON.stringify({ success: false }));
    }
  });
}

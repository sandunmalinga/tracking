const puppeteer = require('puppeteer');
const axios = require('axios');

// Function to perform the tracking
async function trackShipments() {
  // Fetch JSON data from the URL
  try {
    const response = await axios.get('https://ebill.sanduntyre.com/pronto-tracking-number.php');
    const jsonData = response.data;

    // Extract tracking numbers from JSON data
    const trackingNumbers = jsonData.map(item => item.shipping_custom_field_1);

    const browser = await puppeteer.launch({ headless: true });

    try {
      for (const trackingNumber of trackingNumbers) {
        const page = await browser.newPage();

        // Navigate to the courier partner's website with an increased timeout or no timeout
        await page.goto('https://www.prontolanka.lk/', { timeout: 0 }); // Disable timeout

        // Enter the tracking number
        await page.type('#TextBox3', trackingNumber);

        // Click the "Track" button using JavaScript
        await page.evaluate(() => {
          document.querySelector('#LinkButton1').click();
        });

        // Wait for the table to load
        await page.waitForSelector('.contactForm.track-form.mb-0 table', { timeout: 60000 }); // Increase selector wait timeout

        // Add a delay of 5 seconds
        await page.waitForTimeout(5000);

        // Extract the content of the first row in the table
        const firstRowValues = await page.$$eval('.contactForm.track-form.mb-0 table tr:first-child td', (tds) => {
          return tds.map((td) => td.innerText.trim());
        });

        console.log(firstRowValues);

        const secondColumnValue = firstRowValues[1];

        console.log('Second Column Value:', secondColumnValue);

        // Define the desired URL with dynamic values
        const desiredUrl = `https://ebill.sanduntyre.com/pronto-current-status.php?tracking_code=${trackingNumber}&current_shipping_status=${firstRowValues.join('%20')}&now_tracking_update=${secondColumnValue}`;

        // Navigate to the desired URL
        await page.goto(desiredUrl, { timeout: 0 }); // Disable timeout

        // Close the page for the current tracking number
        await page.close();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      // Close the browser
      await browser.close();
    }
  } catch (error) {
    console.error("Error fetching JSON data:", error);
  }

  // Recursively call the function again to repeat indefinitely
  trackShipments();
}

// Start the infinite loop
trackShipments();

const puppeteer = require('puppeteer');
const axios = require('axios');

// Define the function that performs the tracking
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

        // Navigate to the courier partner's website
        await page.goto('https://www.prontolanka.lk/');

        // Enter the tracking number
        await page.type('#TextBox3', trackingNumber);

        // Click the "Track" button using JavaScript
        await page.evaluate(() => {
          document.querySelector('#LinkButton1').click();
        });

        // Wait for the table to load (you can increase the wait time if needed)
        await page.waitForSelector('.contactForm.track-form.mb-0 table');

        // Add a delay of 5 seconds (you can adjust the delay time as needed)
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
        await page.goto(desiredUrl);

        // Now you are on the desired URL page

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
}

// Set the function to run every 5 minutes
setInterval(trackShipments, 300000); // 300,000 ms = 5 minutes

// Run the function immediately on startup
trackShipments();

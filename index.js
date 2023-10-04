const puppeteer = require('puppeteer');
const axios = require('axios');


async function fetchDataAndTrack() {
  try {
    const response = await axios.get('https://ebill.sanduntyre.com/pronto-tracking-number.php');
    const jsonData = response.data;

    const trackingNumbers = jsonData.map(item => item.shipping_custom_field_1);

    const browser = await puppeteer.launch({ headless: true });

    try {
      for (const trackingNumber of trackingNumbers) {
        const page = await browser.newPage();

        await page.goto('https://www.prontolanka.lk/');

        await page.type('#TextBox3', trackingNumber);

        await page.evaluate(() => {
          document.querySelector('#LinkButton1').click();
        });

        await page.waitForSelector('.contactForm.track-form.mb-0 table');

        await page.waitForTimeout(5000);

        const firstRowValues = await page.$$eval('.contactForm.track-form.mb-0 table tr:first-child td', (tds) => {
          return tds.map((td) => td.innerText.trim());
        });

        console.log(firstRowValues);

        const secondColumnValue = firstRowValues[1];

        console.log('Second Column Value:', secondColumnValue);

       const desiredUrl = `https://ebill.sanduntyre.com/pronto-current-status.php?tracking_code=${trackingNumber}&current_shipping_status=${firstRowValues.join('%20')}&now_tracking_update=${secondColumnValue}`;

        await page.goto(desiredUrl);

        await page.close();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Error fetching JSON data:", error);
  }
}

// Initially run the function
fetchDataAndTrack();


});

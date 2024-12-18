const puppeteer = require("puppeteer");
const moment = require("moment");
const fs = require("fs").promises;
const INIT_URL =
  "https://www.welcometothejungle.com/fr/jobs?refinementList%5Boffices.country_code%5D%5B%5D=FR&refinementList%5Bcontract_type%5D%5B%5D=full_time&refinementList%5Bcontract_type%5D%5B%5D=apprenticeship&refinementList%5Bcontract_type%5D%5B%5D=temporary&query=javascript%20developer&page=1&sortBy=mostRecent";
const scrap = async () => {
  try {
    var browser = await puppeteer.launch({ headless: false });
    console.log("Browser launched.");
    const page = await browser.newPage();
    console.log("Page created.");
    await page.setRequestInterception(true);
    page.on("request", req => {
      //   console.log(req.url(), req.resourceType(), req.postData());

      // if (req.resourceType() === "stylesheet" || req.resourceType() === "image" || req.resourceType() === "font")
      if (["stylesheet", "image", "font"].includes(req.resourceType()))
        req.abort();
      else req.continue();
    });
    // load, domcontentloaded, networkidle0, networkidle2
    await page.goto(INIT_URL, { waitUntil: "networkidle2" });
    const totalJobCount = await page.$eval(
      "div[data-testid='jobs-search-results-count']",
      el => {
        return Number(el.textContent?.trim());
      }
    );
    console.log("Total job count: ", totalJobCount);

    const limitDate = moment().subtract(1, "days").toDate();
    const jobs = await page.$$eval(
      "ul[data-testid='search-results'] li",
      (arr, limitDate) => {
        return arr
          .map(el => {
            const title = el.querySelector("h4")?.textContent?.trim();
            const href = el.querySelector("a")?.href;
            const tags = [...el.querySelectorAll(".sc-bXCLTC.eFiCOk div")].map(
              t => t.textContent
            );
            console.log(title);
            const createdAt = el.querySelector("time")?.dateTime;
            return { title, href, tags, createdAt };
          })
          .filter(el => new Date(el.createdAt) > new Date(limitDate));
      },
      limitDate
    );
    console.log(jobs, jobs.length);
    await fs.writeFile(
      `./jobs-${Date.now()}.json`,
      JSON.stringify(jobs, null, 2)
    );
  } catch (error) {
    console.error(error);
  } finally {
    // browser.close()
  }
};

module.exports = { scrap };

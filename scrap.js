const puppeteer = require("puppeteer");
const moment = require("moment");
// const fs = require("fs").promises;
const INIT_URL =
  "https://www.welcometothejungle.com/fr/jobs?refinementList%5Boffices.country_code%5D%5B%5D=FR&refinementList%5Bcontract_type%5D%5B%5D=full_time&refinementList%5Bcontract_type%5D%5B%5D=apprenticeship&refinementList%5Bcontract_type%5D%5B%5D=temporary&query=javascript%20developer&page=1&sortBy=mostRecent";

const scrap = async () => {
  try {
    // Open navigator
    var browser = await puppeteer.launch({
      args: ["--accept-lang=fr-FR"],
    });
    console.log("Browser launched.");

    // Create new page
    const page = await browser.newPage();
    console.log("Page created.");

    // Enable request interception
    await page.setRequestInterception(true);
    // Listen to requests and invoke custom logic
    page.on("request", req => {
      //   console.log(req.url(), req.resourceType(), req.postData());

      // if (req.resourceType() === "stylesheet" || req.resourceType() === "image" || req.resourceType() === "font")
      if (["stylesheet", "image", "font"].includes(req.resourceType()))
        req.abort();
      else req.continue();
    });
    // load, domcontentloaded, networkidle0, networkidle2
    await page.goto(INIT_URL, { waitUntil: "networkidle2" });

    // Select and manipulate one element
    const totalJobCount = await page.$eval(
      "div[data-testid='jobs-search-results-count']",
      el => {
        return Number(el.textContent?.trim());
      }
    );
    console.log("Total job count: ", totalJobCount);

    const limitDate = moment().subtract(1, "days").toDate();

    // Select and manipulate an array of elements
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
            const createdAt = el.querySelector("time")?.dateTime;
            return { title, href, tags, createdAt };
          })
          .filter(el => new Date(el.createdAt) > new Date(limitDate));
      },
      // Pass arguments to navigator context
      limitDate
    );
    console.log("Total job data collected: ", jobs.length);
    // await fs.writeFile(
    //   `./jobs-${Date.now()}.json`,
    //   JSON.stringify(jobs, null, 2)
    // );
    for (let job of jobs) {
      await page.goto(job.href, { waitUntil: "networkidle0" });
      try {
        await page.click(
          "div[data-testid='job-metadata-block'] .sc-bXCLTC.hGtksh .sc-fKWMtX.jcAilK"
        );
      } catch {}
      const data = await page.evaluate(() => {
        const requiredSkills = [
          ...document.querySelectorAll(
            "div[data-testid='job-metadata-block'] .sc-bXCLTC.hGtksh .sc-fKWMtX.iVMVso"
          ),
        ].map(el => el.textContent.trim());

        const companyTitle = document.querySelectorAll(
          "#the-company-section a"
        )[1];
        const company = {
          href: companyTitle?.href,
          name: companyTitle?.textContent.trim(),
        };
        return { requiredSkills, company };
      });
      job = Object.assign(job, data);
    }
    return jobs;
  } catch (error) {
    console.error(error);
  } finally {
    // Close browser at the end to prevent hidden processes
    browser.close();
  }
};

module.exports = { scrap };

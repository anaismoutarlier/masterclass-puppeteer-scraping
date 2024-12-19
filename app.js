const { scrap } = require("./scrap");
const { sendEmail } = require("./sendEmail");
const express = require("express");
const http = require("http");
const { CronJob } = require("cron");
const app = express();
const server = http.createServer(app);

function cron() {
  const job = new CronJob(
    "0 45 10 * * *",
    async () => {
      try {
        const data = await scrap();
        await sendEmail(`
			<h1>New posts</h1>
			<ul>
			${data.map(el => `<li>${el.title} - ${el.href}</li>`)}
			</ul>
			`);
      } catch (error) {
        console.error(error);
      }
    },
    null,
    true,
    "America/Los_Angeles"
  );
  job.start();
}
cron();
// scrap();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}.`));

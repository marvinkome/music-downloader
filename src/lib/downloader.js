const Queue = require("bee-queue");
const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const chromeDriverPath = require("chromedriver").path;
const path = require("path");
const utils = require("../utils");

class Downloader {
  constructor(downloadPath) {
    this.downloadPath = path.join(downloadPath, "songs");

    return (async () => {
      await this.setUp();
      return this;
    })();
  }

  // public methods
  async setUp() {
    // setup service
    const service = new chrome.ServiceBuilder(chromeDriverPath).build();
    chrome.setDefaultService(service);

    // setup options
    const options = new chrome.Options()
      .setUserPreferences({
        "download.default_directory": this.downloadPath,
      })
      .headless();

    // setup driver
    this.driver = await new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .setChromeOptions(options)
      .build();

    // setup browser
    try {
      await this.driver.get("https://www.mp3juices.cc/");
    } catch (e) {
      console.error("CRAWLER ERROR:: Error with the crawler:", e.message);
      this.driver.quit();
    }
  }

  async downloadSong(title, artist) {
    const name = `${title}_by_${artist}`;

    // get input and input the song details
    console.log(`CRAWLER INFO:: Searching for song - ${name}`);
    const input = await this.driver.findElement({ name: "query" });
    input.clear();
    input.sendKeys(`${title} by ${artist}`, webdriver.Key.ENTER);

    // wait for search result to be available
    await this.driver.wait(
      webdriver.until.elementLocated({
        id: "results",
      }),
      5000
    );

    // find result that doesn't contain "Official Video"
    const result = await this.driver.findElement(async (el) => {
      const results = await el.findElements({
        className: "result",
      });

      return webdriver.promise.filter(results, async (res) => {
        const name = await res.findElement({ className: "name" }).getText();
        // name = await name.getText();
        return !/official video/i.test(name);
      });
    });

    // click on download modal button
    console.log(`CRAWLER INFO:: Click on download modal - ${name}`);
    await result.findElement({ className: "download" }).click();

    // wait for download options
    await this.driver.wait(
      webdriver.until.elementLocated({
        css: '.file .url[href^="http"]',
      }),
      5000
    );

    // wait for main download button
    const downloadBtn = await this.driver.findElement({
      css: '.file .url[href^="http"]',
    });
    await this.driver.wait(webdriver.until.elementIsVisible(downloadBtn), 20000);

    // click main download button and get href attribute
    const href = await downloadBtn.getAttribute("href");
    console.log(`CRAWLER INFO:: Get the download link`, { name, href });

    // start downloading file
    const filePath = `${this.downloadPath}/${name}.mp3`;
    console.log(`CRAWLER INFO:: Starting download`, { name, href, filePath });

    await utils.downloadFile(href, filePath);

    console.log(`CRAWLER INFO:: Download completed`, name);

    // return file path
    return filePath;
  }
}

module.exports = {
  Downloader,
};

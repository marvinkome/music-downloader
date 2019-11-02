const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const chromeDriverPath = require("chromedriver").path;
const path = require("path");
const utils = require("../utils");

class Crawler {
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
                "download.default_directory": this.downloadPath
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
        console.log(`CRAWLER INFO:: Search for song - ${name}`);
        const input = await this.driver.findElement({ name: "query" });
        input.clear();
        input.sendKeys(`${title} by ${artist}`, webdriver.Key.ENTER);

        // wait for search result to be available
        await this.driver.wait(
            webdriver.until.elementLocated({
                id: "results"
            }),
            5000
        );

        // find result that doesn't contain "Official Video"
        const result = await this.driver.findElement(async el => {
            const results = await el.findElements({
                className: "result"
            });

            return webdriver.promise.filter(results, async res => {
                const name = await res.findElement({ className: "name" }).getText();
                // name = await name.getText();
                return !/official/i.test(name);
            });
        });

        // click on download modal button
        console.log(`CRAWLER INFO:: Click on download modal - ${name}`);
        await result.findElement({ className: "download" }).click();

        // wait for download options
        await this.driver.wait(
            webdriver.until.elementLocated({
                className: "file margin"
            }),
            5000
        );

        // wait for main download button
        const downloadBtn = await this.driver
            .findElement({ className: "file margin" })
            .findElement({ className: "url" });
        await this.driver.wait(webdriver.until.elementIsVisible(downloadBtn), 20000);

        // click main download button and get href attribute
        console.log(`CRAWLER INFO:: Get the download link - ${name}`);
        const href = await downloadBtn.getAttribute("href");

        // start downloading file
        console.log(`CRAWLER INFO:: Starting download - ${name}`);
        const filePath = `${this.downloadPath}/${name}.mp3`;

        await utils.downloadFile(href, filePath);

        console.log(`CRAWLER INFO:: Download completed - ${name}`);

        // return file path
        return filePath;
    }
}

async function init() {
    const crawler = await new Crawler();

    try {
        const resp = await crawler.downloadSong("Deahcrush", "alt-j");
        console.log(resp);
    } catch (e) {
        console.error("ERR:: Error with crawler:", e.message);
    } finally {
        await crawler.driver.quit();
    }
}

// init();

module.exports = {
    Crawler
};

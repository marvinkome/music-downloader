const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const chromeDriverPath = require("chromedriver").path;
const path = require("path");
const fs = require("fs");

const DOWNLOAD_PATH = path.resolve(process.cwd(), "downloads/songs");

class Crawler {
    constructor() {
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
        const options = new chrome.Options().setUserPreferences({
            "download.default_directory": DOWNLOAD_PATH
        });

        // setup driver
        this.driver = await new webdriver.Builder()
            .withCapabilities(webdriver.Capabilities.chrome())
            .setChromeOptions(options)
            .build();

        // setup browser
        try {
            await this.driver.get("https://www.mp3juices.cc/");
        } catch (e) {
            console.error("ERR:: Error with the crawler:", e.message);
            this.driver.quit();
        }
    }

    async downloadSong(title, artist) {
        // get input and input the song details
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
                return !/official video/i.test(name);
            });
        });

        // get file name
        const name = await result.findElement({ className: "name" }).getText();

        // click on download button
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

        // click main download button
        await downloadBtn.click();

        // wait until file starts downloading
        const filePath = `${DOWNLOAD_PATH}/${name}.mp3`;

        // check download has started
        await this.__checkFileExists(`${filePath}.crdownload`);
        console.log(`INFO:: Download has started - ${name}`);

        // check if download is completed
        await this.checkFileExists(filePath);

        try {
            await this.checkFileDoesNotExistsWithTimeout(`${filePath}.crdownload`, 2000);
        } catch (e) {
            console.error(`ERROR:: Part download still available - ${name}`);
        }

        console.log(`INFO:: Download completed - ${name}`);
    }

    // private methods
    checkFileExists(filePath) {
        return new Promise(resolve => {
            let watcher = null;

            // first check if file exists
            fs.access(filePath, fs.constants.R_OK, function(err) {
                if (!err) {
                    done = true;
                    watcher && watcher.close();
                    resolve();
                }
            });

            const dir = path.dirname(filePath);
            const basename = path.basename(filePath);
            watcher = fs.watch(dir, function(eventType, filename) {
                if (eventType === "rename" && filename === basename) {
                    done = true;
                    watcher.close();
                    resolve();
                }
            });
        });
    }

    checkFileDoesNotExistsWithTimeout(filePath, timeout) {
        return new Promise(function(resolve, reject) {
            // set timeout
            const timer = setTimeout(() => {
                watcher.close();
                reject(new Error("File wasn't deleted before during the timeout."));
            }, timeout);

            // check if file exists
            fs.access(filePath, fs.constants.F_OK, function(err) {
                if (err) {
                    clearTimeout(timer);
                    watcher.close();
                    resolve();
                }
            });

            var dir = path.dirname(filePath);
            var basename = path.basename(filePath);
            var watcher = fs.watch(dir, function(eventType, filename) {
                if (eventType === "rename" && filename !== basename) {
                    clearTimeout(timer);
                    watcher.close();
                    resolve();
                }
            });
        });
    }
}

async function init() {
    const crawler = await new Crawler();

    try {
        const resp = await crawler.downloadSong("In cold blood", "alt-j");
        console.log(resp);
    } catch (e) {
        console.error("ERR:: Error with crawler:", e.message);
    } finally {
        await crawler.driver.quit();
    }
}

init();

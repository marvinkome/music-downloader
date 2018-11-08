const { Builder, By, Key, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HOMEDIR = os.homedir();
const DOWNLOAD_PATH = `${HOMEDIR}/Music/bot_downloads/deezer`;

// setup driver
async function setUpDriver() {
    // firefox options
    const options = new firefox.Options()
        .setPreference("browser.download.folderList", 2)
        .setPreference("browser.download.manager.showWhenStarting", false)
        .setPreference("browser.download.dir", DOWNLOAD_PATH)
        .setPreference(" browser.download.useDownloadDir", false)
        .setPreference("browser.helperApps.neverAsk.saveToDisk", "audio/mpeg")
        .headless();

    return await new Builder()
        .forBrowser("firefox")
        .setFirefoxOptions(options)
        .build();
}

function checkNotExistsWithTimeout(filePath, timeout) {
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

function checkExistsWithTimeout(filePath, timeout) {
    return new Promise(function(resolve, reject) {
        // set timeout
        const timer = setTimeout(() => {
            watcher.close();
            reject(
                new Error(
                    "File did not exists and was not created during the timeout."
                )
            );
        }, timeout);

        // check if file exists
        fs.access(filePath, fs.constants.R_OK, function(err) {
            if (!err) {
                clearTimeout(timer);
                watcher.close();
                resolve();
            }
        });

        var dir = path.dirname(filePath);
        var basename = path.basename(filePath);
        var watcher = fs.watch(dir, function(eventType, filename) {
            if (eventType === "rename" && filename === basename) {
                clearTimeout(timer);
                watcher.close();
                resolve();
            }
        });
    });
}

class Downloader {
    constructor(driver) {
        this.driver = driver;
    }

    async init() {
        try {
            await this.driver.get("https://www.mp3juices.cc/");
        } catch (e) {
            throw Error("Error (crawler)", e.message);
        } finally {
            this.driver.quit();
        }
    }

    async downloadSong(title, artist) {
        const driver = this.driver;

        // get input and input the song details
        await driver
            .findElement(By.name("query"))
            .sendKeys(`${title} by ${artist}`, Key.ENTER);

        // wait for search result to be available
        await driver.wait(until.elementLocated(By.id("results")), 3000);
        const result = await driver.findElement(By.id("result_1"));

        const name = await result.findElement(By.className("name")).getText();
        if (!name.toLowerCase().includes(title.toLowerCase())) return null;
        await result.findElement(By.className("download")).click();

        // wait for download options
        await driver.wait(until.elementLocated(By.id("download_1")), 5000);

        // click main download
        const downloadBtn = await driver
            .findElement(By.id("download_1"))
            .findElement(By.className("url"));
        await driver.wait(until.elementIsVisible(downloadBtn), 15000);
        await downloadBtn.click();

        const filePath = `${DOWNLOAD_PATH}/${name}.mp3`;
        await checkExistsWithTimeout(filePath, 15000);
        await checkNotExistsWithTimeout(`${filePath}.part`, 15000);

        console.log("successfully downloaded", name);
        return filePath;
    }
}

async function main(song) {
    const driver = await setUpDriver();
    try {
        await driver.get("https://www.mp3juices.cc/");
        const downloader = new Downloader(driver);
        await downloader.downloadSong(song.title, song.artist);
        return downloader;
    } catch (e) {
        console.log("Error (crawler)", e.message);
    } finally {
        driver.quit();
    }
}

module.exports = { Downloader, setUpDriver };

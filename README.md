# Music downloader

Downloads songs and get metadata from spotify and apply them on the file.

Built with NodeJS

## How to setup

run the following commands

```bash
  cp .env.example .env
  yarn install # or npm install
```

## How to use

Open the `songs.json` file and add all the songs you want to download in this format:

```json
{ "title": "Taro", "artist": "Alt-J" }
```

to the array.

Then run

```bash
yarn start # or npm run start
```

This will start downloading all songs. Make sure you have a good internet connection though. Once
it's done the songs will be available in the `downloads/songs` folder with all correct metadata written.

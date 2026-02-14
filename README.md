# ChatGPT Conversation Downloader for Gopeed

A [Gopeed](https://gopeed.com) extension that downloads shared ChatGPT conversations as readable text files.

## Features

- Intercepts ChatGPT share links (`chatgpt.com/share/*`)
- Downloads the full conversation as a nicely formatted text file
- Includes all user and assistant messages with proper formatting

## Install

In Gopeed, go to **Extensions** → click the install icon → paste this URL:

```
https://github.com/chanelshivesh-pixel/gopeed-extension-chatgpt
```

## Usage

1. Copy a ChatGPT share link (e.g. `https://chatgpt.com/share/abc123...`)
2. Paste it into Gopeed's download bar
3. The conversation downloads as a `.txt` file

## How it works

The extension uses [Jina Reader](https://jina.ai/reader/) to extract conversation text from ChatGPT share pages. Jina renders the page with a real browser and returns the text content, which Gopeed then downloads.

## Development

```bash
npm install
npm run build
```

The built extension will be in the `dist/` folder. To test locally, install from the `dist` folder in Gopeed.

## License

MIT

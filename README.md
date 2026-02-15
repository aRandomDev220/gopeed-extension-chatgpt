# ChatGPT Conversation Downloader for Gopeed

A [Gopeed](https://gopeed.com) extension that downloads shared ChatGPT conversations as readable text files, PDF documents, or screenshots.

## Features

- Intercepts ChatGPT share links (`chatgpt.com/share/*`)
- **3 output formats** — choose in extension settings:
  - **Text File (.txt)** — Clean, formatted conversation text (default)
  - **PDF Document (.pdf)** — Downloadable PDF with the conversation content
  - **Screenshot (.png)** — Full-page screenshot of the conversation page

## Install

1. Open Gopeed → go to **Extensions**
2. Paste this URL:

```
https://github.com/chanelshivesh-pixel/gopeed-extension-chatgpt
```

3. Click the **Install** button

## Usage

1. Copy a ChatGPT share link (e.g. `https://chatgpt.com/share/abc123...`)
2. Paste it into Gopeed's download bar
3. The conversation downloads in your chosen format

### Changing the Output Format

1. Go to **Extensions** → find **ChatGPT Conversation Downloader**
2. Click **Settings**
3. Select your preferred format from the **Download Format** dropdown
4. All future downloads will use the selected format

## How it works

- **Text mode** uses [Jina Reader](https://jina.ai/reader/) to extract conversation text as Markdown
- **PDF mode** fetches the text, generates a PDF in-memory, and hosts it temporarily via [paste.rs](https://paste.rs)
- **Screenshot mode** uses Jina Reader's page capture to get a full-page PNG

## Development

```bash
npm install
npm run build
```

The built extension will be in the `dist/` folder. To test locally, install from the `dist` folder in Gopeed.

## License

MIT

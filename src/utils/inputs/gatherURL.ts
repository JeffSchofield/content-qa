import puppeteer, { Browser, Page } from "puppeteer";
import { GatherContext } from "../gatherInputs";
import YTDlpWrap from "yt-dlp-wrap";
import { existsSync } from "fs";
import ffmpegStatic from 'ffmpeg-static';
import { readFile, rm } from "fs/promises";
import { srtToPlaintext } from "../srtToPlainText";
import { join } from "path";
import { app_data_path } from "../../config";
import { getStorageFolder } from "../storageFolder";

const ytDlpPath = "yt-dlp";
const ytDlpBinary = "yt-dlp";
const ytDlpWrap = new YTDlpWrap();

async function processVideoContent(
  page: Page,
  { updateStatus }: GatherContext
) {
  async function createYTDLProcess(args: string[]) {
    const ytDlpStoragePath = await getStorageFolder(ytDlpPath);
    const ytDlpBinaryPath = join(ytDlpStoragePath, ytDlpBinary);
    ytDlpWrap.setBinaryPath(ytDlpBinaryPath);

    if (!ytDlpBinaryPath || !existsSync(ytDlpBinaryPath)) {
      // Download/update the yt-dlp binary
      updateStatus("Downloading yt-dlp binary...");
      await YTDlpWrap.downloadFromGithub(ytDlpBinaryPath).catch((error) => {
        console.error("Error while downloading yt-dlp binary:", error);
        throw error;
      });
    }

    return ytDlpWrap.execPromise(args);
  }

  // Get the video URL
  const videoUrl = page.url();
  const uniqueId = Math.random().toString(36).substring(7);
  const outputFile = `${uniqueId}`;

  const outputFolder = await getStorageFolder('temp');
  const outputPath = join(outputFolder, outputFile)

  async function readSubtitles() {
    const subtitles_path = `${outputPath}.en.srt`

    if (!existsSync(subtitles_path)) throw new Error("No subtitles found");

    const subtitles = await readFile(subtitles_path, 'utf-8');
    await rm(subtitles_path);

    return srtToPlaintext(subtitles);
  }

  // Common yt-dlp arguments
  const commonArgs = [
    "--ffmpeg-location", ffmpegStatic || '',
    "--skip-download",
    "--sub-format",
    "best",
    "--sub-langs",
    "en",
    "--convert-subtitles",
    "srt",
    "--output",
    outputPath,
  ];

  try {
    updateStatus("Checking for regular subtitles...");

    // Try downloading regular subtitles first
    await createYTDLProcess([
      videoUrl,
      ...commonArgs,
      "--write-sub",
    ]);

    const subtitles = await readSubtitles();

    updateStatus("Regular subtitles gathered!", { level: "success" });
    return subtitles;
  } catch (regSubError) {
    try {
      updateStatus(
        "Regular subtitles not available. Checking for auto-generated subtitles...",
        { level: "info" }
      );

      // If regular subtitles fail, try auto-generated subtitles
      await createYTDLProcess([
        videoUrl,
        ...commonArgs,
        "--write-auto-sub",
      ]);

      const autoSubtitles = await readSubtitles();

      updateStatus("Auto-generated subtitles gathered!", { level: "success" });
      return autoSubtitles;
    } catch (autoSubError) {
      updateStatus("Failed to capture any subtitles.", { level: "alert" });
      console.error(autoSubError);
      throw autoSubError;
    }
  }
}

async function extractArticleContent(
  page: Page,
  { updateStatus }: GatherContext
) {
  updateStatus("Extracting article content...");

  const content = await page.evaluate(() => {
    const article = document.querySelector<HTMLElement>(
      "article, .post-content, .entry-content, main"
    );
    return article ? article.innerText : document.body.innerText;
  });

  return content;
}

export async function gatherURL(url: string, context: GatherContext) {
  const { updateStatus, URLs } = context;
  updateStatus(`Gathering URL ${url}...`);

  let browser: Browser | undefined = undefined;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const title = await page.title();

    // Check if the URL is a video
    const isVideoPage = await page.evaluate(() => {
      const videoElement = document.querySelector('video');
      const ogVideo = document.querySelector('meta[property="og:video"]');
      const twitterPlayer = document.querySelector('meta[name="twitter:player"]');

      const hasLargeVideo = videoElement && (videoElement.clientWidth > (window.innerWidth / 2));
      const hasVideoMetadata = ogVideo || twitterPlayer;
      const hasVideoInURL = /video|watch|embed/.test(window.location.pathname);

      return hasLargeVideo || hasVideoMetadata || hasVideoInURL;
    });

    if (isVideoPage) {
      const content = await processVideoContent(page, context);
      updateStatus("Video content processed!", { level: "success" });
      URLs.push({ url, type: "video", title, content });
    } else {
      const content = await extractArticleContent(page, context);
      if (content) {
        updateStatus("Article content extracted!", { level: "success" });
        URLs.push({ url, type: "article", title, content });
      } else {
        throw new Error("Article content could not be extracted");
      }
    }

    await browser.close();
  } catch (error) {
    console.error(error);
    updateStatus("Failed to gather URL!", { level: "alert" });
    if (browser) await browser.close();
  }
}

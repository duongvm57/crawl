import { PlaywrightCrawler, Dataset } from 'crawlee';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import Epub from 'epub-gen';
import { readFile, readdir, stat } from 'fs/promises';

const crawler = new PlaywrightCrawler({
  async requestHandler({ request, page, log }) {
    await page.waitForSelector('#chapter-detail');
    // const content = new Readability(new JSDOM(await page.locator('[data-x-bind="ChapterContent"]').innerHTML()).window.document).parse().content;
    const content = new Readability(new JSDOM(await page.locator('#chapter-detail').innerHTML()).window.document).parse().content;
    const chapter = {
      content: content,
      url: request.url
    }
    await Dataset.pushData(chapter);
    log.info(`Saving data: ${request.url}`);
  },
  // headless: false
});

const getChapters = async (url) => {
  try {
    const response = await fetch(url);
    const chapters = await response.json();
    const totalChapters = chapters['data'].length;

    let urlChapters = [];
    for (let index = 1; index < totalChapters; index++) {
      urlChapters.push(`https://metruyencv.com/truyen/quang-am-chi-ngoai/chuong-${index}`);
    }
    await crawler.run(urlChapters);

  } catch (error) {
    console.error('Error fetching chapters:', error);
  }
}

const getFiles = async (dir, files = []) => {
  const fileList = await readdir(dir);
  for (const file of fileList) {
    const name = `${dir}/${file}`;
    if ((await stat(name)).isDirectory()) {
      getFiles(name, files);
    } else {
      files.push(name);
    }
  }
  return files;
}

const exportEpub = async (dir) => {
  const listJson = await getFiles(dir);
  const option = {
    title: 'Quang âm chi ngoại',
    author: 'duongvm',
    publisher: 'duongvm',
    cover: 'https://static.cdnno.com/poster/quang-am-chi-ngoai/300.jpg?1718153607',
    content: []
  };
  let data;
  for (const file of listJson) {
    data = JSON.parse(await readFile(file, 'utf-8'));
    option.content.push({
      title: data.url,
      data: data.content
    });
  }
  new Epub(option, "book.epub");
}

getChapters('https://backend.metruyencv.com/api/chapters?filter[book_id]=112774&filter[type]=published');
exportEpub('storage/datasets/default');

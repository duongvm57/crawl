import { PlaywrightCrawler } from 'crawlee';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export default class Crawler {
    constructor(dataset) {
        this.crawler = new PlaywrightCrawler({
            async requestHandler({ request, page, log }) {
                await page.waitForSelector('#chapter-detail');
                const content = new Readability(new JSDOM(await page.locator('#chapter-detail').innerHTML()).window.document).parse().content;
                const chapter = {
                    content: content,
                    url: request.url,
                    name: request.userData.name
                };
                await dataset.pushData(chapter);
                log.info(`Saving data: ${request.url}`);
            }
            // headless: false
        });
    }

    async run(chapters) {
        await this.crawler.run(chapters.map(chapter => ({
            url: chapter.url,
            userData: { name: chapter.name }
        })));
    }
}
import { Dataset } from 'crawlee';
import Epub from 'epub-gen';
import { readdir, stat, mkdir } from 'fs/promises';
import { existsSync } from 'node:fs';
import FileDownloader from './file-downloader.js';
import Crawler from './crawler.js';

export default class BookManager {
    static async getChapters(bookId) {
        try {
            const url = `https://backend.metruyencv.com/api/chapters?filter[book_id]=${bookId}&filter[type]=published`;
            const response = await fetch(url);
            const chapters = await response.json();
            const totalChapters = chapters['data'].length;

            const bookName = chapters['extra']['book']['name'];
            const bookSlug = chapters['extra']['book']['slug'];
            const bookPoster = chapters['extra']['book']['poster'];
            const coverDir = `storage/covers/${bookSlug}`;

            if (existsSync(`ebook/${bookSlug}`)) {
                return { name: bookName, slug: bookSlug, cover: `${coverDir}/default.jpg` };
            }

            const cover = await new Promise((resolve, reject) => {
                const result = FileDownloader.downloadFile(bookPoster['default'], coverDir, 'default.jpg', (error) => {
                    if (error) {
                        console.error('Download cover failed:', error);
                        reject(error);
                    } else {
                        console.log('Download cover succeeded');
                        resolve(result);
                    }
                });
            })

            let urlChapters = [];
            for (let index = 1; index < totalChapters; index++) {
                const chapterName = chapters['data'][index]['name'];
                const chapterUrl = `https://metruyencv.com/truyen/${bookSlug}/chuong-${index + 1}`;
                urlChapters.push({ url: chapterUrl, name: chapterName });
            }

            const dataset = await Dataset.open(bookSlug);
            const crawler = new Crawler(dataset);
            await crawler.run(urlChapters);

            return { name: bookName, slug: bookSlug, cover: cover };

        } catch (error) {
            console.error('Error fetching chapters:', error);
        }
    }

    static async getFiles(dir, files = []) {
        const fileList = await readdir(dir);
        for (const file of fileList) {
            const name = `${dir}/${file}`;
            if ((await stat(name)).isDirectory()) {
                await BookManager.getFiles(name, files);
            } else {
                files.push(name);
            }
        }
        return files;
    }

    static async exportEpub(bookInfo) {
        const option = {
            title: bookInfo.name,
            slug: bookInfo.slug,
            author: 'duongvm',
            publisher: 'duongvm',
            cover: bookInfo.cover,
            content: []
        };

        const dataset = await Dataset.open(bookInfo.slug);
        await dataset.forEach(async (item) => {
            option.content.push({
                title: item.name,
                data: item.content
            });
        });

        await mkdir('ebooks', { recursive: true }).catch((err) => {
            console.error(err);
        });

        new Epub(option, `ebooks/${bookInfo.name}.epub`);
    }
}
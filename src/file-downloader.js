import https from 'https';
import { createWriteStream, unlink } from 'node:fs';
import { mkdir } from 'fs/promises';

export default class FileDownloader {
    static async downloadFile(url, dest, fileName, cb) {
        try {
            await mkdir(dest, { recursive: true });

            const file = createWriteStream(dest + '/' + fileName);

            const request = https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    return cb('Response status was ' + response.statusCode);
                }
                response.pipe(file);
            });

            file.on('finish', () => file.close(() => cb(null)));

            request.on('error', (err) => {
                unlink(dest + '/' + fileName).catch(() => {});
                cb(err.message);
            });

            file.on('error', (err) => {
                unlink(dest + '/' + fileName).catch(() => {});
                cb(err.message);
            });

            return file.path;
        } catch (error) {
            cb(err.message);
        }
    }
}

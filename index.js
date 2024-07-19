import BookManager from './src/book-manager.js';

(async () => {
    const bookInfo = await BookManager.getChapters(119943);
    if (bookInfo) {
        await BookManager.exportEpub(bookInfo);
    }
})();

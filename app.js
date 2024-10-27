import express from 'express';
import cors from 'cors';
import bot from './telegramBot.js';
import { firebaseInitialized, fetchSubscribers } from './firebase.js';

const app = express();
const PORT = process.env.PORT || 8080;
const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN || 'https://tgbot-72744332320.us-central1.run.app';
const localSubscribers = new Set(); // Локальное хранилище подписчиков на случай проблем с Firebase

// Настройки CORS
const corsOptions = {
    origin: ['http://localhost:3000', 'https://oleksandr-3787c.web.app'],
    methods: 'POST',
    allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));
app.use(express.json());

// Проверочный маршрут для сервера
app.get('/', (req, res) => {
    console.log("Received request on root '/' endpoint");
    res.send('Server is running!');
});

// Маршрут уведомления о новой песне
app.post('/notify', async (req, res) => {
    const { songTitle, youtubeLink, songId } = req.body;

    if (!songTitle) {
        console.warn('Notification request missing songTitle');
        return res.status(400).send('Song title missing');
    }

    console.log(`Received notification request for song: ${songTitle}`);

    try {
        // Получение подписчиков
        const chatIds = firebaseInitialized
            ? await fetchSubscribers()
            : Array.from(localSubscribers);

        console.log(`Preparing to send notification to ${chatIds.length} subscribers`);

        if (chatIds.length === 0) {
            console.warn('No subscribers to notify');
            return res.status(200).send('No subscribers to notify');
        }

        // Создание сообщения
        const messageText = `Нова пісня додана: ${songTitle}\n\nДивитись в додатку: https://oleksandr-3787c.web.app/song?song=${songId}\n\nАбо слухати на YouTube:\n\n ${youtubeLink || 'посилання відсутнє'}`;

        // Отправка уведомлений
        const promises = chatIds.map(chatId =>
            bot.telegram.sendMessage(chatId, messageText)
                .then(() => console.log(`Notification sent to chatId: ${chatId}`))
                .catch(err => console.error(`Error sending to chatId ${chatId}:`, err))
        );

        await Promise.all(promises);
        console.log('All notifications sent successfully');
        res.status(200).send('Notification sent');
    } catch (error) {
        console.error('Error processing notification request:', error);
        res.status(500).send('Failed to send notification');
    }
});

// Вебхук для обработки запросов Telegram
app.post('/bot-webhook', (req, res) => {
    console.log("Received update on /bot-webhook endpoint:", JSON.stringify(req.body, null, 2));
    bot.handleUpdate(req.body)
        .then(() => res.sendStatus(200))
        .catch(error => {
            console.error('Error handling bot update:', error);
            res.sendStatus(500);
        });
});

// Запуск бота и сервера
bot.launch({
    webhook: {
        domain: WEBHOOK_DOMAIN,
        hookPath: '/bot-webhook'
    },
}).then(async () => {
    console.log(`Bot webhook initialized at: ${WEBHOOK_DOMAIN}/bot-webhook`);

    // Подтверждение вебхука
    const webhookInfo = await bot.telegram.getWebhookInfo();
    if (webhookInfo.url) {
        console.log(`Webhook is set to: ${webhookInfo.url}`);
    } else {
        console.error('Failed to verify webhook URL');
    }

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Error launching bot with webhook:', error);
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).send('Internal Server Error');
});

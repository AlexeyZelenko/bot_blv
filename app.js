import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

const subscribers = new Set();
let firebaseInitialized = false;

try {
    console.log("Attempting to initialize Firebase...");
    const serviceAccount = require('./firebase-service-account.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Failed to initialize Firebase:', error);
}

const db = firebaseInitialized ? admin.firestore() : null;
const token = '7619684910:AAHzoRqrqYVDdB_PIEMIrIiv-JfEjC65yKc';
const bot = new Telegraf(token);
const app = express();
const PORT = process.env.PORT || 8080;

const corsOptions = {
    origin: ['http://localhost:3000', 'https://oleksandr-3787c.web.app'],
    methods: 'POST',
    allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server is running!');
});

async function addSubscriber(chatId) {
    if (firebaseInitialized && db) {
        console.log(`Attempting to add subscriber to Firebase with chatId: ${chatId}`);
        try {
            const docRef = db.collection('subscribers').doc(chatId.toString());
            await docRef.set({ chatId });
            console.log(`Successfully added subscriber to Firebase with chatId: ${chatId}`);
        } catch (error) {
            console.error('Error adding subscriber to Firebase:', error);
        }
    } else {
        if (!subscribers.has(chatId)) {
            subscribers.add(chatId);
            console.log(`Added subscriber with chatId: ${chatId} to local storage`);
        } else {
            console.log(`Subscriber with chatId: ${chatId} is already subscribed`);
        }
    }
}

bot.command('start', (ctx) => {
    console.log('Received /start command');
    const chatId = ctx.chat.id;
    addSubscriber(chatId);

    ctx.reply(
        'Привіт! Натисніть, щоб побачити пісні',
        Markup.inlineKeyboard([Markup.button.webApp('ПІСНІ', 'https://oleksandr-3787c.web.app')])
    );
});

bot.command('hello', (ctx) => {
    console.log('Received /hello command');
    ctx.reply('Привіт! Чим я можу вам допомогти?');
});

bot.on('text', (ctx) => {
    if (ctx.message.text.startsWith('/')) {
        return;
    }
    console.log('Received message:', ctx.message.text);
    ctx.reply('Message received!');
});

app.post('/notify', async (req, res) => {
    const { songTitle, youtubeLink, songId } = req.body;

    if (!songTitle) {
        console.warn('Received notify request without songTitle');
        return res.status(400).send('Song title missing');
    }

    console.log(`Received new song notification: ${songTitle}`);

    let chatIds = [];
    if (firebaseInitialized && db) {
        console.log('Fetching subscribers from Firebase...');
        try {
            const snapshot = await db.collection('subscribers').get();
            snapshot.forEach((doc) => {
                chatIds.push(doc.data().chatId);
            });
            console.log(`Fetched ${chatIds.length} subscribers from Firebase`);
        } catch (error) {
            console.error('Error retrieving subscribers from Firebase:', error);
        }
    } else {
        chatIds = Array.from(subscribers);
        console.log(`Using local storage subscribers, count: ${chatIds.length}`);
    }

    if (chatIds.length === 0) {
        console.warn('No subscribers found');
        return res.status(200).send('No subscribers to notify');
    }

    try {
        const appSongUrl = songId ? `https://oleksandr-3787c.web.app/song?song=${songId}` : '';

        const messageText = `Нова пісня додана: ${songTitle}\n\nДивитись в додатку: ${appSongUrl}\n\nАбо слухати на YouTube: \n${youtubeLink}`;

        const promises = chatIds.map((chatId) =>
            bot.telegram.sendMessage(chatId, messageText)
                .catch(err => console.error(`Error sending message to chatId ${chatId}:`, err))
        );

        await Promise.all(promises);
        console.log(`Notification sent to ${chatIds.length} subscribers`);
        res.status(200).send('Notification sent to all subscribers');
    } catch (error) {
        console.error('Error sending notifications:', error);
        res.status(500).send('Failed to send notification');
    }
});

app.post('/bot-webhook', (req, res) => {
    const { message } = req.body;

    console.log("Received update:", JSON.stringify(req.body, null, 2)); // Логируем весь запрос для отладки

    if (message && message.chat && message.chat.id) {
        console.log('Received message from Telegram:', message.text);
        bot.handleUpdate(req.body);
        res.sendStatus(200);
    } else {
        console.warn('Invalid message structure:', JSON.stringify(req.body, null, 2));
        res.status(400).send('Invalid message structure');
    }
});

const webhookDomain = 'https://tgbot-72744332320.us-central1.run.app';
const webhookPath = '/bot-webhook';

console.log(`Setting webhook with domain: ${webhookDomain}, hookPath: ${webhookPath}`);

bot.launch({
    webhook: {
        domain: webhookDomain,
        hookPath: webhookPath
    },
}).then(() => {
    console.log('Bot webhook initialized with the following configuration:');
    console.log(`Domain: ${webhookDomain}`);
    console.log(`Hook Path: ${webhookPath}`);

    app.listen(PORT, () => {
        console.log(`Bot and webhook server running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Error launching bot with webhook:', error);
});

app.use((err, req, res, next) => {
    console.error('Unhandled error in Express app:', err);
    res.status(500).send('Internal Server Error');
});

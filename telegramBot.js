import { Telegraf, Markup } from 'telegraf';
import { addSubscriberToFirebase, fetchSubscribers } from './firebase.js';

const token = '7619684910:AAHzoRqrqYVDdB_PIEMIrIiv-JfEjC65yKc';
const bot = new Telegraf(token);
const subscribers = new Set();

// Добавляем логирование при запуске бота
console.log('Bot initialized and ready to receive commands.');

// Функция для безопасного добавления подписчика с отложенными попытками при сбое
async function safeAddSubscriber(chatId) {
    try {
        await addSubscriberToFirebase(chatId, subscribers);
        console.log(`Subscriber with chatId: ${chatId} added successfully.`);
    } catch (error) {
        console.error(`Error adding subscriber with chatId: ${chatId}. Retrying...`, error);
        setTimeout(() => safeAddSubscriber(chatId), 5000);  // Отложенная повторная попытка через 5 секунд
    }
}

// Команда /start для добавления в подписчики
bot.command('start', (ctx) => {
    console.log('Received /start command');
    const chatId = ctx.chat.id;

    safeAddSubscriber(chatId);

    ctx.reply(
        'Привіт! Натисніть, щоб побачити пісні',
        Markup.inlineKeyboard([Markup.button.webApp('ПІСНІ', 'https://oleksandr-3787c.web.app')])
    ).catch(error => console.error('Error sending reply for /start command:', error));
});

// Обработка команды /hello
bot.command('hello', (ctx) => {
    console.log('Received /hello command');
    ctx.reply('Привіт! Чим я можу вам допомогти?').catch(error => console.error('Error sending reply for /hello command:', error));
});

// Обработка текстовых сообщений
bot.on('text', (ctx) => {
    const messageText = ctx.message.text;

    if (messageText.startsWith('/')) {
        return;  // Игнорируем команды в обработчике текста
    }

    console.log(`Received message: ${messageText}`);

    ctx.reply('Message received!')
        .then(() => console.log('Confirmation sent to user.'))
        .catch(error => console.error('Error sending confirmation message:', error));
});

// Обработка необработанных событий и ошибок
bot.catch((error, ctx) => {
    console.error(`Error encountered in bot handling: ${ctx.updateType}`, error);
});

export default bot;

# Используем Node.js 16 версии (alpine для минимального размера образа)
FROM node:16-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы в контейнер
COPY . .

# Задаём переменную окружения для порта
ENV PORT=8080

# Открываем порт
EXPOSE 8080

# Запускаем бот
CMD ["node", "app.js"]

"# bot-blv"


##Create file

firebase-service-account.json

Отримайте облікові дані:

У Firebase Console перейдіть до параметрів проєкту вашого Firebase проєкту.
У вкладці Службові облікові записи натисніть на Створити новий приватний ключ.
Це завантажить JSON-файл з вашими обліковими даними. Перейменуйте його на firebase-service-account.json, якщо потрібно, і збережіть у корені проєкту.
Структура JSON: Створений файл firebase-service-account.json буде містити таку інформацію:
##Create file
```json

{
    "type": "service_account",
    "project_id": "your-project-id",
    "private_key_id": "your-private-key-id",
    "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
    "client_id": "your-client-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"
}


Додатково:
Задля безпеки не включайте цей файл до репозиторію. Додайте його до .gitignore, щоб запобігти випадковому пушу:

firebase-service-account.json

##Start project

```bash
npm install
```
```bash
npm start
```
```bash

##Deploy project
```bash

1. Пересоберите Docker-образ:
```bash
docker build -t tgbot .
```bash

2. Загрузите образ в Google Container Registry
```bash

3. Создайте новую версию образа
```bash

4. Переразверните сервис на Cloud Run
Используйте команду gcloud для развертывания обновленного образа:

5. Перепроверьте вебхук (опционально)
```bash

##Update project
```bash

1. Внесите необходимые изменения в код
После изменений в коде пересоберите Docker-образ:
```bash
docker build -t tgbot .
```bash

2. Загрузите новый образ в Google Container Registry
3. Переразверните сервис на Cloud Run
Используйте команду gcloud для развертывания обновленного образа:

4. Перепроверьте вебхук (опционально)
```bash


import admin from 'firebase-admin';
import fs from 'fs';

let firebaseInitialized = false;
let db = null;

try {
    console.log("Attempting to initialize Firebase...");

    // Асинхронне завантаження JSON-файлу з обліковими даними
    const serviceAccount = JSON.parse(
        fs.readFileSync(new URL('./firebase-service-account.json', import.meta.url))
    );

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    db = admin.firestore();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Failed to initialize Firebase:', error);
}

async function addSubscriberToFirebase(chatId, localSubscribers) {
    console.log(`Processing addSubscriberToFirebase for chatId: ${chatId}`);

    if (firebaseInitialized && db) {
        try {
            console.log(`Adding subscriber to Firebase with chatId: ${chatId}`);
            const docRef = db.collection('subscribers').doc(chatId.toString());
            await docRef.set({ chatId });
            console.log(`Successfully added subscriber with chatId: ${chatId} to Firebase`);
        } catch (error) {
            console.error('Error adding subscriber to Firebase:', error);
        }
    } else {
        console.warn('Firebase not initialized. Using local storage.');
        if (!localSubscribers.has(chatId)) {
            localSubscribers.add(chatId);
            console.log(`Added subscriber with chatId: ${chatId} to local storage`);
        } else {
            console.log(`Subscriber with chatId: ${chatId} is already in local storage`);
        }
    }
}

async function fetchSubscribers() {
    if (!firebaseInitialized || !db) {
        console.warn('Firebase is not initialized. Returning empty subscriber list.');
        return [];
    }

    try {
        console.log('Fetching subscribers from Firebase...');
        const snapshot = await db.collection('subscribers').get();
        const subscribers = snapshot.docs.map(doc => doc.data().chatId);
        console.log(`Fetched ${subscribers.length} subscribers from Firebase`);
        return subscribers;
    } catch (error) {
        console.error('Error fetching subscribers from Firebase:', error);
        return [];
    }
}

export { addSubscriberToFirebase, fetchSubscribers, firebaseInitialized, db };

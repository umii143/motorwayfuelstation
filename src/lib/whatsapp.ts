import pkg from 'whatsapp-web.js';
import { logger } from '../lib/logger';
const { Client, LocalAuth } = pkg;

export const waClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
    }
});

let isReady = false;
let qrCodeData = '';
let isInitializing = false;

waClient.on('qr', (qr) => {
    logger.info('WhatsApp Client QR RECEIVED');
    qrCodeData = qr; 
});

waClient.on('ready', () => {
    logger.info('WhatsApp Client is ready!');
    isReady = true;
    qrCodeData = ''; 
    isInitializing = false;
});

waClient.on('disconnected', (reason) => {
    logger.info('WhatsApp Client disconnected', reason);
    isReady = false;
    isInitializing = false;
});

export const initWhatsApp = () => {
    if (isReady || isInitializing) return;
    isInitializing = true;
    logger.info("Initializing WhatsApp Web client...");
    waClient.initialize().catch(err => {
        logger.error("Failed to init WhatsApp client:", err);
        isInitializing = false;
    });
};

export const logoutWhatsApp = async () => {
    if (isReady) {
        await waClient.logout();
        isReady = false;
        qrCodeData = '';
        isInitializing = false;
    }
};

export const getStatus = () => {
    return {
        ready: isReady,
        qr: qrCodeData,
        initializing: isInitializing
    };
};

export const sendMessage = async (number: string, message: string) => {
    if (!isReady) throw new Error('WhatsApp client is not ready');
    // Format number: remove all non-digits
    let cleanNumber = number.replace(/\D/g, '');
    // Ensure Pakistan code exists if missing (basic fallback, UI should enforce it)
    if (cleanNumber.startsWith('03')) {
        cleanNumber = '92' + cleanNumber.substring(1);
    }
    const chatId = `${cleanNumber}@c.us`;
    await waClient.sendMessage(chatId, message);
};

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

class WhatsAppClient {
  constructor(profileId, options = {}) {
    this.profileId = profileId;
    this.options = options;
    this.browser = null;
    this.page = null;
    this.connected = false;
    this.profileDir = path.join(process.env.PROFILES_DIR || './profiles', profileId);
  }

  async init() {
    logger.info(`Initializing WhatsApp client for profile: ${this.profileId}`);
    
    // Ensure profile directory exists
    if (!fs.existsSync(this.profileDir)) {
      fs.mkdirSync(this.profileDir, { recursive: true });
    }
    
    // Launch browser with persistent context
    const launchOptions = {
      headless: false, // Set to true for production
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    };
    
    if (this.options.proxy) {
      launchOptions.proxy = {
        server: this.options.proxy,
      };
    }
    
    this.browser = await chromium.launchPersistentContext(this.profileDir, launchOptions);
    this.page = await this.browser.newPage();
    
    // Navigate to WhatsApp Web
    await this.page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle' });
    
    // Wait for QR code or main interface
    try {
      await this.page.waitForSelector('canvas[aria-label="Scan me!"], div[data-testid="conversation-panel-wrapper"]', {
        timeout: 60000,
      });
      
      // Check if logged in
      const isLoggedIn = await this.page.$('div[data-testid="conversation-panel-wrapper"]');
      if (isLoggedIn) {
        this.connected = true;
        logger.info(`Profile ${this.profileId} is logged in`);
      } else {
        logger.info(`Profile ${this.profileId} needs QR code scan`);
      }
    } catch (error) {
      logger.error(`Failed to initialize profile ${this.profileId}:`, error);
      throw error;
    }
  }

  async sendMessage(phone, message, attachments = []) {
    if (!this.page) {
      throw new Error('Client not initialized');
    }
    
    logger.info(`Sending message to ${phone}`);
    
    try {
      // Format phone number (remove special characters)
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      
      // Navigate to chat
      const chatUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}`;
      await this.page.goto(chatUrl, { waitUntil: 'networkidle' });
      
      // Wait for chat to load
      await this.page.waitForSelector('div[contenteditable="true"][data-tab="10"]', {
        timeout: 30000,
      });
      
      // Add delay to avoid rate limiting
      await this.delay(2000);
      
      // Type message
      const messageBox = await this.page.$('div[contenteditable="true"][data-tab="10"]');
      await messageBox.click();
      await messageBox.type(message, { delay: 100 });
      
      // Send message
      await this.page.keyboard.press('Enter');
      
      // Wait for message to be sent
      await this.delay(1000);
      
      logger.info(`Message sent to ${phone}`);
      
      return { success: true, phone, timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error(`Failed to send message to ${phone}:`, error);
      throw error;
    }
  }

  async close() {
    logger.info(`Closing WhatsApp client for profile: ${this.profileId}`);
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WhatsAppClient;

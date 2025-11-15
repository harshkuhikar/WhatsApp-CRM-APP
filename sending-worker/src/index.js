const express = require('express');
const { createClient } = require('redis');
const WhatsAppClient = require('./whatsapp-client');
const logger = require('./logger');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const redisClient = createClient({ url: process.env.REDIS_URL });

const whatsappClients = new Map();

// Connect to Redis
redisClient.connect().catch(console.error);

redisClient.on('error', (err) => logger.error('Redis error:', err));
redisClient.on('connect', () => logger.info('Connected to Redis'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', clients: whatsappClients.size });
});

// Initialize WhatsApp profile
app.post('/profiles/init', async (req, res) => {
  try {
    const { profileId, proxy } = req.body;
    
    if (whatsappClients.has(profileId)) {
      return res.json({ success: true, message: 'Profile already initialized' });
    }
    
    const client = new WhatsAppClient(profileId, { proxy });
    await client.init();
    
    whatsappClients.set(profileId, client);
    
    res.json({ success: true, profileId });
  } catch (error) {
    logger.error('Profile init error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send message
app.post('/send', async (req, res) => {
  try {
    const { profileId, phone, message, attachments } = req.body;
    
    const client = whatsappClients.get(profileId);
    if (!client) {
      return res.status(404).json({ error: 'Profile not initialized' });
    }
    
    const result = await client.sendMessage(phone, message, attachments);
    
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Close profile
app.post('/profiles/close', async (req, res) => {
  try {
    const { profileId } = req.body;
    
    const client = whatsappClients.get(profileId);
    if (client) {
      await client.close();
      whatsappClients.delete(profileId);
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Profile close error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get profile status
app.get('/profiles/:profileId/status', (req, res) => {
  const { profileId } = req.params;
  const client = whatsappClients.get(profileId);
  
  res.json({
    initialized: !!client,
    connected: client ? client.isConnected() : false,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing connections...');
  
  for (const [profileId, client] of whatsappClients) {
    await client.close();
  }
  
  await redisClient.quit();
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`Sending worker listening on port ${PORT}`);
});

const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');

router.get('/channels', discussionController.getChannels);
router.post('/channels', discussionController.createChannel);

router.get('/channels/:channelId/messages', discussionController.getMessages);
router.post('/channels/:channelId/messages', discussionController.createMessage);

router.get('/messages/:messageId/replies', discussionController.getThreadReplies);
router.put('/messages/:messageId/pin', discussionController.togglePin);

router.get('/pinned', discussionController.getPinnedMessages);

module.exports = router;

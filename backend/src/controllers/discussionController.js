const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const socketIo = require('../socket');

exports.getChannels = async (req, res) => {
  try {
    const { projectId } = req.query;
    const channels = await prisma.discussionChannel.findMany({
      where: { projectId, isArchived: false },
      orderBy: { createdAt: 'asc' }
    });
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createChannel = async (req, res) => {
  try {
    const channel = await prisma.discussionChannel.create({
      data: req.body
    });
    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const messages = await prisma.discussionMessage.findMany({
      where: { channelId, threadId: null }, // Only main messages
      include: {
        user: { select: { id: true, name: true, role: true } },
        attachments: true,
        links: true,
        _count: { select: { replies: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { userId, content, type, threadId, attachments, links } = req.body;
    
    const message = await prisma.discussionMessage.create({
      data: {
        channelId,
        userId,
        content,
        type: type || 'TEXT',
        threadId,
        ...(attachments && attachments.length > 0 && { attachments: { create: attachments } }),
        ...(links && links.length > 0 && { links: { create: links } })
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        attachments: true,
        links: true,
        _count: { select: { replies: true } }
      }
    });

    // Broadcast using Socket.IO to the room (channelId)
    const io = socketIo.getIO();
    io.to(channelId).emit('receive_message', message);
    
    // Also emit a global project notification for the bell icon
    io.emit('project_notification', message);

    res.status(201).json(message);
  } catch (error) {
    console.error("Message Creation Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getThreadReplies = async (req, res) => {
  try {
    const { messageId } = req.params;
    const replies = await prisma.discussionMessage.findMany({
      where: { threadId: messageId },
      include: {
        user: { select: { id: true, name: true, role: true } },
        attachments: true,
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(replies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPinnedMessages = async (req, res) => {
  try {
    const { projectId } = req.query;
    const pinned = await prisma.discussionMessage.findMany({
      where: { 
        isPinned: true,
        channel: { projectId } 
      },
      include: {
        user: { select: { name: true } },
        channel: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(pinned);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.togglePin = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { isPinned } = req.body;
    
    const message = await prisma.discussionMessage.update({
      where: { id: messageId },
      data: { isPinned },
      include: { channel: { select: { id: true } } }
    });
    
    const io = socketIo.getIO();
    io.to(message.channel.id).emit('message_pinned', message);
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { protect } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');

// @route   POST /api/notes
// @desc    Create a new note (text or voice)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const note = new Note({
      ...req.body,
      author: req.user._id,
      readBy: [req.user._id]
    });
    const saved = await note.save();
    
    // Broadcast via socket could happen here, or handled by frontend
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notes
// @desc    Get all notes
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Optionally filter by priority, date, or author via req.query
    const notes = await Note.find()
      .populate('author', 'name email role')
      .populate('mentions', 'name')
      .populate('replies.author', 'name role')
      .sort('-createdAt');
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notes/:id/reply
// @desc    Add a reply to a note
// @access  Private
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const reply = {
      text: req.body.text,
      voiceUrl: req.body.voiceUrl,
      attachments: req.body.attachments || [],
      author: req.user._id,
      mentions: req.body.mentions || []
    };

    note.replies.push(reply);
    
    // reset readBy status so others are notified
    note.readBy = [req.user._id];
    
    await note.save();
    const updatedNote = await Note.findById(req.params.id)
      .populate('author', 'name email role')
      .populate('replies.author', 'name role');

    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notes/:id/read
// @desc    Mark note as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note.readBy.includes(req.user._id)) {
      note.readBy.push(req.user._id);
      await note.save();
    }
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

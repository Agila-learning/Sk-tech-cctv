const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { auth } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');

// @route   POST /api/notes
// @desc    Create a new note (text or voice)
// @access  Private
router.post('/', auth, async (req, res) => {
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
router.get('/', auth, async (req, res) => {
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
router.post('/:id/reply', auth, async (req, res) => {
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
router.put('/:id/read', auth, async (req, res) => {
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

// @route   PUT /api/notes/:id
// @desc    Edit note content
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    
    // Allow author or admin/superadmin to edit
    if (note.author.toString() !== req.user._id.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to edit this note' });
    }

    note.content = req.body.content || note.content;
    note.priority = req.body.priority || note.priority;
    note.isEdited = true;
    
    const saved = await note.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/notes/:id/status
// @desc    Update note status (Approve/Reject)
// @access  Private (Admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!['admin', 'sub-admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to change status' });
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    
    note.status = req.body.status || note.status;
    const saved = await note.save();
    
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete note
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    
    // Allow author or admin/superadmin to delete
    if (note.author.toString() !== req.user._id.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await note.deleteOne();
    res.json({ message: 'Note removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

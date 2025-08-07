require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to verify JWT and get user info
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;
  next();
}

// Send a message
app.post('/send-message', authMiddleware, async (req, res) => {
  const { subject, body, recipient_id } = req.body;
  const sender_id = req.user.id;

  if (!subject || !body || !recipient_id) {
    return res.status(400).json({ error: 'Subject, body, and recipient_id are required.' });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert([{ sender_id, recipient_id, subject, body }]);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Message sent', data });
});

// Get inbox messages
app.get('/inbox', authMiddleware, async (req, res) => {
  const user_id = req.user.id;

  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, subject, body, created_at')
    .eq('recipient_id', user_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get sent messages
app.get('/sent', authMiddleware, async (req, res) => {
  const user_id = req.user.id;

  const { data, error } = await supabase
    .from('messages')
    .select('id, recipient_id, subject, body, created_at')
    .eq('sender_id', user_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// User signup
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: data.user });
});

// User login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ session: data.session });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SwiftPost backend running on port ${PORT}`);
});

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mutgxqhlltbbjdphxtzj.supabase.co'; // replace
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11dGd4cWhsbHRiYmpkcGh4dHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTg4OTYsImV4cCI6MjA3MDA3NDg5Nn0.MSLy2o4NtDmY1twswpaG-4zQZniy7lSESBR0RJgMLZ4'; // replace

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [messages, setMessages] = useState([]);
  const [inbox, setInbox] = useState(true); // toggle inbox/sent
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchMessages();
      else setMessages([]);
    });
  }, []);

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert('Check your email for confirmation link.');
  }

  async function signIn() {
    const { error } = await supabase.auth.signIn({ email, password });
    if (error) alert(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function fetchMessages() {
    let { data, error } = inbox
      ? await supabase
          .from('messages')
          .select('*')
          .eq('recipient_id', supabase.auth.user().id)
          .order('created_at', { ascending: false })
      : await supabase
          .from('messages')
          .select('*')
          .eq('sender_id', supabase.auth.user().id)
          .order('created_at', { ascending: false });

    if (error) alert(error.message);
    else setMessages(data);
  }

  async function sendMessage() {
    const sender_id = supabase.auth.user().id;
    if (!recipient || !subject || !body) {
      alert('Please fill all fields');
      return;
    }

    const { error } = await supabase
      .from('messages')
      .insert([{ sender_id, recipient_id: recipient, subject, body }]);

    if (error) alert(error.message);
    else {
      alert('Message sent!');
      setRecipient('');
      setSubject('');
      setBody('');
      fetchMessages();
    }
  }

  if (!session)
    return (
      <div style={{ padding: 20 }}>
        <h2>SwiftPost Login</h2>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ display: 'block', marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ display: 'block', marginBottom: 10 }}
        />
        <button onClick={signIn}>Login</button>
        <button onClick={signUp} style={{ marginLeft: 10 }}>
          Sign Up
        </button>
      </div>
    );

  return (
    <div style={{ padding: 20 }}>
      <h2>SwiftPost</h2>
      <button onClick={signOut}>Sign Out</button>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => { setInbox(true); fetchMessages(); }}>
          Inbox
        </button>
        <button onClick={() => { setInbox(false); fetchMessages(); }} style={{ marginLeft: 10 }}>
          Sent
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>{inbox ? 'Inbox' : 'Sent'} Messages</h3>
        {messages.length === 0 && <p>No messages</p>}
        <ul>
          {messages.map(msg => (
            <li key={msg.id} style={{ marginBottom: 10 }}>
              <b>Subject:</b> {msg.subject} <br />
              <b>From:</b> {inbox ? msg.sender_id : 'You'} <br />
              <b>To:</b> {!inbox ? msg.recipient_id : 'You'} <br />
              <p>{msg.body}</p>
              <small>{new Date(msg.created_at).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 40 }}>
        <h3>Compose Message</h3>
        <input
          placeholder="Recipient User ID"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          style={{ display: 'block', marginBottom: 10 }}
        />
        <input
          placeholder="Subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={{ display: 'block', marginBottom: 10 }}
        />
        <textarea
          placeholder="Message body"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={5}
          style={{ display: 'block', marginBottom: 10, width: '100%' }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

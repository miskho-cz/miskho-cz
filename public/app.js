import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = window.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const loginErrorDiv = document.getElementById('loginError');
const messagesDiv = document.getElementById('messages');

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const messageInput = document.getElementById('messageInput');

const btnLogin = document.getElementById('btnLogin');
const btnSend = document.getElementById('btnSend');
const btnLogout = document.getElementById('btnLogout');

const chatUsers = ['devon', 'terezka'];

let currentUser = null;
let currentProfile = null;
let otherProfile = null;
let subscription = null;

async function signIn(username, password) {
  loginErrorDiv.textContent = '';
  const email = `${username}@fakeemail.com`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginErrorDiv.textContent = error.message;
    return null;
  }
  return data.user;
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

async function fetchOtherProfile(currentUsername) {
  const otherUsername = chatUsers.find(u => u !== currentUsername);
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', otherUsername)
    .single();

  if (error) {
    console.error('Error fetching other profile:', error);
    return null;
  }
  return data;
}

async function fetchMessages(currentUserId, otherUserId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender.eq.${currentUserId},recipient.eq.${currentUserId}`)
    .order('inserted_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data.filter(msg =>
    (msg.sender === currentUserId && msg.recipient === otherUserId) ||
    (msg.sender === otherUserId && msg.recipient === currentUserId)
  );
}

function renderMessages(messages, currentUserId) {
  messagesDiv.innerHTML = '';
  messages.forEach(msg => {
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(msg.sender === currentUserId ? 'you' : 'other');
    div.textContent = `${msg.sender === currentUserId ? 'You' : otherProfile.username}: ${msg.content}`;
    messagesDiv.appendChild(div);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage(content) {
  if (!content.trim()) return;

  const { data, error } = await supabase.from('messages').insert([
    { sender: currentUser.id, recipient: otherProfile.id, content }
  ]);

  if (error) {
    alert('Error sending message: ' + error.message);
    return;
  }
  messageInput.value = '';
}

function subscribeToNewMessages(currentUserId, otherUserId) {
  if (subscription) {
    supabase.removeChannel(subscription);
  }

  subscription = supabase
    .channel('public:messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      payload => {
        const msg = payload.new;
        if (
          (msg.sender === currentUserId && msg.recipient === otherUserId) ||
          (msg.sender === otherUserId && msg.recipient === currentUserId)
        ) {
          const div = document.createElement('div');
          div.classList.add('message');
          div.classList.add(msg.sender === currentUserId ? 'you' : 'other');
          div.textContent = `${msg.sender === currentUserId ? 'You' : otherProfile.username}: ${msg.content}`;
          messagesDiv.appendChild(div);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
      }
    )
    .subscribe();
}

btnLogin.onclick = async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    loginErrorDiv.textContent = 'Please enter username and password.';
    return;
  }

  const user = await signIn(username, password);
  if (!user) return;

  currentUser = user;
  currentProfile = await fetchProfile(user.id);
  otherProfile = await fetchOtherProfile(currentProfile.username);

  loginDiv.style.display = 'none';
  chatDiv.style.display = 'block';

  const messages = await fetchMessages(currentUser.id, otherProfile.id);
  renderMessages(messages, currentUser.id);

  subscribeToNewMessages(currentUser.id, otherProfile.id);
};

btnSend.onclick = async () => {
  const content = messageInput.value;
  await sendMessage(content);
};

btnLogout.onclick = async () => {
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
  otherProfile = null;
  if (subscription) {
    supabase.removeChannel(subscription);
    subscription = null;
  }
  messagesDiv.innerHTML = '';
  loginDiv.style.display = 'block';
  chatDiv.style.display = 'none';
  usernameInput.value = '';
  passwordInput.value = '';
  messageInput.value = '';
  loginErrorDiv.textContent = '';
};

supabase.auth.onAuthStateChange((event, session) => {
  if (!session) {
    btnLogout.onclick();
  }
});

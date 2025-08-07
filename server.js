import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT;  // no fallback to 3000

app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Supabase Chat</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      #login, #chat { max-width: 400px; margin: auto; }
      #messages { border: 1px solid #ccc; height: 300px; overflow-y: scroll; padding: 10px; margin-bottom: 10px; }
      .message { margin-bottom: 8px; }
      .message.you { font-weight: bold; }
      .message.other { color: gray; }
    </style>
  </head>
  <body>
    <div id="login">
      <h2>Login</h2>
      <input id="username" placeholder="Username" />
      <input id="password" placeholder="Password" type="password" />
      <button id="btnLogin">Login</button>
      <div id="loginError" style="color:red"></div>
    </div>

    <div id="chat" style="display:none;">
      <h2>Chat with Terezka / Devon</h2>
      <div id="messages"></div>
      <input id="messageInput" placeholder="Type a message" />
      <button id="btnSend">Send</button>
      <button id="btnLogout">Logout</button>
    </div>

    <script>
      window.env = {
        SUPABASE_URL: ${JSON.stringify(process.env.SUPABASE_URL)},
        SUPABASE_ANON_KEY: ${JSON.stringify(process.env.SUPABASE_ANON_KEY)}
      };
    </script>
    <script type="module" src="/app.js"></script>
  </body>
  </html>
  `);
});

app.use(express.static(path.join(process.cwd(), 'public')));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

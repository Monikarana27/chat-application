💬 ChatBud

A Modern Real-Time Chat App with MySQL

🚀 About the Project

ChatBud is my take on building a real-time chat application from scratch.
Instead of just relying on NoSQL or Firebase, I wanted to experiment with a relational database (MySQL) for chat storage.

Think of it as:
👉 A modern, pixel-themed chat UI
👉 Messages that update instantly without refreshing
👉 A scalable structure that feels like WhatsApp/Slack’s younger sibling

🎯 Why I Built This

When interviewers ask “Tell me about a project you’re proud of”, ChatBud is the one I bring up.

I wanted to prove I can design real-time systems.

I wanted to show strong backend + database integration skills.

And honestly, I just wanted to make chatting fun & stylish with a custom theme.

🛠️ Tech Stack

Frontend → HTML, CSS (Pixel-style UI 🎨)

Backend → Node.js + Express.js

Database → MySQL (structured chat storage)

Real-time Engine → Socket.io (instant updates 🔔)

🔄 How It Works

User joins the chatroom → Their session is stored.

Message sent → Goes through Socket.io to the server.

Server logs message → Stores it neatly in MySQL.

Other users see it instantly → No refresh needed.

📌 Key Features

✔️ Real-time chatting with multiple users
✔️ Pixel-themed chat UI (retro vibes 🎮)
✔️ Messages stored in MySQL (persistent history)
✔️ Easy to extend → add authentication, groups, or DMs

(Imagine a cozy pixel-chat window here 👾)

🧑‍💻 Setup Instructions
# 1️⃣ Clone the repo
git clone https://github.com/your-username/chatbud.git

# 2️⃣ Install dependencies
npm install

# 3️⃣ Configure MySQL in .env
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=chatbud

# 4️⃣ Start the server
npm start

🎤 How I Explain It in Interviews

“ChatBud is a real-time chat app I built using Node.js, Socket.io, and MySQL.
Most people use MongoDB or Firebase for chat apps, but I wanted to show how a relational database can handle real-time communication too.
I designed the system so every message is stored in MySQL instantly, while Socket.io keeps the conversation flowing without refreshes.
The result is a fast, reliable, and stylish chat app.”

🌟 What’s Next?

Add user authentication 🔑

Support for group chats & media sharing 📷

Make it deploy-ready on cloud ☁️

🔥 That’s ChatBud — my fun yet technical project that balances real-time communication with database reliability.

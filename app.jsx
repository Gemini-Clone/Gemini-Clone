import { useState } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Temporary Gemini response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "gemini",
          text: "This is a Gemini response. Connect the Gemini API to generate real responses.",
        },
      ]);
    }, 500);

    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Gemini</h2>

        <button className="new-chat" onClick={() => setMessages([])}>
          + New Chat
        </button>

        <div className="sidebar-item">Recent Chats</div>
        <div className="sidebar-item">History</div>
        <div className="sidebar-item">Settings</div>
      </aside>

      {/* Main Chat */}
      <main className="chat-container">
        <header className="header">
          <h2>Gemini Clone</h2>
        </header>

        <section className="messages">
          {messages.length === 0 ? (
            <div className="welcome">
              <h1>Hello, how can I help?</h1>
              <p>Ask me anything.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`message ${
                  message.role === "user" ? "user" : "gemini"
                }`}
              >
                <strong>
                  {message.role === "user" ? "You" : "Gemini"}
                </strong>

                <p>{message.text}</p>
              </div>
            ))
          )}
        </section>

        {/* Input */}
        <div className="input-area">
          <input
            type="text"
            placeholder="Enter a prompt..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button onClick={sendMessage}>
            Send
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;

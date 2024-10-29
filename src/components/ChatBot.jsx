import { GiReturnArrow } from "react-icons/gi";
import { Bounce, Dots, Sentry } from "react-activity";
import "react-activity/dist/library.css";
import { TypeAnimation } from "react-type-animation";
import React, { useState } from "react";
import axios from "axios";
import { FiSend } from "react-icons/fi";
import "./ChatBot.css";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSimilarQuestions, setHasSimilarQuestions] = useState(false); // Track if similar questions are shown

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { text: input, sender: "user" }];
    setMessages(newMessages);
    setIsLoading(true);
    setInput("");

    try {
      const response = await axios.post(
        "https://unachatbot.onrender.com/ask_questions/",
        { question: input }
      );

      if (response.data) {
        // Clear the similar question message if it exists before adding new ones
        const updatedMessages = newMessages.filter(
          (msg) => msg.text !== "Do you mean:"
        );

        // Check if similar questions are not already shown
        if (
          response.data.similar_questions &&
          response.data.similar_questions.length > 0 &&
          !hasSimilarQuestions
        ) {
          // Add the "Do you mean:" message
          updatedMessages.push({
            text: "Do you mean:",
            sender: "bot",
            icon: "https://i.postimg.cc/YSzf3QQx/chatbot-1.png",
          });

          // Add each similar question as a button
          response.data.similar_questions.forEach((q) => {
            updatedMessages.push({
              text: q.question,
              sender: "bot",
              id: q.id,
              isButton: true, // Ensure isButton is added
            });
          });

          setHasSimilarQuestions(true); // Mark similar questions as shown
        } else if (response.data.answer) {
          updatedMessages.push({
            text: response.data.answer,
            sender: "bot",
            icon: "https://i.postimg.cc/YSzf3QQx/chatbot-1.png",
            isHtml: true,
          });
        } else {
          updatedMessages.push({
            text: "?????? ?? ???? ????? ????.",
            sender: "bot",
            icon: "https://i.postimg.cc/wB80F6Z9/chatbot.png",
          });
        }

        setMessages(updatedMessages); // Update the messages state once
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "??? ??? ?? ??????? ?? ??????. ???? ???????? ??? ????.",
          sender: "bot",
          icon: "https://i.postimg.cc/wB80F6Z9/chatbot.png",
        },
      ]);
    }

    setIsLoading(false);
  };

  const handleSimilarQuestion = (id) => {
    console.log(`?? ?????? ?????? ID: ${id}`);
    // You can add logic to handle the selected question
  };

  const startListening = () => {
    const recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.interimResults = false;
    recognition.lang = "ar";

    recognition.onstart = () => {
      console.log("Listening for voice input...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage({ preventDefault: () => {} });
    };

    recognition.onerror = (event) => {
      console.error("Error occurred in recognition: " + event.error);
    };

    recognition.onend = () => {
      console.log("Stopped listening.");
    };

    recognition.start();
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-header">
          <h1>يونا شات بوت</h1>
          <p>مساعدك الشخصي الزكي</p>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender}`}>
              {msg.sender === "bot" && msg.icon && (
                <img src={msg.icon} alt="Bot" className="message-avatar" />
              )}
              <div className="message-text">
                <TypeAnimation
                  sequence={[msg.text, () => setIsTypingComplete(true)]}
                  speed={50}
                  repeat={0}
                  wrapper="div"
                  cursor={!isTypingComplete}
                  render={() => (
                    <div
                      style={{ fontFamily: "Tajawal, sans-serif" }}
                      className="message-text"
                      {...(msg.isHtml
                        ? { dangerouslySetInnerHTML: { __html: msg.text } }
                        : { children: msg.text })}
                    ></div>
                  )}
                />
              </div>
              {msg.sender === "bot" && msg.isButton && (
                <button
                  onClick={() => handleSimilarQuestion(msg.id)}
                  className="select-question-button"
                >
                  {/* <img src="../question.png" alt="" /> */}
                  {/* {msg.text} */}
                  {/* <FiSend /> */}
                  <GiReturnArrow />
                </button>
              )}
            </div>
          ))}
          {isLoading && (
            <Sentry style={{ height: "30%", width: "30%", margin: "auto" }} />
          )}
        </div>

        <form onSubmit={sendMessage} className="chat-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here...."
            className="chat-input"
          />
          <button type="submit" className="send-button">
            <FiSend />
          </button>
          <button
            type="button"
            onMouseDown={startListening}
            className="microphone-button"
          >
            <img
              src="../microphone.png"
              alt="Microphone"
              style={{
                width: "27px",
                height: "27px",
              }}
            />
          </button>
        </form>
      </div>
      <img src="../robot2.png" alt="" className="robot-container" />
    </div>
  );
};

export default ChatPage;

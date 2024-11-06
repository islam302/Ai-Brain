import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FiSend } from "react-icons/fi";
import { GiReturnArrow } from "react-icons/gi";
import HTMLParser from 'html-react-parser';
import { TypeAnimation } from "react-type-animation";
import "./ChatBot.css";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [useUnaApi, setUseUnaApi] = useState(false); // حالة التبديل بين APIs
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    document.title = "UNA BOOT";
  }, []);

  const addLinkTargetAttribute = (html) => {
    return html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { text: input, sender: "user" }];
    setMessages(newMessages);
    setInput("");

    const apiUrl = useUnaApi ? "https://news-llm-generator.onrender.com/llm/ask_una/" : "https://unachatbot.onrender.com/ask_questions/";

    try {
      const response = await axios.post(apiUrl, { question: input });
      const updatedMessages = [...newMessages];

      if (useUnaApi) {
        // التعامل مع واجهة API ask_openai
        if (response.data.answer && response.data.answer.length > 0) {
          response.data.answer.forEach((answer) => {
            updatedMessages.push({
              text: `
                <div>
                  <h3>${answer.title}</h3>
                  <p>${answer.content}</p>
                  <a href="${answer.link}" target="_blank" rel="noopener noreferrer">اقرأ المزيد</a>
                  <br>
                  <img src="${answer.image_url}" alt="Image" style="width: 100%; height: auto; margin-top: 10px;">
                </div>
              `,
              sender: "bot",
              icon: "https://i.postimg.cc/YSzf3QQx/chatbot-1.png",
              isHtml: true,
            });
          });
        } else {
          updatedMessages.push({
            text: "آسف، لم أتمكن من العثور على إجابة.",
            sender: "bot",
            icon: "https://i.postimg.cc/wB80F6Z9/chatbot.png",
          });
        }
      } else {
        // التعامل مع واجهة API ask
        if (response.data.similar_questions && response.data.similar_questions.length > 0) {
          updatedMessages.push({
            text: ":هل تقصد",
            sender: "bot",
            icon: "https://i.postimg.cc/YSzf3QQx/chatbot-1.png",
          });

          // إضافة أزرار للأسئلة المشابهة
          response.data.similar_questions.forEach((q) => {
            updatedMessages.push({
              sender: "bot",
              id: q.id,
              text: q.question,
              isButton: true,
              isHtml: false,
            });
          });
        } else if (response.data.answer) {
          updatedMessages.push({
            text: addLinkTargetAttribute(response.data.answer),
            sender: "bot",
            icon: "https://i.postimg.cc/YSzf3QQx/chatbot-1.png",
            isHtml: true,
          });
        } else {
          updatedMessages.push({
            text: "آسف، لم أتمكن من العثور على الإجابة.",
            sender: "bot",
            icon: "https://i.postimg.cc/wB80F6Z9/chatbot.png",
          });
        }
      }

      setMessages(updatedMessages);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى.",
          sender: "bot",
          icon: "https://i.postimg.cc/wB80F6Z9/chatbot.png",
        },
      ]);
    }
  };

  const handleSimilarQuestion = async (id) => {
    const similarQuestion = messages.find((msg) => msg.id === id);
    if (!similarQuestion) return;

    try {
      const response = await axios.post("https://unachatbot.onrender.com/ask_questions/", {
        question: similarQuestion.text,
      });

      const newMessages = [
        ...messages,
        { text: similarQuestion.text, sender: "user" },
      ];

      if (response.data && response.data.answer) {
        newMessages.push({
          text: response.data.answer,
          sender: "bot",
          icon: "https://i.postimg.cc/YSzf3QQx/chatbot-1.png",
          isHtml: true,
        });
      } else {
        newMessages.push({
          text: "عذرًا، لم أتمكن من العثور على إجابة لهذا السؤال.",
          sender: "bot",
          icon: "https://i.postimg.cc/wB80F6Z9/chatbot.png",
        });
      }

      setMessages(newMessages);
    } catch (error) {
      console.error("حدث خطأ أثناء إرسال السؤال:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى.",
          sender: "bot",
          icon: "https://i.postimg.cc/wB80F6Z9/chatbot.png",
        },
      ]);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.onstart = () => {
      console.log("Voice recognition started. Speak into the microphone.");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(new Event("submit"));
    };

    recognition.onerror = (event) => {
      console.error("Error occurred in recognition: " + event.error);
    };

    recognition.start();
  };

  const handleNewsButtonClick = () => {
    setUseUnaApi(!useUnaApi);
  };

  return (
      <div className="chat-page">
        <form onSubmit={sendMessage} className="chat-input-form">
          <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="...اكتب سؤالك هنا"
              className="chat-input"
              style={{
                textAlign: "right",
                backgroundColor: useUnaApi ? "#e0f7da" : "", // لون مختلف عند تفعيل أخبار UNA
              }}
          />
          <button type="submit" className="send-button">
            <FiSend/>
          </button>
          <button
              type="button"
              onMouseDown={startListening}
              className="microphone-button"
          >
            <img
                src="../microphone.png"
                alt="ميكروفون"
                style={{
                  width: "27px",
                  height: "27px",
                }}
            />
          </button>
          <button
              type="button"
              onClick={handleNewsButtonClick}
              className={`news-button una-news-button ${useUnaApi ? 'pressed' : ''}`}
              style={{
                backgroundColor: useUnaApi ? "#023f31" : "#07755DFF", // لون مختلف حسب الحالة
                color: useUnaApi ? "#ffffff" : "#ffffff", // لون نص مختلف
              }}
          >
            اخبار من يونا
          </button>

        </form>
        <div className="chat-header">
          <h1>UNA BOOT</h1>
          <p>مساعدك الشخصي بالذكاء الإصطناعي</p>
        </div>
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.sender}`}>
                <div className="message-text">
                  {msg.isHtml ? (
                    <div>{HTMLParser(msg.text)}</div>
                  ) : msg.isButton ? null : (
                    <TypeAnimation
                      sequence={[msg.text, () => {}]}
                      speed={70}
                      repeat={0}
                      wrapper="div"
                    />
                  )}
                </div>
                {msg.sender === "bot" && msg.isButton && (
                  <button
                    onClick={() => handleSimilarQuestion(msg.id)}
                    className="similar-question-button"
                  >
                    <GiReturnArrow /> {msg.text}
                  </button>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <img src="../rob.png" alt="" className="robot-container" />
      </div>
  );
};

export default ChatPage;

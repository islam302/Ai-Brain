import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FiSend } from "react-icons/fi";
import { GiReturnArrow } from "react-icons/gi";
import HTMLParser from 'html-react-parser';
import { TypeAnimation } from "react-type-animation";
import '@fortawesome/fontawesome-free/css/all.min.css'; // استيراد Font Awesome
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

    const apiUrl = useUnaApi ? "https://unachatbot.onrender.com/ask_una/" : "https://unachatbot.onrender.com/ask_questions/";

    try {
      const response = await axios.post(apiUrl, { question: input });
      const updatedMessages = [...newMessages];

      if (useUnaApi) {
        // التعامل مع واجهة API ask_openai
        if (response.data.answer && response.data.answer.length > 0) {
          response.data.answer.forEach((answer) => {
            updatedMessages.push({
              text: `
                <div style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; padding: 15px; margin-bottom: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <img src="${answer.image_url}" alt="Image" style="width: 100%; height: auto; margin-top: 10px; border-radius: 10px;">
                    
                    <p style="color: #666; font-size: 12px; margin-top: 10px; text-align: center;">${answer.date}</p>
                    
                    <h3 style="font-size: 18px; color: #333; margin-top: 10px;">${answer.title}</h3>
                    
                    <p style="color: #555; font-size: 14px; line-height: 1.6; margin-top: 10px;">${answer.content}</p>
                    
                    <a href="${answer.link}" target="_blank" rel="noopener noreferrer" style="background-color: #07755d; color: white; padding: 8px 16px; text-decoration: none; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 10px; text-align: center;">
                        أكمل القراءة
                    </a>
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
              className={`una-news-button ${useUnaApi ? 'pressed' : ''}`}
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
                            sequence={[msg.text, () => {
                            }]}
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
                        <GiReturnArrow/> {msg.text}
                      </button>
                  )}
                </div>
            ))}
            <div ref={messagesEndRef}/>
          </div>
        </div>
        <img src="../rob.png" alt="" className="robot-container"/>

          <div className="footer">
              <p>© حقوق الطبع والنشر 2024 <a href="https://una-oic.org/" target="_blank" rel="noopener noreferrer"
                                             style={{color: 'blue'}}>UNA.OIC.ORG</a> جميع الحقوق محفوظة لصالح</p>
              <div className="social-links">
                  <a href="https://www.whatsapp.com/channel/0029Va9VuuE1XquahZEY5S1S" target="_blank"
                     rel="noopener noreferrer">
                      <i className="fab fa-whatsapp"></i>
                  </a>
                  <a href="https://x.com/UNAOIC" target="_blank" rel="noopener noreferrer">
                      <i className="fab fa-twitter"></i>
                  </a>
                  <a href="https://www.facebook.com/unaoic" target="_blank" rel="noopener noreferrer">
                      <i className="fab fa-facebook"></i>
                  </a>
                  <a href="https://una-oic.org/" target="_blank" rel="noopener noreferrer">
                      <i className="fas fa-globe"></i>
                  </a>
              </div>
          </div>

      </div>
  );
};

export default ChatPage;

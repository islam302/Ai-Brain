import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FiSend } from "react-icons/fi";
import { GiReturnArrow } from "react-icons/gi";
import HTMLParser from 'html-react-parser';
import { TypeAnimation } from "react-type-animation";
import AnimatedBackground from "./AnimatedBg";
import "./ChatBot.css";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
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

    try {
      const response = await axios.post("https://unachatbot.onrender.com/ask_questions/", { question: input });
      const updatedMessages = [...newMessages];

      // Handle similar questions
      if (
        response.data.similar_questions &&
        response.data.similar_questions.length > 0
      ) {
        updatedMessages.push({
          text: ":هل تقصد",
          sender: "bot",
          icon: "https://i.postimg.cc/YSzf3QQx/chatbot-1.png",
        });

        // إضافة الأزرار فقط للأسئلة المشابهة بدون إضافة نص الرسالة
        response.data.similar_questions.forEach((q) => {
          updatedMessages.push({
            sender: "bot",
            id: q.id,
            text: q.question, // هذا هو النص الذي يظهر على الزر فقط
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
    // ابحث عن السؤال المشابه باستخدام ID
    const similarQuestion = messages.find((msg) => msg.id === id);
    if (!similarQuestion) return;

    try {
      const response = await axios.post("https://unachatbot.onrender.com/ask_questions/", {
        question: similarQuestion.text,
      });

      // إضافة الرسالة الجديدة كمحادثة من المستخدم
      const newMessages = [
        ...messages,
        { text: similarQuestion.text, sender: "user" },
      ];

      // تحقق من وجود إجابة وتحديث الرسائل
      if (response.data && response.data.answer) {
        newMessages.push({
          text: response.data.answer,
          sender: "bot",
          icon: "https://i.postimg.cc/YSzf3QQx/chatbot-1.png",
          isHtml: true, // تعيين النوع كـ HTML لعرض الروابط
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
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

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

  return (
    <AnimatedBackground>
      <div className="chat-page">
        <form onSubmit={sendMessage} className="chat-input-form">
          <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="...اكتب سؤالك هنا"
              className="chat-input"
              style={{textAlign: "right"}}
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
                    ) : msg.isButton ? null : ( // لا يتم عرض النص كرسالة إذا كان msg.isButton صحيحاً
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
                        <GiReturnArrow/> {msg.text}
                      </button>
                  )}
                </div>
            ))}

            <div ref={messagesEndRef}/>
          </div>
        </div>

        <img src="../rob.png" alt="" className="robot-container"/>
      </div>
    </AnimatedBackground>
  );
};

export default ChatPage;

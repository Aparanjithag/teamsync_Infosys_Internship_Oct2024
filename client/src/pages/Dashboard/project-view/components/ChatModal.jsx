import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BiChat } from 'react-icons/bi';

const ChatModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [media, setMedia] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userReactions, setUserReactions] = useState({});
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const projectId = localStorage.getItem('project_id');
      
      const response = await axios.post(
        'http://localhost:3001/comment/messages',
        { project_id: projectId },
        { headers: { Authorization: token } }
      );
      
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLikeDislike = async (commentId, isLike) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:3001/comment/like-dislike',
        { 
          like: isLike ? 1 : 0, 
          comment_id: commentId 
        },
        { headers: { Authorization: token } }
      );
      
      fetchMessages();
    } catch (error) {
      console.error('Error updating like/dislike:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleFileDownload = async (file) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(file.file_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.file_type });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const FileDisplay = ({ file }) => (
    <div className="mt-2 p-2 bg-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium">{file.file_name}</span>
          <span className="text-xs text-gray-500">({formatFileSize(file.file_size)})</span>
        </div>
        <button 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          onClick={() => handleFileDownload(file)}
        >
          Download
        </button>
      </div>
    </div>
  );

  const sendMessage = async () => {
    if (message.trim() !== '' || media) {
      try {
        const token = localStorage.getItem('token');
        const projectId = localStorage.getItem('project_id');
        const creatorId = localStorage.getItem('userEmail');
        
        const requestBody = {
          project_id: projectId,
          creator_id: creatorId,
          content: message.trim()
        };

        if (media) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            requestBody.file = {
              fileName: media.name,
              fileType: media.type,
              fileSize: media.size,
              data: e.target.result.split(',')[1]
            };
            await sendRequestToServer(requestBody, token);
          };
          reader.readAsDataURL(media);
        } else {
          await sendRequestToServer(requestBody, token);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const sendRequestToServer = async (requestBody, token) => {
    try {
      await axios.post(
        'http://localhost:3001/comment/send-message',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'authorization': token
          }
        }
      );
      
      setMessage('');
      setMedia(null);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message to server:', error);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="bg-blue-950 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out mr-2"
        aria-label="Open Chat"
        title="Open Chat"
      >
        <BiChat className="w-5 h-5 inline" />
      </button>

      {isOpen && (
        <div className="fixed z-10 top-40 right-5 bg-transparent">
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="bg-white rounded-2xl shadow-xl transform transition-all sm:max-w-md w-full overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-3 border-b rounded-t-2xl">
                <h3 className="text-lg font-bold text-white">Chat Room</h3>
              </div>
              <div 
                className="px-4 py-5 h-80 overflow-y-auto space-y-3 bg-gray-100 rounded-b-2xl"
                ref={messagesContainerRef}
              >
                {messages.map((msg, index) => (
                  <div
                    key={msg._id}
                    className={`p-2 rounded-2xl ${
                      msg.creator_id === localStorage.getItem('userEmail')
                        ? 'bg-green-100 text-gray-800 ml-auto'
                        : 'bg-gray-300 text-gray-900 mr-auto'
                    }`}
                    style={{ maxWidth: '70%' }}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm">{msg.creator_id}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                    
                    {msg.content && (
                      <p className="mt-1 text-gray-800">{msg.content}</p>
                    )}
                    
                    {msg.file_name && (
                      <FileDisplay file={msg} />
                    )}
                    
                    <div className="flex items-center space-x-4 mt-2">
                      <button 
                        onClick={() => handleLikeDislike(msg._id, true)}
                        className="text-sm flex items-center space-x-1"
                      >
                        <span>👍</span>
                        <span>{msg.likes.length}</span>
                      </button>
                      <button 
                        onClick={() => handleLikeDislike(msg._id, false)}
                        className="text-sm flex items-center space-x-1"
                      >
                        <span>👎</span>
                        <span>{msg.dislike.length}</span>
                      </button>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="bg-gray-50 px-4 py-3 flex items-center space-x-3 rounded-b-2xl">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-grow border border-gray-300 rounded-full p-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type a message..."
                />
                <label className="flex items-center cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => setMedia(e.target.files[0])}
                    className="hidden"
                    accept="*/*"
                  />
                  <span className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-700">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v.01M12 16v.01M12 8v.01M4.5 12A7.5 7.5 0 0112 4.5 7.5 7.5 0 0119.5 12 7.5 7.5 0 0112 19.5 7.5 7.5 0 014.5 12z" />
                    </svg>
                  </span>
                </label>
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 text-white rounded-full px-4 py-2 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                >
                  Send
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 hover:text-gray-800 focus:outline-none"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatModal;
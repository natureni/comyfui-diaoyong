import React, { useState, useRef, useEffect } from 'react';
import './ImageGenerator.css';
import { API_KEY } from '../config';

const UserAvatar = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#0A7CFF"/>
    <path d="M16 8C13.79 8 12 9.79 12 12C12 14.21 13.79 16 16 16C18.21 16 20 14.21 20 12C20 9.79 18.21 8 16 8ZM16 18C13.33 18 8 19.34 8 22V24H24V22C24 19.34 18.67 18 16 18Z" fill="white"/>
  </svg>
);

const AIAvatar = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#E5E5EA"/>
    <path d="M16 8C13.79 8 12 9.79 12 12C12 14.21 13.79 16 16 16C18.21 16 20 14.21 20 12C20 9.79 18.21 8 16 8ZM16 18C13.33 18 8 19.34 8 22V24H24V22C24 19.34 18.67 18 16 18Z" fill="#8E8E93"/>
  </svg>
);

const ROLES = {
  USER: {
    name: '用户',
    avatar: <UserAvatar />
  },
  AI_ARTIST: {
    name: 'AI 画师',
    avatar: <AIAvatar />
  },
  ART_CRITIC: {
    name: '艺术评论家',
    avatar: <AIAvatar />
  }
};

const generateImage = async (prompt) => {
  try {
    console.log('开始生成图片，提示词:', prompt);
    
    const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "stabilityai/stable-diffusion-3-5-large",
        prompt: prompt,
        image_size: "1024x1024",
        batch_size: 1,
        num_inference_steps: 50,
        guidance_scale: 7.5
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`生成图片失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.images?.[0]?.url) {
      throw new Error('API 返回数据格式错误');
    }

    return data.images[0].url;
  } catch (err) {
    console.error('生成图片错误:', err);
    throw err;
  }
};

const optimizePrompt = async (originalPrompt) => {
  try {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2-VL-72B-Instruct",
        messages: [
          {
            role: "system",
            content: "你是一位专业的 AI 绘画提示词专家。请优化用户的中文描述，使其更适合 Stable Diffusion 生成图像。请用英文回复，并解释优化原因。格式如下：\n1. Optimized Prompt: [英文提示词]\n2. Explanation: [中文解释]"
          },
          {
            role: "user",
            content: `请优化这个提示词用于AI绘画：${originalPrompt}`
          }
        ]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('提示词优化失败:', error);
    return originalPrompt;
  }
};

const analyzeImage = async (imageUrl, prompt) => {
  try {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2-VL-72B-Instruct",
        messages: [
          {
            role: "system",
            content: `你是一位专业的艺术评论家，请完成以下任务：
            1. 分析图片：
               - 构图分析：画面结构、主体位置、视觉重点
               - 色彩分析：整体色调、色彩搭配、明暗对比
               - 细节表现：纹理细节、光影效果、空间感
            
            2. 提供改进建议：
               - 基于分析结果，提供一个优化后的英文提示词
               - 解释为什么这个新提示词会产生更好的结果
            
            请用以下格式回复：
            
            ## 图片分析
            [详细分析内容]
            
            ## 优化建议
            新的提示词: [英文提示词]
            优化说明: [中文解释]`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                }
              },
              {
                type: "text",
                text: "请分析这张图片并提供优化建议。原始提示词是：" + prompt
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('图片分析失败:', error);
    return "图片分析失败，请稍后重试。";
  }
};

// 添加重新生成图标组件
const RegenerateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.453 12.893C19.802 16.744 16.415 19.677 12.207 19.677C7.99903 19.677 4.61203 16.744 3.96103 12.893M3.54703 11.107C4.19803 7.256 7.58503 4.323 11.793 4.323C15.801 4.323 19.072 7.008 19.897 10.599" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"/>
    <path d="M20.9951 6.5L19.8481 11.107L15.2411 9.96" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"/>
  </svg>
);

const ImageGenerator = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    setLoading(true);
    try {
      // 添加用户消息
      setMessages(prev => [...prev, {
        role: ROLES.USER,
        content: inputText,
        timestamp: new Date().toISOString()
      }]);

      // 优化提示词
      setMessages(prev => [...prev, {
        role: ROLES.AI_ARTIST,
        content: "正在优化提示词...",
        thinking: true
      }]);

      const optimizedPrompt = await optimizePrompt(inputText);
      setMessages(prev => prev.filter(msg => !msg.thinking).concat({
        role: ROLES.AI_ARTIST,
        content: optimizedPrompt,
        timestamp: new Date().toISOString()
      }));

      // 生成图片
      setMessages(prev => [...prev, {
        role: ROLES.AI_ARTIST,
        content: "正在生成图片...",
        thinking: true
      }]);

      const imageUrl = await generateImage(optimizedPrompt.split('\n')[0].replace('Optimized Prompt: ', '').trim());
      setMessages(prev => prev.filter(msg => !msg.thinking).concat({
        role: ROLES.AI_ARTIST,
        imageUrl,
        timestamp: new Date().toISOString()
      }));

      // 分析图片
      setMessages(prev => [...prev, {
        role: ROLES.ART_CRITIC,
        content: "正在分析图片...",
        thinking: true
      }]);

      const analysis = await analyzeImage(imageUrl, inputText);
      setMessages(prev => prev.filter(msg => !msg.thinking).concat({
        role: ROLES.ART_CRITIC,
        content: analysis,
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error('处理失败:', error);
      setMessages(prev => [...prev.filter(msg => !msg.thinking), {
        role: ROLES.AI_ARTIST,
        content: `错误: ${error.message}`,
        error: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (prompt) => {
    if (loading) return;
    
    setLoading(true);
    try {
      setMessages(prev => [...prev, {
        role: ROLES.AI_ARTIST,
        content: "正在使用优化后的提示词重新生成...",
        thinking: true
      }]);

      const imageUrl = await generateImage(prompt);
      
      setMessages(prev => prev.filter(msg => !msg.thinking).concat({
        role: ROLES.AI_ARTIST,
        imageUrl,
        timestamp: new Date().toISOString()
      }));

      // 分析新生成的图片
      setMessages(prev => [...prev, {
        role: ROLES.ART_CRITIC,
        content: "正在分析新生成的图片...",
        thinking: true
      }]);

      const analysis = await analyzeImage(imageUrl, prompt);
      setMessages(prev => prev.filter(msg => !msg.thinking).concat({
        role: ROLES.ART_CRITIC,
        content: analysis,
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error('重新生成失败:', error);
      setMessages(prev => [...prev.filter(msg => !msg.thinking), {
        role: ROLES.AI_ARTIST,
        content: `重新生成失败: ${error.message}`,
        error: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (message) => {
    if (message.thinking) {
      return <div className="thinking">正在思考...</div>;
    }

    if (message.imageUrl) {
      return (
        <div className="image-container">
          <img 
            src={message.imageUrl} 
            alt="Generated" 
            className="generated-image"
          />
        </div>
      );
    }

    if (message.role === ROLES.ART_CRITIC) {
      const sections = message.content.split('##').filter(s => s.trim());
      return (
        <div className="analysis-content">
          {sections.map((section, index) => {
            const [title, ...content] = section.split('\n').filter(s => s.trim());
            return (
              <div key={index} className="analysis-section">
                <div>{content.join('\n')}</div>
              </div>
            );
          })}
        </div>
      );
    }

    return <div>{message.content}</div>;
  };

  // 添加格式化时间的函数
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const renderTimestamp = (timestamp) => (
    <div className="timestamp">{formatTime(timestamp)}</div>
  );

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="back-button">←</button>
        <div className="chat-title">AI 图像助手</div>
        <div style={{width: "24px"}}></div>
      </div>
      
      <div className="messages-container">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message-group ${message.role.name.toLowerCase()}`}
          >
            <div className="avatar-container">
              {message.role.avatar}
            </div>
            <div className="message-content">
              <div className="message-bubble">
                {renderMessageContent(message)}
              </div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="输入图片描述..."
          disabled={loading}
          className="chat-input"
        />
        <button 
          type="submit" 
          disabled={loading} 
          className="send-button"
        >
          {loading ? '生成中...' : '发送'}
        </button>
      </form>
    </div>
  );
};

export default ImageGenerator; 
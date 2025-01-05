import React, { useState, useRef, useEffect } from 'react';
import './ImageGenerator.css';

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="avatar">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const ArtistIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="avatar">
    <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);

const CriticIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="avatar">
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
  </svg>
);

const ROLES = {
  USER: {
    name: '用户',
    icon: UserIcon
  },
  AI: {
    name: 'AI 画师',
    icon: ArtistIcon
  },
  CRITIC: {
    name: '图像点评官',
    icon: CriticIcon
  }
};

const ImageGenerator = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const messagesEndRef = useRef(null);
  const ws = useRef(null);

  const API_KEY = 'sk-ggeucbyvmrziuvoxqzhgwdjdvtlbgaluqsyqpbimuvdqnzgz';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080');
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch(data.type) {
        case 'progress':
          // 更新生成进度
          setProgress(data.data);
          break;
        case 'complete':
          // 处理完成的图片
          setImageUrl(data.imageUrl);
          break;
        case 'error':
          setError(data.error);
          break;
      }
    };
    
    return () => ws.current.close();
  }, []);

  const enhancePrompt = async (text) => {
    setIsEnhancing(true);
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-7B-Instruct",
          messages: [
            {
              role: "system",
              content: "你是一位专业的AI艺术提示词专家。请将用户的输入转换为优化的英文提示词，使其能生成更好的图像。输出格式为JSON：{\"english\": \"优化后的英文提示词\", \"chinese\": \"中文解释\"}。"
            },
            {
              role: "user",
              content: `请优化这个提示词：${text}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) throw new Error(`API错误: ${response.status}`);
      
      const data = await response.json();
      let result;
      try {
        result = JSON.parse(data.choices[0].message.content);
      } catch (e) {
        result = {
          english: data.choices[0].message.content,
          chinese: text
        };
      }
      return result;
    } catch (err) {
      console.error('提示词优化错误:', err);
      throw err;
    } finally {
      setIsEnhancing(false);
    }
  };

  const generateImage = async (prompt) => {
    try {
      console.log('发送生图请求:', prompt);
      
      // 发送生图请求
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('收到响应:', data);

      // 轮询检查图片生成状态
      const promptId = data.prompt_id;
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const historyResponse = await fetch(`/api/history/${promptId}`);
        if (!historyResponse.ok) {
          throw new Error(`获取历史记录失败: ${historyResponse.status}`);
        }
        
        const historyData = await historyResponse.json();
        console.log('历史记录:', historyData);
        
        if (historyData[promptId]?.outputs?.[9]?.images?.[0]) {
          const imageName = historyData[promptId].outputs[9].images[0].filename;
          return `http://127.0.0.1:8188/view?filename=${imageName}`;
        }
      }

    } catch (err) {
      console.error('生成图像错误:', err);
      throw new Error(`生成图像失败: ${err.message}`);
    }
  };

  const analyzeImage = async (imageUrl, originalPrompt) => {
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "Pro/Qwen/Qwen2-VL-7B-Instruct",
          messages: [
            {
              role: "system",
              content: `你是一位极具艺术鉴赏力的高级图像点评官，拥有深厚的视觉艺术、摄影和数字艺术创作背景。请从以下维度对图像进行专业、深入的分析：

1. 构图分析：
   - 画面结构与平衡
   - 主体位置与重点突出
   - 空间层次感
   - 视线引导与动态感

2. 色彩评估：
   - 整体色调与氛围
   - 色彩和谐度与对比
   - 冷暖色调运用
   - 饱和度与明度控制

3. 光影效果：
   - 光源设置与方向
   - 明暗过渡自然度
   - 质感表现
   - 空间氛围营造

4. 细节呈现：
   - 纹理表现
   - 材质效果
   - 边缘处理
   - 细节丰富度

请按以下格式输出分析：
1. 整体印象：[简要总结图像的第一印象和突出特点]
2. 技术分析：[从上述维度进行详细分析]
3. 优秀之处：[列举2-3个特别出色的方面]
4. 改进建议：[提供2-3个具体可行的优化方向]
5. 优化提示词：[基于分析给出优化后的英文提示词建议，包含具体的艺术风格、光影效果、材质细节等关键要素]`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "请分析这张图片的艺术效果，原始提示词是：" + originalPrompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) throw new Error(`API错误: ${response.status}`);
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      console.error('图像分析错误:', err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    setLoading(true);
    setError(null);

    try {
      // 添加用户消息
      setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
      
      // 优化提示词
      setMessages(prev => [...prev, { type: 'system', content: '正在优化提示词...' }]);
      const enhancedPrompt = await enhancePrompt(userMessage);
      
      // 生成图像
      setMessages(prev => [
        ...prev.slice(0, -1),
        { type: 'system', content: '正在生成图像...', promptInfo: enhancedPrompt }
      ]);
      const imageUrl = await generateImage(enhancedPrompt.english);

      // 添加图像消息
      setMessages(prev => [
        ...prev.slice(0, -1),
        { 
          type: 'image', 
          imageUrl: imageUrl,
          promptInfo: enhancedPrompt
        }
      ]);

      // 分析图像
      setMessages(prev => [...prev, { type: 'system', content: '正在分析图像...' }]);
      const analysis = await analyzeImage(imageUrl, enhancedPrompt.english);

      // 添加分析结果
      setMessages(prev => [
        ...prev.slice(0, -1),
        { 
          type: 'analysis',
          content: analysis,
          imageUrl: imageUrl
        }
      ]);

    } catch (err) {
      setError(err.message);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { type: 'error', content: `错误: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            {message.type === 'user' && (
              <div className="message-wrapper user-wrapper">
                <div className="avatar-container">
                  <ROLES.USER.icon />
                  <span className="role-name">{ROLES.USER.name}</span>
                </div>
                <div className="user-message">
                  <div className="message-content">{message.content}</div>
                </div>
              </div>
            )}
            
            {(message.type === 'system' || message.type === 'image') && (
              <div className="message-wrapper ai-wrapper">
                <div className="avatar-container">
                  <ROLES.AI.icon />
                  <span className="role-name">{ROLES.AI.name}</span>
                </div>
                <div className="ai-message">
                  {message.type === 'system' && (
                    <div className="message-content">
                      {message.content}
                      {message.promptInfo && (
                        <div className="prompt-info">
                          <div>优化后的提示词：{message.promptInfo.chinese}</div>
                          <div className="english-prompt">English: {message.promptInfo.english}</div>
                        </div>
                      )}
                    </div>
                  )}
                  {message.type === 'image' && (
                    <div className="image-content">
                      <div className="prompt-info">
                        <div>提示词：{message.promptInfo.chinese}</div>
                        <div className="english-prompt">English: {message.promptInfo.english}</div>
                      </div>
                      <img src={message.imageUrl} alt="Generated" />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {message.type === 'analysis' && (
              <div className="message-wrapper critic-wrapper">
                <div className="avatar-container">
                  <ROLES.CRITIC.icon />
                  <span className="role-name">{ROLES.CRITIC.name}</span>
                </div>
                <div className="analysis-message">
                  <div className="analysis-content">
                    {message.content.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                  <div className="analysis-actions">
                    <button 
                      className="use-suggestion-button"
                      onClick={() => {
                        const match = message.content.match(/优化提示词：(.*)/);
                        if (match) {
                          setInputText(match[1].trim());
                        }
                      }}
                    >
                      使用优化建议重新生成
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {message.type === 'error' && (
              <div className="error-message">
                <div className="message-content">{message.content}</div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="输入你的图像描述..."
          disabled={loading}
          className="chat-input"
        />
        <button 
          type="submit" 
          disabled={loading || !inputText.trim()}
          className="send-button"
        >
          {loading ? '生成中...' : '发送'}
        </button>
      </form>
    </div>
  );
};

export default ImageGenerator; 
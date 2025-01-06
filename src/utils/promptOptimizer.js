export const optimizePrompt = async (originalPrompt) => {
  try {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "你是一位专业的 AI 绘画提示词专家，擅长优化用户的提示词以生成更好的图像。"
          },
          {
            role: "user",
            content: `请优化以下绘画提示词，使其更专业、更详细：\n${originalPrompt}`
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
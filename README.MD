# AI 图像生成器

## 功能特性
- 使用 SiliconFlow API 生成图片
- 支持 stable-diffusion-3-5-large 模型
- 自定义图片尺寸和生成参数

## 配置说明
1. 创建 `.env` 文件并配置 API Key：.


1. 主要组件结构
ImageGenerator.jsx - 核心组件,包含以下主要功能:
角色定义:
const ROLES = {
  USER: { name: '用户', icon: UserIcon },
  AI: { name: 'AI 画师', icon: ArtistIcon },
  CRITIC: { name: '图像点评官', icon: CriticIcon }
};
定义了三个角色及其图标。
主要状态管理:
const [messages, setMessages] = useState([]); // 聊天消息
const [inputText, setInputText] = useState(''); // 输入文本
const [loading, setLoading] = useState(false); // 加载状态
const [error, setError] = useState(null); // 错误状态
核心功能函数:
enhancePrompt: 优化用户输入的提示词
generateImage: 调用API生成图像
analyzeImage: 分析生成的图像
handleSubmit: 处理表单提交
2. 主要流程
提示词优化流程:
const enhancedPrompt = await enhancePrompt(userMessage);
将用户输入转换为优化的英文提示词
返回JSON格式包含英文提示词和中文解释
图像生成流程:
const imageUrl = await generateImage(enhancedPrompt.english);
使用优化后的提示词生成图像
返回生成图像的URL
图像分析流程:
const analysis = await analyzeImage(imageUrl, enhancedPrompt.english);
分析生成的图像
提供专业的艺术评价和建议
3. UI组件结构
消息显示区域:
用户消息
系统消息
图像显示
分析结果
输入区域:
<form onSubmit={handleSubmit} className="input-form">
  <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} />
  <button type="submit">发送</button>
</form>
4. 样式设计 (ImageGenerator.css)
布局样式:
使用Flexbox布局
响应式设计
暗色主题
消息样式:
不同角色消息有不同样式
图像显示优化
分析结果格式化
5. 配置文件
vite.config.js:
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v1': {
        target: 'https://api.siliconflow.cn',
        changeOrigin: true
      }
    }
  }
});
配置开发服务器代理,处理API请求。
6. 安全配置
index.html:
<meta http-equiv="Content-Security-Policy" content="...">
设置内容安全策略(CSP),限制资源加载来源。
7. 图像点评官提示词
export const imageCommentatorPrompt = `...`;export const imageCommentatorPrompt = `...`;
定义了图像点评官的角色和评价标准:
专业描述内容
分析构图、用光、色彩
友善提供改进建议
使用平易近人的语言
主要功能流程:
用户输入图像描述
系统优化提示词
生成图像
专业分析图像
提供改进建议
可以使用优化建议重新生成
这是一个完整的AI图像生成和分析系统,提供了从提示词优化到图像生成,再到专业分析的完整流程。
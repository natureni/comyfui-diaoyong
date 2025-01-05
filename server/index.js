import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const COMFYUI_API = 'http://127.0.0.1:8188';

// 创建正确的工作流配置
const createWorkflow = (prompt) => ({
  "4": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": {
      "ckpt_name": "majicMIX realistic 麦橘写实_v7.safetensors"
    }
  },
  "5": {
    "class_type": "EmptyLatentImage",
    "inputs": {
      "batch_size": 1,
      "height": 512,
      "width": 512
    }
  },
  "6": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "clip": ["4", 1],
      "text": prompt
    }
  },
  "7": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "clip": ["4", 1],
      "text": "text, watermark"
    }
  },
  "3": {
    "class_type": "KSampler",
    "inputs": {
      "cfg": 8,
      "denoise": 1,
      "latent_image": ["5", 0],
      "model": ["4", 0],
      "negative": ["7", 0],
      "positive": ["6", 0],
      "sampler_name": "euler",
      "scheduler": "normal",
      "seed": Math.floor(Math.random() * 1000000),
      "steps": 20
    }
  },
  "8": {
    "class_type": "VAEDecode",
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    }
  },
  "9": {
    "class_type": "SaveImage",
    "inputs": {
      "filename_prefix": "ComfyUI",
      "images": ["8", 0]
    }
  }
});

app.post('/api/prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log('收到生图请求:', prompt);

    // 检查 ComfyUI 服务状态
    try {
      const statsResponse = await fetch(`${COMFYUI_API}/system_stats`);
      if (!statsResponse.ok) {
        throw new Error(`ComfyUI 服务检查失败: ${statsResponse.status}`);
      }
      console.log('ComfyUI 服务正常');
    } catch (error) {
      console.error('ComfyUI 服务检查错误:', error);
      return res.status(503).json({ error: 'ComfyUI 服务未启动或无法访问' });
    }

    // 发送工作流到 ComfyUI
    const workflow = createWorkflow(prompt);
    console.log('发送工作流到 ComfyUI:', JSON.stringify(workflow, null, 2));

    const response = await fetch(`${COMFYUI_API}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: workflow
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ComfyUI 响应错误:', {
        status: response.status,
        text: errorText
      });
      throw new Error(`ComfyUI 响应错误: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('ComfyUI 响应成功:', data);
    res.json(data);

  } catch (error) {
    console.error('处理请求错误:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get('/api/history/:promptId', async (req, res) => {
  try {
    const { promptId } = req.params;
    console.log('获取历史记录:', promptId);
    
    const response = await fetch(`${COMFYUI_API}/history/${promptId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`获取历史记录失败: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('获取历史记录错误:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
  console.log(`ComfyUI 地址: ${COMFYUI_API}`);
}); 
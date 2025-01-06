const ImageSettings = ({ settings, onSettingsChange }) => {
  return (
    <div className="image-settings">
      <h3>图像参数设置</h3>
      
      <div className="setting-item">
        <label>图片尺寸</label>
        <select 
          value={settings.imageSize} 
          onChange={(e) => onSettingsChange('imageSize', e.target.value)}
        >
          <option value="1024x1024">1024 x 1024</option>
          <option value="512x1024">512 x 1024</option>
          <option value="768x512">768 x 512</option>
        </select>
      </div>

      <div className="setting-item">
        <label>生成步数</label>
        <input 
          type="range" 
          min="20" 
          max="100"
          value={settings.steps}
          onChange={(e) => onSettingsChange('steps', e.target.value)}
        />
        <span>{settings.steps}</span>
      </div>

      <div className="setting-item">
        <label>引导系数</label>
        <input 
          type="range" 
          min="1" 
          max="20"
          step="0.5"
          value={settings.guidanceScale}
          onChange={(e) => onSettingsChange('guidanceScale', e.target.value)}
        />
        <span>{settings.guidanceScale}</span>
      </div>
    </div>
  );
}; 
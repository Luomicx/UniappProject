# 上线前检查清单

## 环境配置

- [ ] 在 `config/index.js` 中将 `development` 设置为 `false`
- [ ] 在 `config/index.js` 中将 `debug` 设置为 `false`
- [ ] 在 `config/index.js` 中更新 `production` 环境的 `baseUrl` 为实际的生产环境API地址
- [ ] 在 `config/index.js` 中更新 `version` 为当前版本号

## 代码清理

- [ ] 移除所有未使用的代码和注释
- [ ] 确保没有硬编码的开发环境URL或敏感信息
- [ ] 检查所有TODO注释是否已处理

## 功能测试

- [ ] 测试所有页面的导航和跳转
- [ ] 测试所有表单的提交和验证
- [ ] 测试所有API请求和响应处理
- [ ] 测试错误处理和异常情况
- [ ] 测试用户登录、注册和身份验证
- [ ] 测试图片上传和显示
- [ ] 测试下拉刷新和加载更多

## 性能优化

- [ ] 压缩图片资源
- [ ] 移除未使用的依赖
- [ ] 检查大型组件是否可以懒加载
- [ ] 确保没有内存泄漏

## 安全检查

- [ ] 确保所有API请求使用HTTPS
- [ ] 检查敏感数据是否已加密
- [ ] 确保没有暴露API密钥或其他敏感信息
- [ ] 检查用户输入是否已正确验证和过滤

## 兼容性测试

- [ ] 在不同设备上测试（手机、平板）
- [ ] 在不同操作系统上测试（iOS、Android）
- [ ] 在不同网络条件下测试（WiFi、4G、弱网）

## 最终检查

- [ ] 更新应用版本号
- [ ] 准备发布说明
- [ ] 备份当前代码
- [ ] 执行最终的端到端测试

## 发布后检查

- [ ] 监控应用性能和错误报告
- [ ] 检查用户反馈
- [ ] 准备快速修复计划（如果需要）

## 特定配置检查

### 基础URL配置

```javascript
// 在 config/index.js 中
export const ENV = {
  // 上线前修改为false
  development: false,
  
  baseUrl: {
    development: 'http://127.0.0.1:8000',
    // 真机调试时使用，替换为您的电脑IP地址
    deviceDebug: 'http://192.168.1.100:8000',
    // 上线前修改为实际的生产环境API地址
    production: 'https://api.example.com'
  },
  
  // 上线前修改为false
  debug: false,
  
  // 其他配置...
}
```

### 真机调试配置

在进行真机调试时，请按照以下步骤配置：

1. 确保您的手机和电脑在同一个WiFi网络下
2. 在电脑上查看您的IP地址（Windows可以使用`ipconfig`命令，Mac可以在系统偏好设置中查看）
3. 在`config/index.js`文件中，将`deviceDebug`的值修改为您的电脑IP地址，例如：`http://192.168.1.100:8000`
4. 确保您的后端服务器允许外部访问（不仅仅是localhost）
5. 如果使用的是Node.js服务器，可能需要修改监听地址为`0.0.0.0`而不是`127.0.0.1`

### 日志配置

确保上线前关闭所有调试日志：

```javascript
// 在 utils/logger.js 中
// 当前日志级别，生产环境默认不输出日志
const currentLogLevel = ENV.development ? LogLevel.DEBUG : LogLevel.NONE
```

### 请求配置

确保请求工具正确处理生产环境的API请求：

```javascript
// 在 utils/request.js 中
// 构建完整URL
const baseUrl = getBaseUrl() // 会根据环境自动选择正确的baseUrl
``` 
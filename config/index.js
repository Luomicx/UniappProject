/**
 * 应用配置文件
 * 用于管理环境变量和基础URL
 */

// 环境配置
export const ENV = {
    // 环境标识
    // 开发环境设为true，生产环境设为false
    // 上线前需要修改为false
    development: false,

    // 基础URL配置
    baseUrl: {
        development: 'http://127.0.0.1:8000', // 本地开发环境
        deviceDebug: 'http://192.168.1.100:8000', // 真机调试环境，替换为您的电脑IP地址
        production: 'http://60.205.137.47:8000' // 生产环境，上线时替换为实际域名
    },

    // 版本信息
    version: '1.0.0',

    // 调试模式
    // 控制是否输出调试信息，上线前需要设为false
    debug: false,

    // 其他全局配置
    settings: {
        // 最大历史记录数
        maxHistoryRecords: 20,
        // 默认头像
        defaultAvatar: '/static/user-avatar.svg',
        // 默认AI头像
        defaultAIAvatar: '/static/ai-avatar.svg',
        // 客服电话
        customerServicePhone: '18888888888'
    }
}

/**
 * 获取当前环境的基础URL
 * @returns {string} 当前环境的基础URL
 */
export const getBaseUrl = () => {
    return ENV.development ? ENV.baseUrl.development : ENV.baseUrl.production
}

/**
 * 日志输出函数
 * 只在开发环境和调试模式下输出日志
 * @param {string} type 日志类型：log, error, warn, info
 * @param {string} tag 日志标签
 * @param {any} content 日志内容
 */
export const logger = (type = 'log', tag = '', ...content) => {
    if (ENV.development || ENV.debug) {
        if (tag) {
            console[type](`[${tag}]`, ...content)
        } else {
            console[type](...content)
        }
    }
}

export default {
    ENV,
    getBaseUrl,
    logger
}
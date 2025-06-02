/**
 * 日志工具函数
 * 用于统一管理应用中的日志输出
 */
import { ENV } from '@/config'

/**
 * 日志级别
 */
export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
}

// 当前日志级别，生产环境默认不输出日志
const currentLogLevel = ENV.development ? LogLevel.DEBUG : LogLevel.NONE

/**
 * 日志输出函数
 * @param {string} level 日志级别
 * @param {string} module 模块名称
 * @param {string} message 日志消息
 * @param {any} data 附加数据
 */
export const log = (level, module, message, data) => {
    // 如果当前日志级别高于要输出的级别，则不输出
    if (level < currentLogLevel) return

    // 如果不是开发环境且没有开启调试模式，则不输出
    if (!ENV.development && !ENV.debug) return

    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}][${module}]`

    switch (level) {
        case LogLevel.DEBUG:
            console.log(prefix, message, data || '')
            break
        case LogLevel.INFO:
            console.info(prefix, message, data || '')
            break
        case LogLevel.WARN:
            console.warn(prefix, message, data || '')
            break
        case LogLevel.ERROR:
            console.error(prefix, message, data || '')
            break
    }
}

/**
 * 调试日志
 * @param {string} module 模块名称
 * @param {string} message 日志消息
 * @param {any} data 附加数据
 */
export const debug = (module, message, data) => {
    log(LogLevel.DEBUG, module, message, data)
}

/**
 * 信息日志
 * @param {string} module 模块名称
 * @param {string} message 日志消息
 * @param {any} data 附加数据
 */
export const info = (module, message, data) => {
    log(LogLevel.INFO, module, message, data)
}

/**
 * 警告日志
 * @param {string} module 模块名称
 * @param {string} message 日志消息
 * @param {any} data 附加数据
 */
export const warn = (module, message, data) => {
    log(LogLevel.WARN, module, message, data)
}

/**
 * 错误日志
 * @param {string} module 模块名称
 * @param {string} message 日志消息
 * @param {any} data 附加数据
 */
export const error = (module, message, data) => {
    log(LogLevel.ERROR, module, message, data)
}

export default {
    LogLevel,
    log,
    debug,
    info,
    warn,
    error
}
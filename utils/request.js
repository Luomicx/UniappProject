// 请求工具函数
import { useUserInfoStore } from '@/stores/userInfo'
import { getBaseUrl } from '@/config'
import logger from '@/utils/logger'

// 统一请求方法
export const request = (options) => {
    // 获取用户信息store
    const userInfoStore = useUserInfoStore()

    // 构建完整URL
    const baseUrl = getBaseUrl()
    options.url = `${baseUrl}${options.url}`

    // 开发环境下打印请求URL
    logger.debug('Request', `${options.method || 'GET'} ${options.url}`, options.data)

    // 设置请求头
    options.header = {
        'Content-Type': 'application/json',
        ...options.header
    }

    // 如果有token，添加到请求头
    const token = uni.getStorageSync('token')
    if (token) {
        options.header['Authorization'] = `Bearer ${token}`
    }

    // 发起请求
    return new Promise((resolve, reject) => {
        uni.request({
            ...options,
            success: (res) => {
                try {
                    // 如果有自定义响应处理函数，使用它
                    if (options.handleResponse) {
                        try {
                            const result = options.handleResponse(res.data)
                            resolve(result)
                        } catch (error) {
                            logger.error('Response', 'Custom handler error', error)
                            reject(error)
                        }
                    } else {
                        // 默认处理
                        if (res.statusCode === 200) {
                            logger.debug('Response', `${options.method || 'GET'} ${options.url} Success`, res.data)

                            // 检查响应中是否包含错误信息
                            if (res.data && res.data.detail) {
                                logger.error('Response', `${options.method || 'GET'} ${options.url} API Error`, res.data)
                                reject(res.data)
                                return
                            }

                            resolve(res.data)
                        } else if (res.statusCode === 401) {
                            // 未授权，可能是token过期
                            logger.warn('Auth', 'Token expired or invalid')
                            uni.removeStorageSync('token')
                            uni.showToast({
                                    title: '登录已过期，请重新登录',
                                    icon: 'none'
                                })
                                // 跳转到登录页
                            setTimeout(() => {
                                uni.reLaunch({
                                    url: '/pages/login/index'
                                })
                            }, 1500)
                            reject(res.data || { message: '登录已过期' })
                        } else {
                            // 其他错误
                            const errorMsg = (res.data && res.data.message) ||
                                (res.data && res.data.detail && JSON.stringify(res.data.detail)) ||
                                '请求失败'
                            logger.error('Response', `${options.method || 'GET'} ${options.url} Failed`, {
                                statusCode: res.statusCode,
                                data: res.data
                            })

                            // 只在非AI接口错误时显示Toast
                            if (!options.url.includes('/ai_chat/') && !options.url.includes('/sparkapi/')) {
                                uni.showToast({
                                    title: errorMsg,
                                    icon: 'none'
                                })
                            }

                            reject(res.data || { message: errorMsg })
                        }
                    }
                } catch (error) {
                    logger.error('Response', 'Processing error', error)
                    reject(error)
                }
            },
            fail: (err) => {
                logger.error('Request', 'Network error', err)

                // 只在非AI接口错误时显示Toast
                if (!options.url.includes('/ai_chat/') && !options.url.includes('/sparkapi/')) {
                    uni.showToast({
                        title: '网络连接失败',
                        icon: 'none'
                    })
                }

                reject(err)
            }
        })
    })
}

export default request
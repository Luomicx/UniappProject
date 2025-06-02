/**
 * AI相关API
 * 包含AI聊天和疾病分析接口
 */
import request from '@/utils/request'

/**
 * 与AI助手通信
 * @param {string} text 用户输入的文本
 * @returns {Promise} 返回AI响应
 */
export const communicateWithAI = (text) => {
    return request({
        url: `/ai_chat/communicate?text=${encodeURIComponent(text)}`,
        method: 'POST',
        header: {
            'Content-Type': 'application/json'
        }
    })
}

/**
 * 获取疾病分析
 * @param {string} text 疾病描述文本
 * @returns {Promise} 返回分析结果
 */
export const getIllnessAnalysis = (text) => {
    return request({
        url: `/sparkapi/illness_analysis?text=${encodeURIComponent(text)}`,
        method: 'POST',
        header: {
            'Content-Type': 'application/json'
        }
    })
}

export default {
    communicateWithAI,
    getIllnessAnalysis
}
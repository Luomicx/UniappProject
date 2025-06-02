import request from '@/utils/request'
import { getBaseUrl } from '@/config'

// 上传照片并获取分析结果
export function uploadPhotoAndAnalyze(data) {
    // 小程序环境中不使用FormData，直接构造对象
    const requestData = {}

    // 添加文件信息
    if (data.file) {
        requestData.file = data.file
    }

    // 如果提供了org_id，则添加到请求中
    if (data.org_id) {
        requestData.org_id = data.org_id
    }

    return request({
        url: '/aliyun_predict/detect-by-upload',
        method: 'POST',
        data: requestData,
        header: {
            'content-type': 'multipart/form-data'
        },
        handleResponse: (response) => {
            // 检查响应格式
            if (response && response.data) {
                return response.data
            } else if (response) {
                // 如果响应直接就是结果数据
                return response
            }
            throw new Error((response && response.message) || '皮肤病分析失败')
        }
    })
}

// 获取用户所有照片
export function getUserPhotos() {
    return request({
        url: '/home/user-photos/',
        method: 'GET',
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response && response.data && response.data.message) || '获取照片列表失败')
        }
    })
}

// 获取单张照片信息
export function getPhotoDetail(photoId) {
    return request({
        url: `/home/photo/${photoId}`,
        method: 'GET',
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response && response.data && response.data.message) || '获取照片详情失败')
        }
    })
}

// 更新照片信息
export function updatePhoto(photoId, data) {
    const formData = new FormData()
    if (data.title) {
        formData.append('title', data.title)
    }
    if (data.file) {
        formData.append('file', data.file)
    }

    return request({
        url: `/home/photo/${photoId}`,
        method: 'PUT',
        data: formData,
        header: {
            'content-type': 'multipart/form-data'
        },
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response && response.data && response.data.message) || '更新照片失败')
        }
    })
}

// 删除照片
export function deletePhoto(photoId) {
    return request({
        url: `/home/photo/${photoId}`,
        method: 'DELETE',
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response && response.data && response.data.message) || '删除照片失败')
        }
    })
}

// 获取预约信息列表
export function getAppointments() {
    return request({
        url: '/home/appointments/',
        method: 'GET',
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response && response.data && response.data.message) || '获取预约信息失败')
        }
    })
}

/**
 * 压缩图片
 * @param {string} filePath 图片路径
 * @returns {Promise<string>} 压缩后的图片路径
 */
const compressImage = (filePath) => {
    return new Promise((resolve, reject) => {
        uni.compressImage({
            src: filePath,
            quality: 80, // 压缩质量，范围0-100
            success: (res) => {
                console.log('图片压缩成功:', res.tempFilePath);
                resolve(res.tempFilePath);
            },
            fail: (error) => {
                console.error('图片压缩失败:', error);
                // 压缩失败时使用原图
                resolve(filePath);
            }
        });
    });
};

/**
 * 检查网络状态
 * @returns {Promise<boolean>} 网络是否可用
 */
const checkNetworkStatus = () => {
    return new Promise((resolve) => {
        uni.getNetworkType({
            success: (res) => {
                const networkType = res.networkType;
                console.log('当前网络类型:', networkType);
                // 如果网络类型为none或unknown，则认为网络不可用
                if (networkType === 'none' || networkType === 'unknown') {
                    resolve(false);
                } else {
                    resolve(true);
                }
            },
            fail: () => {
                // 获取网络状态失败，假设网络可用
                resolve(true);
            }
        });
    });
};

/**
 * 上传照片并获取完整诊断结果
 * 这个API合并了照片上传和疾病分析两个步骤
 * @param {string} filePath 照片文件路径
 * @param {number} maxRetries 最大重试次数，默认为2
 * @returns {Promise} 返回完整的诊断结果
 */
export const uploadPhotoAndGetFullDiagnosis = (filePath, maxRetries = 2) => {
    return new Promise(async(resolve, reject) => {
        try {
            // 显示上传进度提示
            uni.showLoading({
                title: '准备上传...',
                mask: true
            });

            // 检查网络状态
            const isNetworkAvailable = await checkNetworkStatus();
            if (!isNetworkAvailable) {
                uni.hideLoading();
                uni.showToast({
                    title: '网络连接不可用，请检查网络设置',
                    icon: 'none',
                    duration: 2000
                });
                reject(new Error('网络连接不可用'));
                return;
            }

            // 压缩图片
            const compressedFilePath = await compressImage(filePath);

            // 定义上传函数，以便于重试
            const uploadWithRetry = (retriesLeft) => {
                console.log(`尝试上传照片，剩余重试次数: ${retriesLeft}`);

                // 创建上传任务
                const uploadTask = uni.uploadFile({
                    url: `${getBaseUrl()}/diagnose/full-diagnosis`,
                    filePath: compressedFilePath,
                    name: 'file',
                    formData: {},
                    timeout: 60000, // 设置60秒超时
                    header: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${uni.getStorageSync('token')}`
                    },
                    success: (uploadRes) => {
                        try {
                            // 解析响应数据
                            const result = JSON.parse(uploadRes.data);
                            console.log('全面诊断API返回数据:', result);

                            // 根据实际API返回格式处理数据
                            if (result) {
                                // 构建完整的诊断结果对象
                                const fullDiagnosisResult = {
                                    disease_name: result.diagnosis && result.diagnosis.disease || '',
                                    confidence: result.diagnosis && result.diagnosis.confidence ? result.diagnosis.confidence / 100 : 0,
                                    image_url: compressedFilePath, // 使用压缩后的文件路径作为图片URL
                                    image_base64: result.image || '', // 保存返回的base64图像
                                    analysis: result.diagnosis && result.diagnosis.methodology || '',
                                    symptoms_description: result.diagnosis && result.diagnosis.disease || '未知症状',
                                    condition_analysis: result.diagnosis && result.diagnosis.methodology || '',
                                    drug_recommendation: result.recommendation || '',
                                    disclaimer: result.disclaimer || '本结果仅供参考，具体诊疗请遵医嘱',
                                    created_at: result.timestamp || new Date().toISOString(),
                                    updated_at: result.timestamp || new Date().toISOString()
                                };

                                uni.hideLoading();
                                resolve(fullDiagnosisResult);
                            } else {
                                throw new Error('诊断失败：无效的响应格式');
                            }
                        } catch (error) {
                            console.error('解析诊断结果失败:', error);

                            uni.hideLoading();

                            if (retriesLeft > 0) {
                                // 如果还有重试次数，则重试
                                uni.showToast({
                                    title: '处理响应失败，正在重试...',
                                    icon: 'none',
                                    duration: 1500
                                });

                                setTimeout(() => {
                                    uploadWithRetry(retriesLeft - 1);
                                }, 2000);
                            } else {
                                reject(new Error('解析诊断结果失败'));
                            }
                        }
                    },
                    fail: (error) => {
                        console.error('上传照片失败:', error);

                        uni.hideLoading();

                        if (retriesLeft > 0 && (error.errMsg.includes('timeout') || error.errMsg.includes('fail'))) {
                            // 如果是超时错误且还有重试次数，则重试
                            uni.showToast({
                                title: '上传超时，正在重试...',
                                icon: 'none',
                                duration: 1500
                            });

                            setTimeout(() => {
                                uploadWithRetry(retriesLeft - 1);
                            }, 2000);
                        } else {
                            reject(new Error('上传照片失败，请检查网络连接'));
                        }
                    }
                });

                // 监听上传进度
                uploadTask.onProgressUpdate((res) => {
                    const progress = res.progress;
                    console.log('上传进度:', progress);

                    // 更新加载提示
                    if (progress < 100) {
                        uni.showLoading({
                            title: `上传中 ${progress}%`,
                            mask: true
                        });
                    } else {
                        uni.showLoading({
                            title: '处理中...',
                            mask: true
                        });
                    }
                });
            };

            // 开始上传，最大重试次数由参数决定
            uploadWithRetry(maxRetries);
        } catch (error) {
            console.error('上传照片失败:', error);
            uni.hideLoading();
            reject(new Error('上传照片失败，请检查网络连接'));
        }
    });
};
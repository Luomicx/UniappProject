import request from '@/utils/request'

// 普通文件上传
export const uploadFile = (file) => {
    return request({
        url: '/upload/',
        method: 'POST',
        header: {
            'content-type': 'multipart/form-data'
        },
        data: { file },
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error(response.data.message || '文件上传失败')
        }
    })
}

// 上传病症照片并分析
export const uploadPhotoAndAnalyze = (data) => {
    return request({
        url: '/upload-photo/',
        method: 'POST',
        header: {
            'content-type': 'multipart/form-data'
        },
        data,
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error(response.data.message || '照片上传失败')
        }
    })
}

// 获取用户照片列表
export const getUserPhotos = () => {
    return request({
        url: '/user-photos/',
        method: 'GET',
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error(response.data.message || '获取照片列表失败')
        }
    })
}

// 创建病历信息
export const createMedicalRecord = (data) => {
    return request({
        url: '/create_medicalrecord_info/',
        method: 'POST',
        data: {
            symptoms_description: data.symptoms_description,
            detailed_description: data.detailed_description,
            condition_analysis: data.condition_analysis,
            drug_recommendation: data.drug_recommendation,
            image: data.image
        },
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error(response.data.message || '创建病历失败')
        }
    })
}
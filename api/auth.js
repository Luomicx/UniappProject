import request from '@/utils/request'

// 用户注册
export function register(data) {
    return request({
        url: '/register/',
        method: 'POST',
        data,
        handleResponse: (response) => {
            // 检查响应格式
            if (response && (response.code === 200 || response.status === 200)) {
                return response.data || response
            }

            // 提取错误信息
            let errorMsg = '注册失败'
            if (response) {
                if (response.message) {
                    errorMsg = response.message
                } else if (response.data && response.data.message) {
                    errorMsg = response.data.message
                } else if (response.msg) {
                    errorMsg = response.msg
                } else if (response.error) {
                    errorMsg = response.error
                }
            }

            throw new Error(errorMsg)
        }
    })
}

// 用户登录
export function login(data) {
    return request({
        url: '/token/',
        method: 'POST',
        data,
        header: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        handleResponse: (response) => {
            // 如果响应包含 access_token，说明是标准的 OAuth2 格式
            if (response.access_token) {
                return {
                    token: response.access_token,
                    token_type: response.token_type || 'Bearer'
                }
            }

            // 如果响应有嵌套的 data 结构
            if (response.data && response.data.access_token) {
                return {
                    token: response.data.access_token,
                    token_type: response.data.token_type || 'Bearer'
                }
            }

            throw new Error('登录失败：无效的响应格式')
        }
    })
}

// 选择身份
export function selectIdentity(data) {
    const identity = data.identity;
    let url = `/select_identity/?identity=${identity}`;
    return request({
        url,
        method: 'POST',
        data,
        header: {
            'content-type': 'application/json'
        },
        handleResponse: (response) => {
            // 检查响应格式
            if (response.code === 200 && response.data) {
                return response.data
            }
            throw new Error('选择身份失败：无效的响应格式')
        }
    })
}

// 创建患者信息
export function createPatientInfo(data) {
    return request({
        url: '/create_patient_info/',
        method: 'POST',
        data: {
            name: data.name,
            age: data.age,
            gender: data.gender,
            id_card: data.id_card,
            marital_status: data.marital_status,
            ethnicity: data.ethnicity,
            residence: data.residence,
            birth_date: data.birth_date,
            phone_number: data.phone_number
        },
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error(response.data.message || '创建患者信息失败')
        }
    })
}

// 创建医生信息
export function createDoctorInfo(data) {
    return request({
        url: '/create_doctor_info/',
        method: 'POST',
        data: {
            name: data.name,
            working_years: data.working_years,
            gender: data.gender,
            hospital: data.hospital,
            title: data.title,
            registration_fee: data.registration_fee,
            introduction: data.introduction,
            expertise: data.expertise,
            payment_qr_code: data.payment_qr_code
        },
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error(response.data.message || '创建医生信息失败')
        }
    })
}

// 获取用户信息
export function getUserInfo() {
    return request({
        url: '/user/info/',
        method: 'GET',
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error(response.data.message || '获取用户信息失败')
        }
    })
}

// 更新用户信息
export function updateUserInfo(data) {
    return request({
        url: '/user/info/',
        method: 'PUT',
        data,
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error(response.data.message || '更新用户信息失败')
        }
    })
}
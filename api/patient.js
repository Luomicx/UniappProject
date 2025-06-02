import request from '@/utils/request'

// 获取患者信息
export const getPatientInfo = () => {
    return request({
        url: '/patient/info',
        method: 'GET'
    })
}

// 更新患者信息
export const updatePatientInfo = (data) => {
    return request({
        url: '/patient/info',
        method: 'PUT',
        data
    })
}

// 获取病历列表
export const getMedicalRecords = () => {
    // 从本地存储获取用户手机号
    const userInfo = uni.getStorageSync('userInfo') || {}
    const phoneNumber = userInfo.phone_number || '17732021493'

    return request({
        url: `/medical_record/get_medicalrecord_info/`,
        method: 'GET',
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response.data && response.data.message) || '获取病历失败')
        }
    })
}

// 获取预约列表
export const getAppointments = () => {
    return request({
        url: '/patient/appointments',
        method: 'GET'
    })
}

// 获取预约详情
export const getAppointmentDetail = (id) => {
    return request({
        url: `/patient/appointments/${id}`,
        method: 'GET'
    })
}

// 创建预约
export const createAppointment = (data) => {
    return request({
        url: '/patient/appointments',
        method: 'POST',
        data
    })
}

// 取消预约
export const cancelAppointment = (id) => {
    return request({
        url: `/patient/appointments/${id}/cancel`,
        method: 'POST'
    })
}

// 上传照片并诊断
export const uploadPhotoForDiagnosis = (data) => {
    return request({
        url: '/patient/diagnosis/photo',
        method: 'POST',
        data
    })
}

// 获取医生的患者列表
export const getPatientList = () => {
    return request({
        url: '/doctor/patients',
        method: 'GET'
    })
}

// 获取患者详细信息
export const getPatientDetail = (patientId) => {
    return request({
        url: `/doctor/patients/${patientId}`,
        method: 'GET'
    })
}

// 获取患者就诊记录
export const getPatientVisits = (patientId) => {
    return request({
        url: `/doctor/patients/${patientId}/visits`,
        method: 'GET'
    })
}
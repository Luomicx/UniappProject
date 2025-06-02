import request from '@/utils/request'

// 获取医生列表
export const getDoctorList = (params) => {
    return request({
        url: '/add_patients_doctors/doctors_list/',
        method: 'GET',
        data: params
    })
}

// 获取医生详情
export const getDoctorDetail = (doctorId) => {
    return request({
        url: `/add_patients_doctors/doctor/${doctorId}/`,
        method: 'GET'
    })
}

// 获取医生预约列表
export const getDoctorAppointments = (date) => {
    return request({
        url: '/doctor/appointments',
        method: 'GET',
        data: { date }
    })
}

// 获取医生个人信息
export const getDoctorInfo = (id) => {
    return request({
        url: `/add_patients_doctors/doctor_info/${id}`,
        method: 'GET'
    })
}

// 更新医生个人信息
export const updateDoctorInfo = (data) => {
    return request({
        url: '/add_patients_doctors/update_doctor_info/',
        method: 'PUT',
        data
    })
}

// 创建医生信息
export const createDoctorInfo = (data) => {
    return request({
        url: '/create_doctor_info/',
        method: 'POST',
        data
    })
}

// 获取医生工作时间表
export const getDoctorSchedule = (doctorId, date) => {
    return request({
        url: doctorId ? `/doctor/${doctorId}/schedule` : '/doctor/schedule',
        method: 'GET',
        data: { date }
    })
}

// 更新医生工作时间表
export const updateDoctorSchedule = (data) => {
    return request({
        url: '/doctor/schedule',
        method: 'PUT',
        data
    })
}

// 获取预约列表
export const getAppointmentList = () => {
    return request({
        url: '/appoint/appoint/list/',
        method: 'GET',
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response.data && response.data.message) || '获取预约列表失败')
        }
    })
}

// 获取预约详情
export const getAppointmentDetail = (appointmentId) => {
    return request({
        url: `/appoint/appoint/${appointmentId}/detail`,
        method: 'GET',
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response.data && response.data.message) || '获取预约详情失败')
        }
    })
}

// 确认预约
export const confirmAppointment = (doctorId, appointmentNumber) => {
    return request({
        url: `/appoint/appoint/${doctorId}/`,
        method: 'PUT',
        data: {
            status: '已确认',
            appointment_number: appointmentNumber
        },
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response.data && response.data.message) || '确认预约失败')
        }
    })
}

// 取消预约
export const cancelAppointment = (doctorId, appointmentNumber) => {
    return request({
        url: `/appoint/appoint/${doctorId}/`,
        method: 'DELETE',
        data: {
            appointment_number: appointmentNumber
        },
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response.data && response.data.message) || '取消预约失败')
        }
    })
}

// 上传医生相关图片
export const uploadDoctorImage = (filePath, type = 'payment_qr') => {
    return new Promise((resolve, reject) => {
        uni.uploadFile({
            url: request.baseUrl + '/add_patients_doctors/upload_image/',
            filePath,
            name: 'file',
            formData: {
                type: type // payment_qr: 支付二维码, avatar: 头像
            },
            success: (res) => {
                if (res.statusCode === 200) {
                    try {
                        const data = JSON.parse(res.data)
                        resolve(data)
                    } catch (e) {
                        reject(new Error('解析响应数据失败'))
                    }
                } else {
                    reject(new Error('上传失败'))
                }
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

// 提交诊疗建议
export const submitDiagnosisAdvice = (data) => {
    return request({
        url: `/doctor_operate/kanzhen/?cure_description=${data.cure_description}`,
        method: 'GET',
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response.data && response.data.message) || '提交诊疗建议失败')
        }
    })
}

// 获取病历单列表
export const getMedicalRecordsList = () => {
    return request({
        url: '/medical_record/medical_records_list/',
        method: 'GET',
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response.data && response.data.message) || '获取病历列表失败')
        }
    })
}

// 不再需要单独的详情API，从列表中筛选
// export const getMedicalRecordDetail = (recordId) => {
//     return request({
//         url: `/medical_record/medical_records_list/${recordId}/`,
//         method: 'GET',
//         handleResponse: (response) => {
//             if (response.code === 200) {
//                 return response.data
//             }
//             throw new Error((response.data && response.data.message) || '获取病历详情失败')
//         }
//     })
// }
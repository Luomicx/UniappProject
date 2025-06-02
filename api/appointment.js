import request from '@/utils/request'

// 创建预约订单
export const createAppointment = (data) => {
    // 将日期时间字符串拆分为日期和时间
    const [date, time] = data.appointment_time.split(' ')
        // 将日期转换为后端要求的格式（YYYY年MM月DD日）
    const [year, month, day] = date.split('-')
    const formattedDate = `${year}年${month}月${day}日`
        // 组合新的预约时间字符串
    const formattedAppointmentTime = `${formattedDate}`

    return request({
        url: '/appoint/appoint',
        method: 'POST',
        data: {
            doctor_id: data.doctor_id,
            appointment_time: formattedAppointmentTime,
        },
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response.data && response.data.message) || '创建预约失败')
        }
    })
}

// 删除预约订单
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

// 修改预约订单
export const updateAppointment = (doctorId, appointmentNumber, data) => {
    return request({
        url: `/appoint/appoint/${doctorId}/`,
        method: 'PUT',
        data: {
            doctor_id: data.doctor_id,
            appointment_time: data.appointment_time,
            appointment_number: appointmentNumber
        },
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data
            }
            throw new Error((response.data && response.data.message) || '修改预约失败')
        }
    })
}

// 获取预约列表
export const getAppointmentList = () => {
    return request({
        url: '/appoint/appoint/list/',
        method: 'GET',
        handleResponse: (response) => {
            if (response && response.code === 200) {
                return {
                    code: 200,
                    data: response.data || []
                }
            }
            return {
                code: response.code || 500,
                data: []
            }
        }
    })
}

// 检查时间段是否可预约
export const checkTimeSlotAvailability = (doctorId, date) => {
    return request({
        url: `/appoint/doctor/${doctorId}/time-slots/check`,
        method: 'GET',
        data: {
            doctorId,
            date
        },
        handleResponse: (response) => {
            if (response.code === 200) {
                return response.data.is_available
            }
            throw new Error((response.data && response.data.message) || '检查时间段可用性失败')
        }
    })
}

// 获取预约详情
export const getAppointmentDetail = (appointmentId) => {
    return request({
        url: `/appoint/appoint/${appointmentId}/detail`,
        method: 'GET',
        handleResponse: (response) => {
            // 检查响应格式
            if (response && response.data) {
                return {
                    code: response.code,
                    data: response.data
                }
            }
            throw new Error('获取预约详情失败：无效的响应格式')
        }
    })
}
// 获取病历列表
export const getMedicalRecords = () => {
    return new Promise((resolve, reject) => {
        // TODO: 实现后端 API 调用
        uni.request({
            url: '/api/patient/medical-records',
            method: 'GET',
            success: (res) => {
                resolve(res.data)
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

// 获取病历详情
export const getMedicalRecordDetail = (id) => {
    return new Promise((resolve, reject) => {
        // TODO: 实现后端 API 调用
        uni.request({
            url: `/api/patient/medical-records/${id}`,
            method: 'GET',
            success: (res) => {
                resolve(res.data)
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}
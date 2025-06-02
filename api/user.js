import request from '@/utils/request'

/**
 * 更新患者信息
 * @param {Object} patientInfo - 患者信息对象
 * @param {string} patientInfo.name - 姓名
 * @param {string} patientInfo.age - 年龄（字符串类型）
 * @param {string} patientInfo.gender - 性别 ("男"/"女")
 * @param {string} patientInfo.id_card - 身份证号
 * @param {string} patientInfo.marital_status - 婚姻状况
 * @param {string} patientInfo.ethnicity - 民族
 * @param {string} patientInfo.residence - 居住地
 * @param {string} patientInfo.birth_date - 出生日期
 * @returns {Promise} - 返回更新后的患者信息
 */
export function updatePatientInfo(patientInfo) {
    return request({
        url: '/add_patients_doctors/update_patient_info/',
        method: 'PUT',
        data: patientInfo
    })
}

/**
 * 获取患者信息
 * @returns {Promise} - 返回患者信息
 */
export function getPatientInfo() {
    return request({
        url: '/add_patients_doctors/patient_info/',
        method: 'GET'
    })
}